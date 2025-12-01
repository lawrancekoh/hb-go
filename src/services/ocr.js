import Tesseract from 'tesseract.js';
import * as pdfjsLib from 'pdfjs-dist';
import { parseText } from './ocrUtils.js';

// Configure the worker.
const workerUrl = new URL('pdfjs-dist/build/pdf.worker.min.mjs', import.meta.url).toString();

pdfjsLib.GlobalWorkerOptions.workerSrc = workerUrl;

export const ocrService = {
  convertPdfToImage: async (pdfFile) => {
      const arrayBuffer = await pdfFile.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;

      // Render the first page
      const page = await pdf.getPage(1);
      const viewport = page.getViewport({ scale: 2.0 }); // Scale up for better OCR

      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d');
      canvas.height = viewport.height;
      canvas.width = viewport.width;

      await page.render({
          canvasContext: context,
          viewport: viewport
      }).promise;

      // Convert to blob/dataURL
      return canvas.toDataURL('image/png');
  },

  // System OCR (Shape Detection API - TextDetector)
  detectTextWithSystem: async (imageSource) => {
    if (!('TextDetector' in window)) {
        throw new Error('System TextDetector not supported');
    }

    // Initialize TextDetector
    // eslint-disable-next-line no-undef
    const textDetector = new TextDetector();
    let imageElement;
    let objectUrlToRevoke = null;

    // Use HTMLImageElement to handle EXIF orientation and diverse input formats
    try {
        if (imageSource instanceof File || imageSource instanceof Blob) {
            const url = URL.createObjectURL(imageSource);
            objectUrlToRevoke = url;
            imageElement = document.createElement('img');
            imageElement.src = url;
            await new Promise((resolve, reject) => {
                imageElement.onload = resolve;
                imageElement.onerror = reject;
            });
        } else if (typeof imageSource === 'string' && imageSource.startsWith('data:')) {
            imageElement = document.createElement('img');
            imageElement.src = imageSource;
            await new Promise((resolve, reject) => {
                imageElement.onload = resolve;
                imageElement.onerror = reject;
            });
        } else {
             // If it is already an image element or bitmap
             imageElement = imageSource;
        }

        const detectedText = await textDetector.detect(imageElement);
        // detectedText is an array of { rawValue, boundingBox, cornerPoints }
        return detectedText.map(t => t.rawValue).join('\n');
    } catch (e) {
        console.error('System OCR failed:', e);
        throw e;
    } finally {
        if (objectUrlToRevoke) {
            URL.revokeObjectURL(objectUrlToRevoke);
        }
    }
  },

  recognize: async (imageFile, onProgress, options = { strategy: 'auto' }) => {
    let imageToScan = imageFile;

    // Handle PDF if passed directly
    if (imageFile instanceof File && imageFile.type === 'application/pdf') {
        if (onProgress) onProgress({ status: 'Converting PDF to image...', progress: 0 });
        imageToScan = await ocrService.convertPdfToImage(imageFile);
        if (onProgress) onProgress({ status: 'PDF converted', progress: 0.1 });
    }

    const { strategy } = options;
    console.log(`OCR Strategy: ${strategy}`);

    // Try System OCR if strategy is auto or system
    if (strategy === 'auto' || strategy === 'system') {
        try {
            if (onProgress) onProgress({ status: 'Attempting System OCR...', progress: 0.2 });
            const text = await ocrService.detectTextWithSystem(imageToScan);
            if (text && text.trim().length > 0) {
                 if (onProgress) onProgress({ status: 'System OCR complete', progress: 1 });
                 return text;
            }
            console.warn('System OCR returned empty text');
        } catch (e) {
            console.warn('System OCR unavailable or failed:', e);
            if (strategy === 'system') {
                throw new Error('System OCR failed and fallback is disabled.');
            }
        }
    }

    // Fallback to Tesseract.js
    if (onProgress) onProgress({ status: 'Starting Tesseract OCR...', progress: 0.3 });

    try {
        const result = await Tesseract.recognize(
            imageToScan,
            'eng',
            {
                logger: m => {
                    if (onProgress && m.status === 'recognizing text') {
                         onProgress({ status: 'recognizing text', progress: m.progress });
                    }
                }
            }
        );

        return result.data.text;
    } catch (error) {
        console.error("OCR Error:", error);
        throw error;
    }
  },

  parseText
};
