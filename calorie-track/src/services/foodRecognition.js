/**
 * Food Recognition Service using TensorFlow.js and MobileNet
 * Uses lazy loading to keep initial bundle size small
 */

// Cache for the loaded model to avoid reloading
let model = null;
let isLoading = false;
let loadPromise = null;

/**
 * Loads the MobileNet model with lazy loading
 * Uses dynamic imports to create a separate chunk
 * @returns {Promise<Object>} The loaded MobileNet model
 */
async function loadModel() {
  if (model) {
    return model;
  }

  if (isLoading && loadPromise) {
    return loadPromise;
  }

  isLoading = true;
  loadPromise = (async () => {
    try {
      // Dynamic imports - these will be code-split into separate chunks
      const mobilenetModule = await import('@tensorflow-models/mobilenet');
      const tf = await import('@tensorflow/tfjs');

      // Initialize TensorFlow.js backend (WebGL for GPU acceleration, falls back to CPU)
      try {
        await tf.setBackend('webgl');
      } catch (webglError) {
        await tf.setBackend('cpu');
      }

      await tf.ready();

     model = await mobilenetModule.load({
        version: 1,
        alpha: 1.0,
      });

      isLoading = false;
      return model;
    } catch (error) {
      isLoading = false;
      loadPromise = null;
      throw new Error(`Failed to load model: ${error.message}`);
    }
  })();

  return loadPromise;
}

/**
 * Preprocesses an image for MobileNet input
 * @param {HTMLImageElement|HTMLCanvasElement|ImageData|string} image - Image element, canvas, ImageData, or data URL
 * @returns {Promise<tf.Tensor3D>} Preprocessed tensor
 */
async function preprocessImage(image) {  
  let imageElement;
  
  // Handle data URL strings (from FileReader)
  if (typeof image === 'string') {
    imageElement = new Image();
    imageElement.crossOrigin = 'anonymous';
    await new Promise((resolve, reject) => {
      imageElement.onload = resolve;
      imageElement.onerror = () => reject(new Error('Failed to load image'));
      imageElement.src = image;
    });
  } else if (image instanceof HTMLImageElement || image instanceof HTMLCanvasElement) {
    imageElement = image;
    if (imageElement instanceof HTMLImageElement && !imageElement.complete) {
      await new Promise((resolve, reject) => {
        imageElement.onload = resolve;
        imageElement.onerror = reject;
      });
    }
  } else {
    throw new Error(`Unsupported image type: ${typeof image}`);
  }

  return imageElement;
}

/**
 * Recognizes food items in an image
 * @param {HTMLImageElement|HTMLCanvasElement|ImageData|string} image - Image to recognize
 * @param {number} topK - Number of top predictions to return (default: 5)
 * @param {boolean} filterFoodOnly - If true, only return food-related predictions (default: true)
 * @returns {Promise<Array<{className: string, probability: number}>>} Array of predictions
 */
async function recognizeFood(image, topK = 5) {
  let preprocessed = null;
  try {
    const loadedModel = await loadModel();
    preprocessed = await preprocessImage(image);

    const predictions = await loadedModel.classify(preprocessed, Math.max(topK, 10));
    preprocessed = null;
    
    let results = predictions.map(pred => ({
      className: pred.className,
      probability: pred.probability
    }));
    
    results.sort((a, b) => b.probability - a.probability);
    results = results.slice(0, topK);
    
    return results;
  } catch (error) {
    throw new Error(`Food recognition failed: ${error.message}`);
  }
}

/**
 * Clears the cached model (useful for testing or memory management)
 */
function clearModelCache() {
  model = null;
  isLoading = false;
  loadPromise = null;
}

/**
 * Checks if the model is currently loading
 * @returns {boolean} True if model is loading
 */
function isModelLoading() {
  return isLoading;
}

/**
 * Checks if the model is loaded
 * @returns {boolean} True if model is loaded
 */
function isModelLoaded() {
  return model !== null;
}

export {
  recognizeFood,
  loadModel,
  clearModelCache,
  isModelLoading,
  isModelLoaded,
  preprocessImage
};

