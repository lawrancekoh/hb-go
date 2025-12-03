
from playwright.sync_api import sync_playwright
import time

def verify_settings_version():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()

        # Navigate to the app (adjust port if necessary, assuming default 5173)
        page.goto("http://localhost:5173/#/settings")

        # Wait for the page to load
        page.wait_for_selector("h1")

        # Locate the version text
        # It's at the bottom, matching "HB Go v"
        version_locator = page.get_by_text("HB Go v1.0.0")

        # Scroll to bottom
        page.evaluate("window.scrollTo(0, document.body.scrollHeight)")

        # Wait a bit for layout
        time.sleep(1)

        if version_locator.is_visible():
            print("Version text found!")
        else:
            print("Version text NOT found!")

        # Take screenshot
        page.screenshot(path="verification/settings_version.png", full_page=True)

        browser.close()

if __name__ == "__main__":
    verify_settings_version()
