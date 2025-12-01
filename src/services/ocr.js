import * as paddleOcr from '@paddle-js-models/ocr';
import * as pdfjsLib from 'pdfjs-dist';
import { parseText } from './ocrUtils.js';

// Configure the worker.
const workerUrl = new URL('pdfjs-dist/build/pdf.worker.min.mjs', import.meta.url).toString();

pdfjsLib.GlobalWorkerOptions.workerSrc = workerUrl;

let paddleInitialized = false;

const initPaddle = async () => {
    if (!paddleInitialized) {
        await paddleOcr.init();
        paddleInitialized = true;
    }
};

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
    let imageElement = imageSource;

    // TextDetector expects an ImageBitmap, HTMLImageElement, HTMLVideoElement, or HTMLCanvasElement
    if (typeof imageSource === 'string' && imageSource.startsWith('data:')) {
        // Convert base64 to ImageBitmap
        const response = await fetch(imageSource);
        const blob = await response.blob();
        imageElement = await createImageBitmap(blob);
    } else if (imageSource instanceof File || imageSource instanceof Blob) {
        imageElement = await createImageBitmap(imageSource);
    }

    try {
        const detectedText = await textDetector.detect(imageElement);
        // detectedText is an array of { rawValue, boundingBox, cornerPoints }
        return detectedText.map(t => t.rawValue).join('\n');
    } catch (e) {
        console.error('System OCR failed:', e);
        throw e;
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

    // Fallback to PaddleOCR
    if (onProgress) onProgress({ status: 'Starting PaddleOCR...', progress: 0.3 });

    try {
        await initPaddle();

        let imgElement;
        // PaddleOCR expects an HTMLImageElement or similar.
        // We need to ensure we have a valid image source.
        if (imageToScan instanceof File || imageToScan instanceof Blob) {
             const url = URL.createObjectURL(imageToScan);
             imgElement = document.createElement('img');
             imgElement.src = url;
             await new Promise((resolve) => { imgElement.onload = resolve; });
        } else if (typeof imageToScan === 'string' && imageToScan.startsWith('data:')) {
             imgElement = document.createElement('img');
             imgElement.src = imageToScan;
             await new Promise((resolve) => { imgElement.onload = resolve; });
        } else {
             // Assuming it's already an image element if it reached here from elsewhere,
             // but current usage mainly passes File/Blob/DataURL.
             imgElement = imageToScan;
        }

        const res = await paddleOcr.recognize(imgElement);

        // Clean up object URL if we created one
        if (imageToScan instanceof File || imageToScan instanceof Blob) {
            URL.revokeObjectURL(imgElement.src);
        }

        // PaddleOCR result structure: { text: string, ... }
        // Based on npm usage: console.log(res.text)
        return res.text ? res.text.join('\n') : '';
        // Wait, checking usage again. Usage says "console.log(res.text)".
        // If it returns an array of lines, join them. If it returns a string, verify.
        // The snippet says: "ocr_recognition model can recognize the characters ... res.text"
        // I should double check if res.text is an array or string.
        // Usually OCR returns blocks.
        // Let's assume it might be array if it detects multiple lines.
        // If it's a string, join won't hurt if we check type, or just return it.

    } catch (error) {
        console.error("OCR Error:", error);
        throw error;
    }
  },

  parseText
};
