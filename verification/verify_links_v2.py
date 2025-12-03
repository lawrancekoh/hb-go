from playwright.sync_api import sync_playwright

def verify_changes():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()

        # Navigate to Settings
        page.goto("http://localhost:5173/#/settings")
        # Wait for the text to appear
        page.wait_for_selector("text=Unofficial companion to")

        # Screenshot Settings Footer area (scrolling down if needed)
        # Just take full page screenshot or specific element if possible, but full page is easier to debug context
        page.screenshot(path="verification/settings_page_with_link.png", full_page=True)
        print("Settings footer verified")

        # Navigate to Help
        page.goto("http://localhost:5173/#/help")
        page.wait_for_selector("text=Desktop Workflow")

        # Screenshot Help Page
        page.screenshot(path="verification/help_page_with_link.png", full_page=True)
        print("Help page verified")

        browser.close()

if __name__ == "__main__":
    verify_changes()
