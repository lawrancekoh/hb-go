import Tesseract from 'tesseract.js';
import * as pdfjsLib from 'pdfjs-dist';
import { parseText } from './ocrUtils';

// Configure the worker.
import workerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url';

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

  recognize: async (imageFile, onProgress) => {
    try {
      let imageToScan = imageFile;

      // Handle PDF if passed directly (though UI might pre-convert)
      if (imageFile instanceof File && imageFile.type === 'application/pdf') {
        if (onProgress) onProgress({ status: 'Converting PDF to image...', progress: 0 });
        imageToScan = await ocrService.convertPdfToImage(imageFile);
        if (onProgress) onProgress({ status: 'PDF converted', progress: 0.1 });
      }

      const result = await Tesseract.recognize(
        imageToScan,
        'eng',
        {
          logger: m => {
            if (onProgress) onProgress(m);
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
