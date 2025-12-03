from playwright.sync_api import sync_playwright

def verify_help_dark_mode():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(
            color_scheme='dark'  # Force dark mode preference
        )
        page = context.new_page()

        # Navigate to Help page
        # Note: Using hash router path
        page.goto("http://localhost:5173/#/help")

        # Wait for content to load
        page.wait_for_selector("h1:has-text('How to Use')")

        # Manually force dark mode class on html element just in case
        # app uses class-based dark mode (Tailwind) rather than just system pref
        page.evaluate("document.documentElement.classList.add('dark')")

        # Take screenshot
        page.screenshot(path="verification/help_dark_mode.png", full_page=True)

        browser.close()

if __name__ == "__main__":
    verify_help_dark_mode()
