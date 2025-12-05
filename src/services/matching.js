
export const matchingService = {
  /**
   * Finds the best match for rawText in a list of strings using fuzzy logic.
   * Priority:
   * 1. Exact Match (case-insensitive)
   * 2. Child Part Exact Match (e.g. "Dining" matches "Food:Dining")
   * 3. Child Part Contains Raw (e.g. "Dining Out" matches "Dining")
   * 4. Raw Contains Child Part (e.g. "Super Dining" matches "Dining")
   * 5. Fallback: Full string contains raw (only if no child match found?) - we will de-prioritize this.
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

        // Hierarchy support: Check against the child/leaf part
        // e.g. "Food:Dining Out" -> "Dining Out"
        const parts = normalizedItem.split(':');
        const childPart = parts[parts.length - 1].trim();

        // Skip if child part is empty (edge case)
        if (!childPart) continue;

        // 1. Child Exact Match
        if (childPart === normalizedRaw) {
             candidates.push({ item, type: 'child_exact', len: childPart.length });
             continue;
        }

        // 2. Child contains Raw (e.g. "Dining Out" contains "Dining")
        if (childPart.includes(normalizedRaw)) {
             candidates.push({ item, type: 'child_contains_raw', len: childPart.length });
             continue;
        }

        // 3. Raw contains Child (e.g. "Super Dining" contains "Dining")
        if (normalizedRaw.includes(childPart)) {
             candidates.push({ item, type: 'raw_contains_child', len: childPart.length });
             continue;
        }

        // 4. Standard Fallback: Full string contains raw
        // "Food:Dining Out" contains "Food"
        // We include this but with lower priority, or maybe filter it out if we want Strict Matching?
        // User said: "Check if Full String contains input. AND: Check if Child part..."
        // This implies strictness.
        // If I include this, "Food" matches "Food:Groceries".
        // If I exclude this, "Food" will NOT match "Food:Groceries".
        // Given the failure in test case ("Food" -> "Food:Groceries"), I should probably EXCLUDE it or give it very low priority.
        // But if I give it low priority, it will still match if no better match exists.
        // The user likely wants to avoid matching just on parent category unless it's intended.
        // But if I input "Food" and I have "Food:Groceries", and nothing else matches... should it return null?
        // Ideally yes, because "Food" is ambiguous or just a parent.

        // However, existing logic allowed it.
        // "Check if Full String contains input AND ... Check if Child part..."
        // This phrasing "AND" suggests both must be true?
        // If so, then "Food" matching "Food:Groceries":
        // Full string contains "Food"? YES.
        // Child "Groceries" contains "Food"? NO.
        // So it should NOT match.

        // I will implement this "AND" logic implicitly by ONLY matching if the Child Part logic above is satisfied.
        // Wait, if "Dining" matches "Food:Dining Out".
        // Full string contains "Dining"? YES.
        // Child "Dining Out" contains "Dining"? YES.
        // So both true.

        // So I will NOT add a generic "Full string contains raw" fallback here.
        // This ensures we stick to the Child-centric logic.
    }

    if (candidates.length === 0) return null;

    // Sort candidates to find the best one
    candidates.sort((a, b) => {
        // Priority Order:
        // 1. child_exact (0)
        // 2. child_contains_raw (1) - "Dining Out" matches "Dining"
        // 3. raw_contains_child (2) - "Super Dining" matches "Dining"

        const priority = {
            'child_exact': 0,
            'child_contains_raw': 1,
            'raw_contains_child': 2
        };

        const pA = priority[a.type];
        const pB = priority[b.type];

        if (pA !== pB) {
            return pA - pB;
        }

        // Secondary Sort: Length
        if (a.type === 'child_contains_raw') {
            // "Dining Out" (10) vs "Dining" (6) for input "Din"
            // We want shortest? Or longest?
            // "Woolworths Metro" includes "Woolworths".
            // If input is "Woolworths", we probably want "Woolworths" (exact child match) which is handled by child_exact.
            // If input is "Din". Matches "Dining" and "Dining Out".
            // Usually shorter is closer to the partial input?
            // Existing logic: "item_contains_raw" -> ascending len (shortest).
            return a.len - b.len;
        }

        if (a.type === 'raw_contains_child') {
             // Input: "Woolworths Metro". Matches "Woolworths" (10) and "Wool" (4).
             // We want longest child match ("Woolworths").
             // Existing logic: "raw_contains_item" -> descending len (longest).
             return b.len - a.len;
        }

        return 0;
    });

    return candidates[0].item;
  }
};
