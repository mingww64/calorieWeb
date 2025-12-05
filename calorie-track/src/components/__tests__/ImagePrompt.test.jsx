import React, { act } from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import ImagePrompt from '../ImagePrompt';
import { recognizeFood } from '../../services/foodRecognition';

// Mock the food recognition service
jest.mock('../../services/foodRecognition', () => ({
  recognizeFood: jest.fn(),
}));

// Mock FileReader for image preview functionality
class MockFileReader {
  result = null;
  onload = null;
  onloadend = null;
  onerror = null;

  readAsDataURL(file) {
    this.result = 'data:image/jpeg;base64,mockImageData';
    // Use setTimeout to simulate async behavior
    setTimeout(() => {
      if (this.onloadend) {
        this.onloadend({ target: { result: this.result } });
      }
      if (this.onload) {
        this.onload({ target: { result: this.result } });
      }
    }, 10);
  }
}

global.FileReader = jest.fn(() => new MockFileReader());

// Helper function to create a mock file
const createMockFile = (name, type, size) => {
  const file = new File(['mock content'], name, { type });
  Object.defineProperty(file, 'size', { value: size });
  return file;
};

const createMockImageFile = () => {
  return createMockFile('test-food.jpg', 'image/jpeg', 2 * 1024 * 1024);
};

describe('ImagePrompt Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    recognizeFood.mockClear();
  });

  test('renders Upload Image button that opens modal', async () => {
    const user = userEvent.setup();
    render(<ImagePrompt />);

    const uploadButton = screen.getByRole('button', { name: /image recognition entry/i });
    expect(uploadButton).toBeInTheDocument();

    await user.click(uploadButton);

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /upload image/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /✕/i })).toBeInTheDocument();
    });
  });

  test('opened modal has a space to drop image', async () => {
    const user = userEvent.setup();
    render(<ImagePrompt />);

    const uploadButton = screen.getByRole('button', { name: /image recognition entry/i });
    await user.click(uploadButton);

    await waitFor(() => {
      const dropzone = screen.getByText(/click to select or drag and drop/i);
      expect(dropzone).toBeInTheDocument();
      const fileInput = screen.getByLabelText(/click to select or drag and drop/i);
      expect(fileInput).toBeInTheDocument();
      expect(fileInput).toHaveAttribute('type', 'file');
    });
  });

  test('when image is dropped, the image is handled safely', async () => {
    const user = userEvent.setup();
    const mockFile = createMockImageFile();

    render(<ImagePrompt />);

    const uploadButton = screen.getByRole('button', { name: /image recognition entry/i });
    await user.click(uploadButton);

    await waitFor(() => {
      expect(screen.getByText(/click to select or drag and drop/i)).toBeInTheDocument();
    });

    const fileInput = screen.getByLabelText(/click to select or drag and drop/i);
    await user.upload(fileInput, mockFile);

    await waitFor(() => {
      const preview = screen.getByAltText(/preview/i);
      expect(preview).toBeInTheDocument();
      expect(preview).toHaveAttribute('src', expect.stringContaining('data:image'));
    });
  });

  test('handles invalid file types safely', async () => {
    const user = userEvent.setup();
    const onError = jest.fn();
    const invalidFile = createMockFile('document.pdf', 'application/pdf', 1024 * 1024);

    render(<ImagePrompt onError={onError} />);

    const uploadButton = screen.getByRole('button', { name: /image recognition entry/i });
    await user.click(uploadButton);

    await waitFor(() => {
      const fileInput = screen.getByLabelText(/click to select or drag and drop/i);
      return expect(fileInput).toBeInTheDocument();
    });

    const fileInput = screen.getByLabelText(/click to select or drag and drop/i);
    
    act(() => {
      Object.defineProperty(fileInput, 'files', { value: [invalidFile], writable: false });
      fileInput.dispatchEvent(new Event('change', { bubbles: true }));
    });

    await waitFor(() => {
      expect(onError).toHaveBeenCalledWith(expect.stringMatching(/invalid.*file.*type/i));
      expect(screen.getByText(/invalid.*file.*type/i)).toBeInTheDocument();
    }, { timeout: 2000 });
    
    expect(screen.queryByAltText(/preview/i)).not.toBeInTheDocument();
  });

  test('handles file size validation safely', async () => {
    const user = userEvent.setup();
    const onError = jest.fn();
    const largeFile = createMockFile('large-image.jpg', 'image/jpeg', 10 * 1024 * 1024);

    render(<ImagePrompt onError={onError} maxSize={5 * 1024 * 1024} />);

    const uploadButton = screen.getByRole('button', { name: /image recognition entry/i });
    await user.click(uploadButton);

    await waitFor(() => {
      const fileInput = screen.getByLabelText(/click to select or drag and drop/i);
      return expect(fileInput).toBeInTheDocument();
    });

    const fileInput = screen.getByLabelText(/click to select or drag and drop/i);
    await user.upload(fileInput, largeFile);

    await waitFor(() => {
      expect(onError).toHaveBeenCalled();
      const errorCall = onError.mock.calls[0][0];
      expect(errorCall).toMatch(/file.*too.*large/i);
    });
  });

  test('when image is uploaded, there are buttons to remove and recognize food', async () => {
    const user = userEvent.setup();
    const mockFile = createMockImageFile();

    render(<ImagePrompt />);

    const uploadButton = screen.getByRole('button', { name: /image recognition entry/i });
    await user.click(uploadButton);

    await waitFor(() => {
      const fileInput = screen.getByLabelText(/click to select or drag and drop/i);
      return expect(fileInput).toBeInTheDocument();
    });

    const fileInput = screen.getByLabelText(/click to select or drag and drop/i);
    await user.upload(fileInput, mockFile);

    await waitFor(() => {
      expect(screen.getByAltText(/preview/i)).toBeInTheDocument();
      const removeButton = screen.getByRole('button', { name: /remove image/i });
      const recognizeButton = screen.getByRole('button', { name: /recognize food/i });
      expect(removeButton).toBeInTheDocument();
      expect(recognizeButton).toBeInTheDocument();
    });
  });

  test('remove image button clears the preview', async () => {
    const user = userEvent.setup();
    const mockFile = createMockImageFile();

    render(<ImagePrompt />);

    const uploadButton = screen.getByRole('button', { name: /image recognition entry/i });
    await user.click(uploadButton);

    await waitFor(() => {
      const fileInput = screen.getByLabelText(/click to select or drag and drop/i);
      return expect(fileInput).toBeInTheDocument();
    });

    const fileInput = screen.getByLabelText(/click to select or drag and drop/i);
    await user.upload(fileInput, mockFile);

    await waitFor(() => {
      expect(screen.getByAltText(/preview/i)).toBeInTheDocument();
    });

    const removeButton = screen.getByRole('button', { name: /remove image/i });
    await user.click(removeButton);

    await waitFor(() => {
      expect(screen.queryByAltText(/preview/i)).not.toBeInTheDocument();
      expect(screen.getByText(/click to select or drag and drop/i)).toBeInTheDocument();
    });
  });

  test('once recognize food is called, it calls the recognizeFood JavaScript function', async () => {
    const user = userEvent.setup();
    const mockFile = createMockImageFile();
    const mockResults = [
      { className: 'pizza', probability: 0.95 },
      { className: 'hamburger', probability: 0.85 },
    ];
    recognizeFood.mockResolvedValue(mockResults);

    render(<ImagePrompt />);

    const uploadButton = screen.getByRole('button', { name: /image recognition entry/i });
    await user.click(uploadButton);

    await waitFor(() => {
      const fileInput = screen.getByLabelText(/click to select or drag and drop/i);
      return expect(fileInput).toBeInTheDocument();
    });

    const fileInput = screen.getByLabelText(/click to select or drag and drop/i);
    await user.upload(fileInput, mockFile);

    await waitFor(() => {
      expect(screen.getByAltText(/preview/i)).toBeInTheDocument();
    });

    const recognizeButton = screen.getByRole('button', { name: /recognize food/i });
    await user.click(recognizeButton);

    await waitFor(() => {
      expect(recognizeFood).toHaveBeenCalledTimes(1);
      expect(recognizeFood).toHaveBeenCalledWith(
        expect.stringContaining('data:image'),
        5
      );
    });
  });

  test('given a set of return values, it will list them all', async () => {
    const user = userEvent.setup();
    const mockFile = createMockImageFile();
    const mockResults = [
      { className: 'pizza', probability: 0.95 },
      { className: 'hamburger', probability: 0.85 },
      { className: 'sandwich', probability: 0.75 },
      { className: 'hot dog', probability: 0.65 },
      { className: 'french fries', probability: 0.55 },
    ];
    recognizeFood.mockResolvedValue(mockResults);

    render(<ImagePrompt />);

    const uploadButton = screen.getByRole('button', { name: /image recognition entry/i });
    await user.click(uploadButton);

    await waitFor(() => {
      const fileInput = screen.getByLabelText(/click to select or drag and drop/i);
      return expect(fileInput).toBeInTheDocument();
    });

    const fileInput = screen.getByLabelText(/click to select or drag and drop/i);
    await user.upload(fileInput, mockFile);

    await waitFor(() => {
      expect(screen.getByAltText(/preview/i)).toBeInTheDocument();
    });

    const recognizeButton = screen.getByRole('button', { name: /recognize food/i });
    await user.click(recognizeButton);

    await waitFor(() => {
      expect(screen.getByText(/recognition results/i)).toBeInTheDocument();
      expect(screen.getByText('pizza')).toBeInTheDocument();
      expect(screen.getByText('hamburger')).toBeInTheDocument();
      expect(screen.getByText('sandwich')).toBeInTheDocument();
      expect(screen.getByText('hot dog')).toBeInTheDocument();
      expect(screen.getByText('french fries')).toBeInTheDocument();
      expect(screen.getByText('95.0%')).toBeInTheDocument();
      expect(screen.getByText('85.0%')).toBeInTheDocument();
      expect(screen.getByText('75.0%')).toBeInTheDocument();
      expect(screen.getByText('65.0%')).toBeInTheDocument();
      expect(screen.getByText('55.0%')).toBeInTheDocument();
    });
  });

  test('when recognition result is clicked, it asks app to handle the item', async () => {
    const user = userEvent.setup();
    const onRecognitionComplete = jest.fn();
    const mockFile = createMockImageFile();
    const mockResults = [
      { className: 'pizza', probability: 0.95 },
      { className: 'hamburger', probability: 0.85 },
      { className: 'sandwich', probability: 0.75 },
    ];
    recognizeFood.mockResolvedValue(mockResults);

    render(<ImagePrompt onRecognitionComplete={onRecognitionComplete} />);

    const uploadButton = screen.getByRole('button', { name: /image recognition entry/i });
    await user.click(uploadButton);

    await waitFor(() => {
      const fileInput = screen.getByLabelText(/click to select or drag and drop/i);
      return expect(fileInput).toBeInTheDocument();
    });

    const fileInput = screen.getByLabelText(/click to select or drag and drop/i);
    await user.upload(fileInput, mockFile);

    await waitFor(() => {
      expect(screen.getByAltText(/preview/i)).toBeInTheDocument();
    });

    const recognizeButton = screen.getByRole('button', { name: /recognize food/i });
    await user.click(recognizeButton);

    await waitFor(() => {
      expect(screen.getByText(/recognition results/i)).toBeInTheDocument();
      expect(screen.getByText('pizza')).toBeInTheDocument();
    });

    const pizzaButton = screen.getByRole('button', { name: /pizza/i });
    await user.click(pizzaButton);

    await waitFor(() => {
      expect(onRecognitionComplete).toHaveBeenCalledTimes(1);
      expect(onRecognitionComplete).toHaveBeenCalledWith([
        { className: 'pizza', probability: 0.95 }
      ]);
      expect(screen.queryByText(/recognition results/i)).not.toBeInTheDocument();
    });
  });

  test('recognize food handles errors gracefully', async () => {
    const user = userEvent.setup();
    const onError = jest.fn();
    const mockFile = createMockImageFile();
    const errorMessage = 'Failed to load model';
    recognizeFood.mockRejectedValue(new Error(errorMessage));

    render(<ImagePrompt onError={onError} />);

    const uploadButton = screen.getByRole('button', { name: /image recognition entry/i });
    await user.click(uploadButton);

    await waitFor(() => {
      const fileInput = screen.getByLabelText(/click to select or drag and drop/i);
      return expect(fileInput).toBeInTheDocument();
    });

    const fileInput = screen.getByLabelText(/click to select or drag and drop/i);
    await user.upload(fileInput, mockFile);

    await waitFor(() => {
      expect(screen.getByAltText(/preview/i)).toBeInTheDocument();
    });

    const recognizeButton = screen.getByRole('button', { name: /recognize food/i });
    await user.click(recognizeButton);

    await waitFor(() => {
      expect(onError).toHaveBeenCalled();
      const errorCall = onError.mock.calls[0][0];
      expect(errorCall).toMatch(errorMessage);
      expect(screen.queryByText(/recognition results/i)).not.toBeInTheDocument();
    });
  });

  test('button is grayed out when modal is open', async () => {
    const user = userEvent.setup();
    render(<ImagePrompt />);

    const uploadButton = screen.getByRole('button', { name: /image recognition entry/i });
    await user.click(uploadButton);

    await waitFor(() => {
      expect(uploadButton).toHaveClass('modal-open');
      expect(uploadButton).toBeDisabled();
    });
  });

  test('modal can be closed via close button', async () => {
    const user = userEvent.setup();
    render(<ImagePrompt />);

    const uploadButton = screen.getByRole('button', { name: /image recognition entry/i });
    await user.click(uploadButton);

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /upload image/i })).toBeInTheDocument();
    });

    const closeButton = screen.getByRole('button', { name: /✕/i });
    await user.click(closeButton);

    await waitFor(() => {
      expect(screen.queryByRole('heading', { name: /upload image/i })).not.toBeInTheDocument();
    });
  });
});
