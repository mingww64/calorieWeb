/**
 * USDA FoodData Central API Integration
 * Searches for foods and extracts nutrition data from search results
 * Docs: https://fdc.nal.usda.gov/api-guide.html
 */

const USDA_API_KEY = process.env.USDA_API_KEY;
const USDA_API_URL = 'https://api.nal.usda.gov/fdc/v1';

/**
 * Search USDA FoodData Central for multiple foods
 * Returns array of search results with embedded nutrition data
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

    const searchResponse = await fetch(searchUrl.toString());

    if (!searchResponse.ok) {
      console.error(`USDA API search error: ${searchResponse.status}`);
      return { error: `USDA API error: ${searchResponse.status}`, suggestions: [] };
    }

    const searchData = await searchResponse.json();

    if (!searchData.foods || searchData.foods.length === 0) {
      return { error: `No foods found for "${foodName}"`, suggestions: [] };
    }

    const suggestions = searchData.foods.map(food => {
      // Extract nutrients directly from search results
      const nutrients = extractNutrients(food);
      
      return {
        fdcId: food.fdcId,
        name: food.description,
        dataType: food.dataType,
        brandOwner: food.brandOwner || null,
        publishedDate: food.publishedDate || null,
        // Include nutrition data directly in search results
        calories: nutrients.calories,
        protein: nutrients.protein,
        fat: nutrients.fat,
        carbs: nutrients.carbs,
        hasNutrients: nutrients.calories > 0 || nutrients.protein > 0 || nutrients.fat > 0 || nutrients.carbs > 0
      };
    });

    console.log(`Found ${suggestions.length} foods for "${foodName}"`);
    return { error: null, suggestions };
  } catch (error) {
    console.error('USDA API error:', error.message);
    return { error: `Search failed: ${error.message}`, suggestions: [] };
  }
}

/**
 * Extract nutrient values from USDA food data
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
    console.log(`No nutrients found for food: ${foodData.description || 'Unknown'}`);
    return nutrients;
  }

  // Map USDA nutrient IDs to our fields
  const nutrientMap = {
    '208': 'calories',    // Energy (kcal)
    '1008': 'calories',   // Energy (kcal) - alternate ID
    '203': 'protein',     // Protein (g)
    '1003': 'protein',    // Protein (g) - alternate ID  
    '204': 'fat',         // Total lipid (fat) (g)
    '1004': 'fat',        // Total lipid (fat) (g) - alternate ID
    '205': 'carbs',       // Carbohydrate, by difference (g)
    '1005': 'carbs',      // Carbohydrate, by difference (g) - alternate ID
    '269': 'carbs',       // Total sugars (g) - fallback for carbs
    '291': 'carbs',       // Fiber, total dietary (g) - can add to carbs
  };

  console.log(`Extracting nutrients for: ${foodData.description || 'Unknown'}`);
  console.log(`Found ${foodData.foodNutrients.length} nutrients`);

  for (const nutrient of foodData.foodNutrients) {
    // Handle different nutrient data structures from API
    const nutrientId = String(nutrient.number || nutrient.nutrient?.id || nutrient.nutrientId);
    const field = nutrientMap[nutrientId];

    if (field && nutrient.amount !== null && nutrient.amount !== undefined) {
      const value = parseFloat(nutrient.amount || nutrient.value || 0);
      
      if (value > 0) {
        // For carbs, we might want to add fiber to total carbs
        if (field === 'carbs' && (nutrientId === '291')) {
          // Add fiber to existing carbs
          nutrients[field] += Math.round(value * 10) / 10;
        } else {
          // Round to 1 decimal place and ensure we take the highest value if multiple entries
          nutrients[field] = Math.max(nutrients[field], Math.round(value * 10) / 10);
        }
        
        console.log(`  ${nutrient.name || 'Unknown nutrient'} (${nutrientId}): ${value} -> ${field}`);
      }
    }
  }

  // For calories, if not found, estimate from macros (4 cal/g protein & carbs, 9 cal/g fat)
  if (nutrients.calories === 0 && (nutrients.protein || nutrients.fat || nutrients.carbs)) {
    nutrients.calories = Math.round(
      (nutrients.protein * 4) + 
      (nutrients.fat * 9) + 
      (nutrients.carbs * 4)
    );
    console.log(`  Estimated calories from macros: ${nutrients.calories}`);
  }

  console.log(`Final nutrients:`, nutrients);
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

// No estimation functions - users must provide manual data or select from USDA search results
