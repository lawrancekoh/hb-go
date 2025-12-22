# HB Go

![Current Version: v1.1.0](https://img.shields.io/badge/Current_Version-v1.1.0-blue)

The Intelligent, Offline-First Companion for HomeBank.

## Key Features

*   **Offline-First:** Works completely without internet using PWA caching technology.
*   **Privacy-First Local AI:** Run advanced receipt scanning models (PaliGemma) directly on your device using WebGPU. No data leaves your phone.
*   **Manual Transaction Entry**: Quickly add transactions on the go.
*   **HomeBank Integration**: Import `.xhb` files for Categories/Payees and export transactions as CSV.
*   **BYOK Cloud AI**: Option to use your own OpenAI or Google Gemini key for maximum accuracy.
*   **System-OCR Fallback**: Uses device's native text recognition (Live Text) if AI is not configured.
*   **Smart Receipt Cropping**: Advanced cropping with rotation and zoom support.
*   **Smart Auto-Complete**: Intelligent matching for Payees and Categories.
*   **Onboarding Wizard**: Easy setup for new users.

## Usage Guide

1.  **Open App**: Install as PWA on your device.
2.  **(Optional) Setup Intelligence**: Go to Settings -> Intelligence to download the Local AI model or configure a Cloud API key.
3.  **Snap Photo**: Tap the camera icon, take a picture of your receipt, crop it, and save.
4.  **Export CSV**: When ready, export your transactions to CSV and import them into HomeBank on your desktop.

## 🤖 Local AI Setup

Local AI models are fetched directly from GitHub Releases, ensuring fast downloads and no authentication friction.

### Developer Note: Hosting Custom Models
To host models for this app:
1. Create a GitHub Release tagged `models` in your repository.
2. Upload the ONNX model files as assets.
3. **Naming Convention:** All files for a model must be prefixed with `[model_id]-`.
   - Example for model ID `paligemma-3b-onnx`:
     - `paligemma-3b-onnx-config.json`
     - `paligemma-3b-onnx-tokenizer.json`
     - `paligemma-3b-onnx-model_quantized.onnx`
     - ... (all other required files)

## Tech Stack

*   **Vite PWA**: For offline capabilities and progressive web app features.
*   **Transformers.js**: For running Local AI models via WebGPU.
*   **React Image Crop**: For advanced image cropping and manipulation.
*   **React**: UI library.
*   **Tailwind CSS**: Utility-first CSS framework.
*   **Tesseract.js**: For local OCR fallback.
*   **IDB**: For IndexedDB storage.

## Development

1.  **Install Dependencies**:
    ```bash
    npm install
    ```

2.  **Run Development Server**:
    ```bash
    npm run dev
    ```

3.  **Build for Production**:
    ```bash
    npm run build
    ```

## 👨‍💻 Why I Built This
I started my personal finance journey with **HomeBank** in March 2025. I loved the privacy and power of the desktop software, but the "gap" between buying a coffee and sitting at my computer was where my data often got lost.

As an **AI enthusiast**, I realized I could solve this friction. I built **HB Go** to be the missing link—combining the privacy of offline-first software with the intelligence of modern Vision LLMs. I wanted a tool that didn't just take pictures, but actually *understood* the context of my spending.

Connect with me on [LinkedIn](https://www.linkedin.com/in/lawrancekoh)!

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
