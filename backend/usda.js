/**
 * USDA FoodData Central API Integration
 * Fetches real nutrient data for foods
 * Docs: https://fdc.nal.usda.gov/api-guide.html
 */

const USDA_API_KEY = process.env.USDA_API_KEY;
const USDA_API_URL = 'https://api.nal.usda.gov/fdc/v1';

// Cache to avoid repeated API calls
const foodCache = new Map();

/**
 * Search USDA FoodData Central for multiple foods
 * Returns array of search results for user to choose from
 */
export async function searchUSDAFoods(foodName, limit = 5) {
  if (!USDA_API_KEY) {
    return { error: 'USDA_API_KEY not configured', suggestions: [] };
  }

  try {
    const searchUrl = new URL(`${USDA_API_URL}/foods/search`);
    searchUrl.searchParams.set('query', foodName);
    searchUrl.searchParams.set('pageSize', limit.toString());
    searchUrl.searchParams.set('api_key', USDA_API_KEY);
    searchUrl.searchParams.set('dataType', 'Foundation,SR Legacy'); // Focus on foods with good nutrient data

    console.log(`USDA search URL: ${searchUrl.toString()}`);
    const searchResponse = await fetch(searchUrl.toString());

    if (!searchResponse.ok) {
      console.error(`USDA API search error: ${searchResponse.status}`);
      return { error: `USDA API error: ${searchResponse.status}`, suggestions: [] };
    }

    const searchData = await searchResponse.json();

    if (!searchData.foods || searchData.foods.length === 0) {
      return { error: `No foods found for "${foodName}"`, suggestions: [] };
    }

    const suggestions = searchData.foods.map(food => ({
      fdcId: food.fdcId,
      name: food.description,
      dataType: food.dataType,
      brandOwner: food.brandOwner || null,
      publishedDate: food.publishedDate || null,
      // Add indicator if this food is likely to have complete nutrient data
      hasDetailedNutrients: food.dataType === 'Foundation' || food.dataType === 'SR Legacy'
    }));

    console.log(`Found ${suggestions.length} foods for "${foodName}":`, 
                suggestions.map(s => `${s.name} (${s.fdcId}, ${s.dataType})`));

    return { error: null, suggestions };
  } catch (error) {
    console.error('USDA API error:', error.message);
    return { error: `Search failed: ${error.message}`, suggestions: [] };
  }
}

/**
 * Get specific USDA food by FDC ID with full nutrient data
 * Returns detailed nutrient data for selected food
 */
export async function getUSDAFoodById(fdcId) {
  // Check cache first
  const cacheKey = `fdc:${fdcId}`;
  if (foodCache.has(cacheKey)) {
    return foodCache.get(cacheKey);
  }

  if (!USDA_API_KEY) {
    return { error: 'USDA_API_KEY not configured', nutrients: null };
  }

  try {
    // Get detailed food data by FDC ID
    const detailUrl = new URL(`${USDA_API_URL}/food/${fdcId}`);
    detailUrl.searchParams.set('api_key', USDA_API_KEY);
    detailUrl.searchParams.set('format', 'abridged'); // Request abridged format for better compatibility
    detailUrl.searchParams.set('nutrients', '203,204,205,208'); // Protein, Fat, Carbs, Calories

    console.log(`Fetching USDA food details for FDC ID: ${fdcId}`);
    console.log(`Detail URL: ${detailUrl.toString()}`);
    
    const detailResponse = await fetch(detailUrl.toString());
    
    console.log(`Response status: ${detailResponse.status}`);
    
    if (!detailResponse.ok) {
      const errorText = await detailResponse.text();
      console.error(`USDA API detail error: ${detailResponse.status} - ${errorText}`);
      
      // Try alternate endpoint for some food types
      if (detailResponse.status === 404) {
        console.log(`Trying alternate API approach for FDC ID: ${fdcId}`);
        return await tryAlternateUSDAApproach(fdcId);
      }
      
      return { error: `USDA API error: ${detailResponse.status}`, nutrients: null };
    }

    const food = await detailResponse.json();
    console.log(`Received food data:`, {
      fdcId: food.fdcId,
      description: food.description,
      dataType: food.dataType,
      nutrientCount: food.foodNutrients?.length || 0
    });
    
    const nutrients = extractNutrients(food);
    console.log(`Extracted nutrients:`, nutrients);

    if (!nutrients || nutrients.calories === 0) {
      console.warn(`No valid nutrients extracted for FDC ID: ${fdcId}`);
      return { error: 'No nutrient data available for this food', nutrients: null };
    }

    const result = {
      fdcId: food.fdcId,
      name: food.description,
      calories: nutrients.calories,
      protein: nutrients.protein,
      fat: nutrients.fat,
      carbs: nutrients.carbs,
      dataType: food.dataType
    };

    // Cache the result
    foodCache.set(cacheKey, result);
    return { error: null, nutrients: result };
  } catch (error) {
    console.error('USDA API error:', error.message);
    return { error: `Failed to fetch food data: ${error.message}`, nutrients: null };
  }
}

/**
 * Extract nutrient values from USDA search result
 * Per 100g serving (or per serving if not available)
 */
function extractNutrients(foodData) {
  const nutrients = {
    calories: 0,
    protein: 0,
    fat: 0,
    carbs: 0,
  };

  if (!foodData.foodNutrients || !Array.isArray(foodData.foodNutrients)) {
    return nutrients;
  }

  // Map USDA nutrient IDs to our fields
  // These are the standard USDA nutrient IDs
  const nutrientMap = {
    1008: 'calories',     // Energy (kcal)
    1003: 'protein',      // Protein (g)
    1004: 'fat',          // Total lipid (fat) (g)
    1005: 'carbs',        // Carbohydrate, by difference (g)
    203: 'protein',       // Protein (g) - alternate ID
    204: 'fat',           // Total lipid (fat) (g) - alternate ID
    205: 'carbs',         // Carbohydrate, by difference (g) - alternate ID
  };

  for (const nutrient of foodData.foodNutrients) {
    const nutrientId = nutrient.nutrient?.id || nutrient.nutrientId;
    const field = nutrientMap[nutrientId];

    if (field && nutrient.value !== null && nutrient.value !== undefined) {
      // Use amount or value depending on structure
      const value = nutrient.amount || nutrient.value || 0;
      // Round to 1 decimal place
      nutrients[field] = Math.max(0, Math.round(value * 10) / 10);
    }
  }

  // For calories, if not found, estimate from macros (4 cal/g protein & carbs, 9 cal/g fat)
  if (nutrients.calories === 0 && (nutrients.protein || nutrients.fat || nutrients.carbs)) {
    nutrients.calories = Math.round(
      (nutrients.protein * 4) + 
      (nutrients.fat * 9) + 
      (nutrients.carbs * 4)
    );
  }

  return nutrients;
}

/**
 * Get nutrients for 100g reference, adjusted for quantity
 */
export function adjustNutrients(nutrient, quantity = 100) {
  if (!nutrient) return null;

  const multiplier = quantity / 100;
  return {
    calories: Math.round(nutrient.calories * multiplier),
    protein: Math.round(nutrient.protein * multiplier * 10) / 10,
    fat: Math.round(nutrient.fat * multiplier * 10) / 10,
    carbs: Math.round(nutrient.carbs * multiplier * 10) / 10,
  };
}

/**
 * Try alternate USDA API approach for foods that fail the individual food endpoint
 * Uses the foods/list endpoint or falls back to manual entry
 */
async function tryAlternateUSDAApproach(fdcId) {
  try {
    console.log(`Trying bulk lookup for FDC ID: ${fdcId}`);
    
    // Try bulk foods endpoint
    const bulkUrl = new URL(`${USDA_API_URL}/foods`);
    bulkUrl.searchParams.set('api_key', USDA_API_KEY);
    bulkUrl.searchParams.set('fdcIds', fdcId.toString());
    bulkUrl.searchParams.set('format', 'abridged');

    const bulkResponse = await fetch(bulkUrl.toString());
    
    if (bulkResponse.ok) {
      const bulkData = await bulkResponse.json();
      
      if (bulkData && bulkData.length > 0) {
        const food = bulkData[0];
        console.log(`Bulk lookup successful for FDC ID: ${fdcId}`);
        
        const nutrients = extractNutrients(food);
        
        if (nutrients && nutrients.calories > 0) {
          return {
            error: null,
            nutrients: {
              fdcId: food.fdcId,
              name: food.description,
              calories: nutrients.calories,
              protein: nutrients.protein,
              fat: nutrients.fat,
              carbs: nutrients.carbs,
              dataType: food.dataType
            }
          };
        }
      }
    }
    
    console.log(`Both endpoints failed for FDC ID: ${fdcId}`);
    return { 
      error: 'Food data not available - please enter nutrition manually', 
      nutrients: null 
    };
  } catch (error) {
    console.error('Alternate USDA approach failed:', error);
    return { 
      error: 'Food data not available - please enter nutrition manually', 
      nutrients: null 
    };
  }
}

// No estimation functions - users must provide manual data or select from USDA results
