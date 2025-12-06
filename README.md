# HB Go

![Current Version: v1.0.0](https://img.shields.io/badge/Current_Version-v1.0.0-blue)

The Intelligent, Offline-First Companion for HomeBank.

## Key Features

*   **Offline-First:** Works completely without internet using PWA caching technology.
*   **Manual Transaction Entry**: Quickly add transactions on the go.
*   **HomeBank Integration**: Import `.xhb` files for Categories/Payees and export transactions as CSV.
*   **BYOK AI Scanning**: Use your own OpenAI or Google Gemini key for smart receipt scanning.
*   **System-OCR Fallback**: Uses device's native text recognition (Live Text) if AI is not configured.
*   **Smart Receipt Cropping**: Advanced cropping with rotation and zoom support.
*   **Smart Auto-Complete**: Intelligent matching for Payees and Categories.
*   **Onboarding Wizard**: Easy setup for new users.

## Usage Guide

1.  **Open App**: Install as PWA on your device.
2.  **(Optional) Add AI Key**: Go to Settings to configure your OpenAI or Gemini API key for enhanced scanning.
3.  **Snap Photo**: Tap the camera icon, take a picture of your receipt, crop it, and save.
4.  **Export CSV**: When ready, export your transactions to CSV and import them into HomeBank on your desktop.

## Tech Stack

*   **Vite PWA**: For offline capabilities and progressive web app features.
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
