import Tesseract from 'tesseract.js';
import * as pdfjsLib from 'pdfjs-dist';

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

  parseText: (text) => {
    const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0);

    // Simple Heuristics (To be improved with regex)
    let date = null;
    let time = null;
    let amount = null;
    let merchant = null;

    // Regex Patterns
    // Date: YYYY-MM-DD or DD/MM/YYYY or similar
    // Common receipt dates: 12/05/2023, 2023-05-12, 12 May 2023
    const dateRegex = /(\d{1,2}[/-]\d{1,2}[/-]\d{2,4})|(\d{4}[/-]\d{1,2}[/-]\d{1,2})/;
    const timeRegex = /(\d{1,2}:\d{2})/;
    const amountRegex = /(\d+\.\d{2})/;

    for (const line of lines) {
       // Merchant is usually the first line that is not a known header (simplified: first line)
       if (!merchant && line.length > 3 && !line.match(/welcome|receipt/i)) {
           merchant = line;
       }

       const dateMatch = line.match(dateRegex);
       if (dateMatch && !date) {
           // Need to normalize date to YYYY-MM-DD
           // This is tricky without knowing locale. Assume YYYY-MM-DD or DD/MM/YYYY
           // For now, just keep the string, or try to parse
           date = dateMatch[0];
       }

       const timeMatch = line.match(timeRegex);
       if (timeMatch && !time) {
           time = timeMatch[0];
       }

       // Amount: look for the largest decimal number?
       // Often "Total" is present.
       if (line.match(/total/i)) {
           const amtMatch = line.match(amountRegex);
           if (amtMatch) {
               amount = amtMatch[0];
           }
       }
    }

    // If no total line found, try to find any amount-like string, maybe the last one?
    if (!amount) {
         // Scan all lines for amounts, pick the largest?
         let maxAmt = 0.0;
         for (const line of lines) {
             const matches = line.matchAll(/(\d+\.\d{2})/g);
             for (const match of matches) {
                 const val = parseFloat(match[0]);
                 if (val > maxAmt) maxAmt = val;
             }
         }
         if (maxAmt > 0) amount = maxAmt.toFixed(2);
    }

    return {
        date,
        time,
        amount,
        merchant
    };
  }
};
