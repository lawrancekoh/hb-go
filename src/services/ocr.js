import Tesseract from 'tesseract.js';

export const ocrService = {
  recognize: async (imageFile, onProgress) => {
    try {
      const result = await Tesseract.recognize(
        imageFile,
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
