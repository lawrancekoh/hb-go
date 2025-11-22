# Product Requirements Document (PRD)

**Project Name:** HB Go  
**Type:** Progressive Web Application (PWA)  
**Version:** 1.0  
**Tagline:** "Scan. Tag. Export."  
**Icon Style:** Variant 2 (Fast Forward)  
**Repository & Hosting:** GitHub / GitHub Pages

---

## 1. Executive Summary
**HB Go** is a lightweight mobile companion for the **HomeBank** desktop finance software. It allows users to capture receipts on the go via camera or manual entry, parse details using local OCR, and export batches of transactions as a CSV file. The app operates entirely in the browser (Client-Side) without a backend server. It is hosted statically on **GitHub Pages**, ensuring zero cost, zero data leakage, and complete user privacy.

## 2. Goals & Scope

### 2.1 Core Goals
*   **Frictionless Capture:** Reduce the time to log a transaction to under 15 seconds.
*   **Privacy First:** All data processing (OCR, storage, CSV generation) happens locally on the device.
*   **Desktop Compatibility:** Generated files must import into HomeBank with zero formatting errors.
*   **Context Richness:** Capture Time (for sorting) and Tags (for filtering) automatically.
*   **Free & Persistent Hosting:** utilize GitHub Pages for reliable, version-controlled hosting.

### 2.2 Non-Goals
*   **Cloud Sync:** No integration with Google Drive/OneDrive APIs.
*   **Account Management:** No handling of balances or multi-account logic (handled during Desktop import).
*   **Statement Scanning:** No support for full-page bank statements (receipts only).

---

## 3. User Workflow

1.  **Setup:** User opens the GitHub Pages URL. User imports their HomeBank `.xhb` file once to load existing Categories.
2.  **Capture:** User snaps a picture of a receipt.
3.  **OCR:** App extracts Date, Time, Merchant, and Total Amount via Tesseract.js.
4.  **Review:** User confirms data.
5.  **Batch:** Transaction is saved to `localStorage`.
6.  **Export:** User clicks "Export CSV".
7.  **Import:** User transfers file to PC, imports into HomeBank Desktop, and selects the target account.

---

## 4. Functional Requirements

### 4.1 Data Capture (Input)
*   **FR-1.1:** App MUST accept input via Device Camera or File Upload.
*   **FR-1.2:** App MUST provide a "Manual Entry" form.
*   **FR-1.3:** App MUST support "Offline Mode" (PWA Service Workers).

### 4.2 Optical Character Recognition (OCR)
*   **FR-2.1:** The system MUST use **Tesseract.js** (WebAssembly) for client-side text extraction.
*   **FR-2.2:** The system SHOULD attempt to extract:
    *   Date (YYYY-MM-DD) & Time (HH:MM)
    *   Total Amount (Largest decimal on bottom half)
    *   Merchant (First prominent text line)

### 4.3 Data Editing & Storage
*   **FR-3.1:** Transactions MUST be saved in browser `localStorage`.
*   **FR-3.2:** The UI must capture the **Time** of transaction.
*   **FR-3.3:** Users can select a Category from a dropdown (populated by `.xhb` import).
*   **FR-3.4 (Settings):**
    *   **Import:** Parse `.xhb` XML to extract Categories/Tags.
    *   **Defaults:** User configurable "Default Tag" (e.g., `mobile-import`) and "Payment Mode".

### 4.4 Export Logic (CSV)
*   **FR-4.1:** Generate CSV with semicolon `;` delimiter.
*   **FR-4.2 Format:** `date;mode;info;payee;memo;amount;category;tags`
*   **FR-4.3 Logic:**
    *   **Amount:** Negative float for expenses.
    *   **Memo:** Prepend time if available: `[HH:MM] User Notes`.
    *   **Tags:** Append "Default Tag" to user tags.
*   **FR-4.4 Delivery:** Trigger Native Share Sheet (Mobile) or Download (Desktop).

---

## 5. User Interface Requirements

*   **Home (Inbox):** List of pending transactions, "Total" header, FAB for Camera.
*   **Editor:** Image preview, Form fields (Date, Time, Payee, Amount, Category), Save/Cancel.
*   **Settings:** Import `.xhb`, Set Defaults, Clear Data.
*   **Help:** Static instructions on how to export/import to Desktop.

---

## 6. Technical Architecture

*   **Framework:** React (Vite).
*   **Language:** JavaScript/JSX.
*   **Styling:** Tailwind CSS.
*   **OCR:** Tesseract.js (v5).
*   **Routing:** `react-router-dom` (HashRouter recommended for GitHub Pages compatibility).
*   **Hosting:** GitHub Pages.
    *   *Build Process:* GitHub Action (or `gh-pages` script) builds the `/dist` folder and pushes it to the `gh-pages` branch.

---

## 7. In-App Copy (Instructions)

**How to Sync:**
1.  **Export:** Tap "Export CSV" and save the file.
2.  **Import:** In HomeBank Desktop, go to `File > Import`. Select the CSV.
3.  **Assign Account:** Select the account (e.g., Wallet, Checking) these receipts belong to.

---

## 8. Development Phases

1.  **Phase 1 (Skeleton):** Setup Vite/GitHub repo. Build Manual Form & CSV Export.
2.  **Phase 2 (Data):** Implement `.xhb` parsing and LocalStorage persistence.
3.  **Phase 3 (OCR):** Integrate Tesseract.js and Regex logic.
4.  **Phase 4 (Polish):** PWA Manifest, Icons, and Offline Service Worker.

---

## 9. Project Directory Structure

This structure is designed for a **Vite + React** project hosted on **GitHub Pages**.

**Key Notes for Manual Setup:**
1.  **`public/`**: Files here are served as-is. Your `manifest.json` and favicon go here.
2.  **`src/`**: Your code goes here.
3.  **`dist/`**: This folder is *generated* when you run `npm run build`. **This is the folder that GitHub Pages will actually host.** You do not manually create this; the build script does.

```text
hb-go/
├── docs/                  
│   ├── 01_PRD.md
│   ├── 02_PLAN.md
├── public/
│   ├── icons/
│   │   ├── icon-192.png
│   │   └── icon-512.png
│   ├── favicon.svg
│   ├── manifest.json
│   └── robots.txt
├── src/
│   ├── assets/
│   ├── components/
│   │   ├── Camera.jsx
│   │   ├── Header.jsx
│   │   └── Layout.jsx
│   ├── pages/
│   │   ├── Home.jsx
│   │   ├── Editor.jsx
│   │   ├── Settings.jsx
│   │   └── Help.jsx
│   ├── services/
│   │   ├── csv.js
│   │   ├── ocr.js
│   │   ├── storage.js
│   │   └── xhbParser.js
│   ├── App.jsx
│   ├── main.jsx
│   └── index.css
├── .gitignore
├── index.html
├── package.json
├── postcss.config.js
├── tailwind.config.js
└── vite.config.js
```

### Important Configuration for GitHub Pages
In your `vite.config.js`, you must set the `base` path to match your repository name, or assets will fail to load.

```javascript
// vite.config.js
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  // REPLACE 'hb-go' WITH YOUR ACTUAL GITHUB REPO NAME
  base: '/hb-go/', 
})
```