
from playwright.sync_api import sync_playwright

def verify_settings(page):
    # Go to settings page
    page.goto("http://localhost:5173/#/settings")

    # Check if Scanner Settings card exists
    page.wait_for_selector("text=Scanner Settings")

    # Check options
    page.wait_for_selector("text=Auto (Recommended)")
    page.wait_for_selector("text=System Only")
    page.wait_for_selector("text=Tesseract (Local)")

    # Take screenshot of settings
    page.screenshot(path="verification/settings_ocr.png")
    print("Settings screenshot taken.")

def verify_editor(page):
    # Go to editor page (new)
    page.goto("http://localhost:5173/#/editor/new")

    # Wait for page load
    page.wait_for_selector("text=New Transaction")

    # We can't easily test OCR logic here without uploading files, but we can verify the UI didn't break
    page.screenshot(path="verification/editor_ocr.png")
    print("Editor screenshot taken.")

if __name__ == "__main__":
    with sync_playwright() as p:
        browser = p.chromium.launch()
        page = browser.new_page()
        try:
            verify_settings(page)
            verify_editor(page)
        except Exception as e:
            print(f"Error: {e}")
        finally:
            browser.close()
