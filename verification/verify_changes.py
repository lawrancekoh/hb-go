from playwright.sync_api import sync_playwright

def verify_settings(page):
    page.goto("http://localhost:5173/hb-go/#/settings")
    page.wait_for_selector("text=OCR Engine")

    # Check if the new option description is present
    page.wait_for_selector("text=Use System OCR if available, with Tesseract as backup.")

    # Take full page screenshot of Settings page
    page.screenshot(path="verification/settings_page_full.png", full_page=True)
    print("Settings page full screenshot taken.")

def verify_home(page):
    page.goto("http://localhost:5173/hb-go/#/")
    page.wait_for_selector("text=Total Pending")

    try:
        page.wait_for_selector("text=Scan with AI", timeout=2000)
        print("ERROR: 'Scan with AI' button still found!")
    except:
        print("SUCCESS: 'Scan with AI' button correctly removed.")

    page.screenshot(path="verification/home_page.png")
    print("Home page screenshot taken.")

if __name__ == "__main__":
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        try:
            verify_settings(page)
            verify_home(page)
        except Exception as e:
            print(f"Error: {e}")
        finally:
            browser.close()
