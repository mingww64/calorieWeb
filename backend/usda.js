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
 * Search USDA FoodData Central for a food
 * Returns top result with nutrient data
 */
export async function searchUSDAFood(foodName) {
  // Check cache first
  const cacheKey = foodName.toLowerCase();
  if (foodCache.has(cacheKey)) {
    return foodCache.get(cacheKey);
  }

  if (!USDA_API_KEY) {
    console.warn('USDA_API_KEY not set, using fallback estimates');
    return null;
  }

  try {
    // Search for the food with explicit nutrients parameter
    const searchUrl = new URL(`${USDA_API_URL}/foods/search`);
    searchUrl.searchParams.set('query', foodName);
    searchUrl.searchParams.set('pageSize', '1');
    searchUrl.searchParams.set('api_key', USDA_API_KEY);

    const searchResponse = await fetch(searchUrl.toString());

    if (!searchResponse.ok) {
      console.error(`USDA API search error: ${searchResponse.status}`);
      return null;
    }

    const searchData = await searchResponse.json();

    if (!searchData.foods || searchData.foods.length === 0) {
      console.warn(`No USDA food found for: ${foodName}`);
      return null;
    }

    const food = searchData.foods[0];
    const nutrients = extractNutrients(food);

    if (!nutrients || nutrients.calories === 0) {
      console.warn(`No nutrient data found for: ${foodName}`);
      return null;
    }

    const result = {
      name: food.description,
      fdcId: food.fdcId,
      calories: nutrients.calories,
      protein: nutrients.protein,
      fat: nutrients.fat,
      carbs: nutrients.carbs,
    };

    // Cache the result
    foodCache.set(cacheKey, result);
    return result;
  } catch (error) {
    console.error('USDA API error:', error.message);
    return null;
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
 * Estimate nutrients using simple ratios (fallback)
 * Used when USDA API is unavailable
 */
export function estimateNutrients(calories) {
  return {
    calories,
    protein: Math.round((calories * 0.25) / 4 * 10) / 10,    // 25% / 4 cal/g
    fat: Math.round((calories * 0.35) / 9 * 10) / 10,        // 35% / 9 cal/g
    carbs: Math.round((calories * 0.40) / 4 * 10) / 10,      // 40% / 4 cal/g
  };
}
