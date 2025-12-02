
export const matchingService = {
  /**
   * Finds the best match for rawText in a list of strings using fuzzy logic.
   * Priority:
   * 1. Exact Match (case-insensitive)
   * 2. rawText contains listItem (prefer longest listItem) -> Handles "Woolworths Metro 123" matching "Woolworths Metro"
   * 3. listItem contains rawText (prefer shortest listItem) -> Handles "Uber" matching "Uber Eats"
   *
   * @param {string} rawText - The text to match (e.g. OCR merchant name)
   * @param {string[]} list - The list of known values (e.g. Payees, Categories)
   * @returns {string|null} - The best matching string from the list, or null
   */
  findBestMatch(rawText, list) {
    if (!rawText || !list || list.length === 0) return null;

    const normalizedRaw = rawText.toLowerCase().trim();
    const candidates = [];

    for (const item of list) {
        const normalizedItem = item.toLowerCase().trim();

        if (normalizedRaw === normalizedItem) {
            return item; // Exact match is always best
        }

        if (normalizedRaw.includes(normalizedItem)) {
            candidates.push({ item, type: 'raw_contains_item', len: normalizedItem.length });
        } else if (normalizedItem.includes(normalizedRaw)) {
            candidates.push({ item, type: 'item_contains_raw', len: normalizedItem.length });
        }
    }

    if (candidates.length === 0) return null;

    // Sort candidates to find the best one
    candidates.sort((a, b) => {
        // Priority 1: raw_contains_item (OCR usually adds noise to the real name)
        if (a.type !== b.type) {
            return a.type === 'raw_contains_item' ? -1 : 1;
        }

        // Priority 2: Specificity
        if (a.type === 'raw_contains_item') {
            // "Woolworths Metro" (len 16) is better than "Woolworths" (len 10) for raw "Woolworths Metro 2234"
            return b.len - a.len; // Descending length
        } else {
            // "Uber" (raw) matching "Uber Eats" vs "Uber Technologies Inc"
            // We want the one closest to the raw text (shortest)
            return a.len - b.len; // Ascending length
        }
    });

    return candidates[0].item;
  }
};
