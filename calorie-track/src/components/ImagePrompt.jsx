import React, { useState, useRef } from 'react';
import './ImagePrompt.css';
import { recognizeFood } from '../services/foodRecognition';

const DEFAULT_MAX_SIZE = 5 * 1024 * 1024;
const TOP_K_RESULTS = 5;
const BYTES_PER_MB = 1024 * 1024;

function ImagePrompt({
  onError,
  onClose,
  onRecognitionComplete,
  maxSize = DEFAULT_MAX_SIZE,
  disabled = false
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [preview, setPreview] = useState(null);
  const [recognizing, setRecognizing] = useState(false);
  const [recognizedFoods, setRecognizedFoods] = useState([]);
  const [error, setError] = useState('');
  const fileInputRef = useRef(null);

  const showError = (message) => {
    setError(message);
    onError?.(message);
  };

  const clearFileState = () => {
    setPreview(null);
    setRecognizedFoods([]);
    setError('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleOpenModal = () => {
    if (disabled) return;
    setIsOpen(true);
    clearFileState();
  };

  const handleCloseModal = () => {
    setIsOpen(false);
    clearFileState();
    onClose?.();
  };

  const validateFile = (file) => {
    if (!file.type.startsWith('image/')) {
      return 'Invalid file type. Please select an image file.';
    }
    if (file.size > maxSize) {
      const maxSizeMB = (maxSize / BYTES_PER_MB).toFixed(0);
      return `File is too large. Maximum size is ${maxSizeMB}MB.`;
    }
    return null;
  };

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validationError = validateFile(file);
    if (validationError) {
      showError(validationError);
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => setPreview(reader.result);
    reader.onerror = () => showError('Failed to read file.');
    reader.readAsDataURL(file);
  };

  const handleClear = () => {
    clearFileState();
  };

  const handleRecognize = async () => {
    if (!preview) return;

    setRecognizing(true);
    setError('');
    setRecognizedFoods([]);

    try {
      const results = await recognizeFood(preview, TOP_K_RESULTS);
      setRecognizedFoods(Array.isArray(results) ? results : []);
    } catch (err) {
      showError(err.message || 'Failed to recognize food in image.');
    } finally {
      setRecognizing(false);
    }
  };

  const handleSelectFood = (foodItem) => {
    if (!foodItem?.className) return;
    onRecognitionComplete?.([foodItem]);
    handleCloseModal();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    if (disabled) return;

    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleFileSelect({ target: { files: [file] } });
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const maxSizeMB = (maxSize / BYTES_PER_MB).toFixed(0);

  return (
    <>
      <div className="image-prompt-container">
        <button
          className={`image-prompt-button ${isOpen ? 'modal-open' : ''}`}
          onClick={handleOpenModal}
          disabled={disabled || isOpen}
        >
          Image Recognition Entry
        </button>
      </div>

      {isOpen && (
        <div className="image-prompt-overlay" onClick={handleCloseModal}>
          <div className="image-prompt-modal" onClick={(e) => e.stopPropagation()}>
            <div className="image-prompt-header">
              <h2>Upload Image</h2>
              <button className="close-btn" onClick={handleCloseModal}>✕</button>
            </div>

            {error && <div className="image-prompt-message error">{error}</div>}

            <div className="image-prompt-content">
              <div
                className="image-prompt-dropzone"
                onDrop={handleDrop}
                onDragOver={handleDragOver}
              >
                {preview ? (
                  <div className="image-preview-container">
                    <img src={preview} alt="Preview" className="image-preview" />
                    <div className="image-preview-actions">
                      <button
                        className="image-clear-btn"
                        onClick={handleClear}
                        type="button"
                      >
                        Remove Image
                      </button>
                      <button
                        className="image-recognize-btn"
                        onClick={handleRecognize}
                        disabled={recognizing}
                        type="button"
                      >
                        {recognizing ? 'Recognizing...' : 'Recognize Food'}
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="image-prompt-placeholder">
                    <label htmlFor="image-upload" className="image-upload-label">
                      <span className="upload-icon">📷</span>
                      <span className="upload-text">Click to select or drag and drop</span>
                      <span className="upload-hint">
                        Supports: JPG, PNG, GIF, WEBP (Max {maxSizeMB}MB)
                      </span>
                    </label>
                    <input
                      id="image-upload"
                      ref={fileInputRef}
                      type="file"
                      accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
                      onChange={handleFileSelect}
                      className="image-upload-input"
                    />
                  </div>
                )}
              </div>

              {recognizedFoods.length > 0 && (
                <div className="recognition-results">
                  <h3>Recognition Results</h3>
                  <div className="recognition-list">
                    {recognizedFoods.map((food, index) => (
                      <button
                        key={index}
                        type="button"
                        className="recognition-item-button"
                        onClick={() => handleSelectFood(food)}
                      >
                        <span className="recognition-name">{food.className}</span>
                        <span className="recognition-confidence">
                          {(food.probability * 100).toFixed(1)}%
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default ImagePrompt;
