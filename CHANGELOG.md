# Changelog

## [1.1.1] - 2025-12-11

### 🚀 New Features
*   **Local AI Models:** Added support for **Gemma 3 (4B)** 'Elastic' model for enhanced local receipt parsing.
*   **Authentication:** Added **Hugging Face Token** configuration to enable access to gated models (like Gemma 3 and PaliGemma).

### 🐛 Bug Fixes
*   Fixed `401 Unauthorized` errors when attempting to download gated models from Hugging Face.

## [1.1.0] - 2025-12-11

### 🚀 New Features
*   **Hybrid AI Vision:** Introduced "Local-First" AI mode. Users can now choose to process receipts locally on their device using WebGPU-accelerated models (PaliGemma 3B), ensuring complete privacy.
*   **Cloud Fallback:** Added auto-fallback configuration. If Local AI fails or is unavailable, the app can seamlessly retry with Cloud AI (if configured).
*   **Intelligence Settings:** New settings section to manage AI preferences, check WebGPU support, and download local models.

### 🛠 Improvements
*   **Performance:** Implemented `transformers.js` for efficient in-browser inference.
*   **UX:** Updated Scan button to indicate active mode (Local/Cloud).
*   **UX:** Added model download progress indicator.

## [1.0.1] - 2025-12-11

### 🚀 Features
*   **Export:** Added Native Share Sheet support (Mobile) for direct save to Drive/OneDrive.
*   **Editor UX:** Added "Clear" buttons to input fields and a "Today" shortcut for the date field.
*   **Settings:** Now displays App Version, imported file date, sync timestamp, and tag counts.
*   **Image Cropper:** Major upgrade with improved zoom, rotation support, and better desktop layout.
*   **Resources:** Added direct links to the official HomeBank website and a new "Support & Feedback" section in Help.

### 🐛 Bug Fixes
*   Fixed transaction list sorting to be strictly reverse chronological.
*   Fixed AI date hallucination (now defaults to current date if uncertain).
*   Fixed duplicate timestamps appearing in CSV export memos.
*   Fixed category matching precedence to correctly prioritize AI suggestions.
*   Fixed Image Cropper height constraints on desktop screens.

### 📝 Documentation
*   Added "How to get an AI Key" guide to the Help page.
*   Added "Why I Built This" origin story.

## [1.0.0] - 2025-12-02

### 🚀 Features
*   Added Manual Theme Switcher (System/Light/Dark).
*   Added Default Category preference for faster entry.
*   Offline-first architecture (PWA).
*   Manual Transaction Entry.
*   HomeBank `.xhb` file import for Categories/Payees.
*   "Bring Your Own Key" (BYOK) AI Scanning (OpenAI/Gemini).
*   System-OCR fallback (Live Text).
*   Smart Receipt Cropping & Rotation.
*   Smart Auto-Complete (Payee/Category matching).
*   CSV Export (HomeBank compatible).
*   **Smart Tagging:** Added 'Suggestion Ribbon' for manual entry and 'Strict Whitelist' logic for AI auto-tagging based on imported HomeBank data.

### ✨ UX
*   Onboarding Wizard for new users.
*   Default Category seeding.
