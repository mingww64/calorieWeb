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
    // Search for the food
    const searchUrl = `${USDA_API_URL}/foods/search?query=${encodeURIComponent(foodName)}&pageSize=1&api_key=${USDA_API_KEY}`;
    const searchResponse = await fetch(searchUrl);

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
    const fdcId = food.fdcId;

    // Get detailed nutrient data
    const detailUrl = `${USDA_API_URL}/foods/${fdcId}?api_key=${USDA_API_KEY}`;
    const detailResponse = await fetch(detailUrl);

    if (!detailResponse.ok) {
      console.error(`USDA API detail error: ${detailResponse.status}`);
      return null;
    }

    const detailData = await detailResponse.json();
    const nutrients = extractNutrients(detailData);

    const result = {
      name: food.description,
      fdcId,
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
 * Extract nutrient values from USDA food details
 * Per 100g serving
 */
function extractNutrients(foodData) {
  const nutrients = {
    calories: 0,
    protein: 0,
    fat: 0,
    carbs: 0,
  };

  if (!foodData.foodNutrients) {
    return nutrients;
  }

  // Map USDA nutrient IDs to our fields
  const nutrientMap = {
    1008: 'calories',     // Energy (kcal)
    1003: 'protein',      // Protein (g)
    1004: 'fat',          // Total lipid (fat) (g)
    1005: 'carbs',        // Carbohydrate (g)
  };

  for (const nutrient of foodData.foodNutrients) {
    const nutrientId = nutrient.nutrient.id;
    const field = nutrientMap[nutrientId];

    if (field && nutrient.value !== null) {
      // Round to 1 decimal place
      nutrients[field] = Math.round(nutrient.value * 10) / 10;
    }
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
