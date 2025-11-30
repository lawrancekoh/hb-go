# HB Go

HB Go is a Progressive Web Application (PWA) designed to capture receipts, parse details using local OCR, and export transactions for HomeBank.

This application has been tested and is ready for use.

## Developer
- **Lawrance Koh**

## HomeBank
HB Go is a companion app for [HomeBank](https://www.gethomebank.org/), a free software that will assist you to manage your personal accounting.

## Prerequisites

- **Node.js**: v24.11.1 or higher
- **npm**: v11.6.2 or higher

## Getting Started

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

## Tech Stack

- React
- Vite
- Tailwind CSS

## Installation on Client Device

HB Go is a web-based application. You can access it via your browser, or install it as an app on your device for a native-like experience.

### iOS (iPhone/iPad)
1. Open the application URL in **Safari**.
2. Tap the **Share** button (box with an arrow pointing up).
3. Scroll down and tap **Add to Home Screen**.
4. Confirm by tapping **Add**.

### Android
1. Open the application URL in **Chrome**.
2. Tap the menu icon (three dots) in the top-right corner.
3. Tap **Install App** or **Add to Home screen**.
4. Follow the on-screen prompts to install.

### Desktop (Chrome/Edge)
1. Open the application URL.
2. Click the install icon in the address bar (usually on the right side).
3. Follow the prompts to install the app.

## Usage

1.  **Launch the App**: Open HB Go from your home screen or browser.
2.  **Capture Receipt**: Use the camera button to take a photo of your receipt, or upload an existing image.
3.  **Process**: The app will attempt to read the text from the receipt (OCR).
4.  **Edit Details**: Verify and correct the transaction details (Date, Amount, Payee, Category).
5.  **Export**: Save the transaction or export it to a format compatible with HomeBank.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
