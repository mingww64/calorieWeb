// PROMPT: Imagine you are a senior software engineer. You have extensive experience with React and Tensorflow.js.
// As a user, I want to take a picture of my food and have the app try to identify it. When I confirm the 
// suggestion, the food name is filled in the entry form. Use a separate javascript file to handle the 
// tensorflow package. Only load the Tensorflow after the user uploads their image. Make sure the image is safe
// Give me a plan for how you want to generate this.
// Generate a component called ImagePrompt that allows the user to upload an image and recognize food items in it.

// This additionally generated ImagePrompt.css and ImagePrompt.jsx
// I used the framework provided by the code for foodRecognition.js, but reimplemented Tensorflow usage.

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
  if (model) return model;
  if (isLoading && loadPromise) return loadPromise;
  
  isLoading = true;
  loadPromise = (async () => {
    try {
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

// Helper function to load image from URL
async function loadImagefromURL(image) {
  const processedImage = new Image();
  processedImage.crossOrigin = 'anonymous';
  await new Promise((resolve, reject) => {
      processedImage.onload = resolve;
      processedImage.onerror = () => reject(new Error('Failed to load image'));
      processedImage.src = image;
  });
  return processedImage;
}

// Helper function to ensure image is loaded before processing
async function ensureImageLoaded(image) {
  if (image.complete && image.naturalWidth !== 0) return image;
  return new Promise((resolve, reject) => {
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error('Failed to load image'));
  });
}

/**
 * Preprocesses an image for MobileNet input
 * @param {HTMLImageElement|HTMLCanvasElement|ImageData|string} image - Image element, canvas, ImageData, or data URL
 * @returns {HTMLImageElement|HTMLCanvasElement} Image element or canvas element
 */
async function preprocessImage(image) {  
  if (typeof image === 'string') 
    return await loadImagefromURL(image);

  if (image instanceof HTMLCanvasElement)
    return image;

  if (image instanceof HTMLImageElement)
    return await ensureImageLoaded(image);
  
  throw new Error(`Unsupported image type: ${typeof image}`);
}

/**
 * Recognizes food items in an image
 * @param {HTMLImageElement|HTMLCanvasElement|ImageData|string} image - Image to recognize
 * @param {number} resultCount - Number of top predictions to return (default: 5)
 * @returns {Promise<Array<{className: string, probability: number}>>} Array of predictions
 */
async function recognizeFood(image, resultCount = 5) {
  let processedImage = null;
  try {
    const loadedModel = await loadModel();
    processedImage = await preprocessImage(image);

    const predictions = await loadedModel.classify(processedImage);
    
    let results = predictions.map(pred => ({
      className: pred.className,
      probability: pred.probability
    }));
    
    results.sort((a, b) => b.probability - a.probability);
    results = results.slice(0, resultCount);
    
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

