from playwright.sync_api import sync_playwright

def verify_features():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        # Emulate dark mode
        context = browser.new_context(color_scheme='dark')
        page = context.new_page()

        # 1. Verify Home Page in Dark Mode
        print("Navigating to Home Page...")
        page.goto("http://localhost:5173/hb-go/")
        # Wait for content to load
        page.wait_for_selector('text=HB Go')

        # Bypass onboarding if needed (though not implemented in previous tasks, it's mentioned in memory)
        page.evaluate("localStorage.setItem('hb_has_onboarded', 'true')")
        page.reload()
        page.wait_for_selector('text=HB Go')

        print("Taking screenshot of Home Page (Dark Mode)...")
        page.screenshot(path="verification/home_dark.png")

        # 2. Verify Settings Page in Dark Mode and Date Format
        print("Navigating to Settings Page...")
        # Use more robust locator
        page.click('text=Settings')
        page.wait_for_selector('text=Settings')

        # Check if Date Format selector is present
        print("Checking for Date Format selector...")
        if page.is_visible('select[name="dateFormat"]'):
            print("Date Format selector found.")
        else:
            print("Date Format selector NOT found.")

        print("Taking screenshot of Settings Page (Dark Mode)...")
        page.screenshot(path="verification/settings_dark.png")

        # 3. Verify Editor Page in Dark Mode
        print("Navigating to Editor Page (New)...")
        # Go back to home then click new
        page.goto("http://localhost:5173/hb-go/")
        page.wait_for_selector('text=New Transaction', state='visible')
        page.click('text=New Transaction')
        page.wait_for_selector('input[name="date"]')

        print("Taking screenshot of Editor Page (Dark Mode)...")
        page.screenshot(path="verification/editor_dark.png")

        browser.close()

if __name__ == "__main__":
    verify_features()
