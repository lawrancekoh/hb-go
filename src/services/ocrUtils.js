
export const parseText = (text) => {
    const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0);

    let date = null;
    let time = null;
    let amount = null;
    let merchant = null;

    // Regex Patterns
    // 1. ISO: YYYY-MM-DD
    // 2. DMY/MDY: DD/MM/YYYY or MM/DD/YYYY. Separators: / - . space
    // 3. Date with Month Name: 12 May 2023, May 12 2023

    // We capture the whole date string first
    const datePattern = /((?:\d{1,2}[./-]\d{1,2}[./-]\d{2,4})|(?:\d{4}[./-]\d{1,2}[./-]\d{1,2})|(?:\d{1,2}\s+(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+\d{2,4})|(?:(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+\d{1,2}\s*,?\s*\d{2,4}))/i;

    const timeRegex = /(\d{1,2}:\d{2})/;
    const amountRegex = /(\d+\.\d{2})/;

    // Merchant heuristic: Skip these common header words
    const skipMerchantRegex = /welcome|receipt|tax invoice|abn|gst|date|time|total|subtotal|eftpos|credit|debit|card|change|cash|tel|ph|fax|vat|reg|number|#|transaction|order/i;
    // Also skip if line starts with specific patterns like dates or prices
    const startsWithDateOrPrice = /^(\d{1,2}[./-]|[$£€])/;

    for (const line of lines) {
       // Merchant Extraction
       if (!merchant) {
           // Skip short lines, lines with known "noise" words, or lines looking like dates/prices
           if (line.length > 2 &&
               !line.match(skipMerchantRegex) &&
               !line.match(startsWithDateOrPrice) &&
               !line.match(datePattern)) {
                merchant = line;
           }
       }

       // Date Extraction
       const dateMatch = line.match(datePattern);
       if (dateMatch && !date) {
           date = normalizeDate(dateMatch[0]);
       }

       // Time Extraction
       const timeMatch = line.match(timeRegex);
       if (timeMatch && !time) {
           time = timeMatch[0];
       }

       // Amount Extraction (looking for "Total")
       if (line.match(/total/i)) {
           const amtMatch = line.match(amountRegex);
           if (amtMatch) {
               amount = amtMatch[0];
           }
       }
    }

    // Fallback for amount if no "Total" line found
    if (!amount) {
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
};

function normalizeDate(dateStr) {
    if (!dateStr) return null;

    // Attempt to create a date object
    // Handle specific formats if Date.parse fails or is ambiguous

    // Normalize separators to /
    let cleanStr = dateStr.replace(/[-.]/g, '/');

    // Handle 12 May 2023 or May 12 2023
    if (cleanStr.match(/[a-z]/i)) {
        const d = new Date(cleanStr);
        if (!isNaN(d.getTime())) {
             return d.toISOString().split('T')[0];
        }
    }

    // Handle digit only formats
    const parts = cleanStr.split('/');
    if (parts.length === 3) {
        let y, m, d;
        const p1 = parseInt(parts[0]);
        const p2 = parseInt(parts[1]);
        const p3 = parseInt(parts[2]);

        // Case YYYY/MM/DD
        if (p1 > 31) {
            y = p1; m = p2; d = p3;
        }
        // Case DD/MM/YYYY vs MM/DD/YYYY
        // This is ambiguous. Most world is DMY. US is MDY.
        // Heuristic: if p1 > 12, it must be day -> DMY
        // If p2 > 12, it must be day -> MDY (unlikely if p1 is year)
        // Defaulting to DMY as it's more standard globally, or ISO YMD
        else {
             // Assume DMY for now as it's common in many receipts outside US.
             // If local OCR (tesseract) runs on user machine, maybe we could use locale, but here we are in a pure function.
             // Let's assume DMY unless Month > 12
             if (p2 > 12) {
                 // Format is definitely MDY if p1 <= 12? No, if p2 > 12 it must be M/D/Y where M is p1?
                 // Wait.
                 // If 13/01/2023 -> 13 is Day. So DMY.
                 // If 01/13/2023 -> 13 is Day. So MDY.
                 // If 05/04/2023 -> Ambiguous.

                 // If p1 > 12, p1 is Day.
                 if (p1 > 12) {
                     d = p1; m = p2; y = p3;
                 } else if (p2 > 12) {
                     // p2 is Day.
                     m = p1; d = p2; y = p3;
                 } else {
                     // Ambiguous. Prefer DMY?
                     // Let's stick to DMY for now or try to match user locale?
                     // Since I cannot access user locale easily here without passing it in.
                     // I will default to DMY.
                     d = p1; m = p2; y = p3;
                 }
            } else {
                 // Assume DMY
                 d = p1; m = p2; y = p3;
            }
        }

        // Adjust 2 digit year
        if (y < 100) y += 2000;

        // Return YYYY-MM-DD
        // Pad month and day
        const mm = m.toString().padStart(2, '0');
        const dd = d.toString().padStart(2, '0');
        return `${y}-${mm}-${dd}`;
    }

    return null;
}
