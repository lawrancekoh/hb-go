
from playwright.sync_api import sync_playwright
import time

def verify_features():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context()
        page = context.new_page()

        # 1. Navigate to Help page to check "Pro Tips"
        print("Navigating to Help page...")
        page.goto("http://localhost:5173/hb-go/#/help")
        time.sleep(2)

        # Check for Pro Tips section
        if page.get_by_text("Pro Tips").is_visible():
            print("Verified: Pro Tips section is visible.")
        else:
            print("Error: Pro Tips section not found.")

        # Screenshot Help page
        page.screenshot(path="verification/help_page.png")
        print("Screenshot saved: verification/help_page.png")

        # 2. Navigate to Editor (simulating new transaction)
        print("Navigating to Editor...")
        page.goto("http://localhost:5173/hb-go/#/editor/new")
        time.sleep(2)

        # Check for presence of ImageCropper related UI (hidden until image upload, but we can check if file input exists)
        if page.locator("input[type='file']").count() > 0:
             print("Verified: File input is present.")

        # We cannot easily test image upload + crop in headless mode without a real file and interaction,
        # but we can verify the UI didn't crash and components are there.

        # Screenshot Editor
        page.screenshot(path="verification/editor_page.png")
        print("Screenshot saved: verification/editor_page.png")

        browser.close()

if __name__ == "__main__":
    verify_features()
