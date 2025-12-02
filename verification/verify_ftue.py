from playwright.sync_api import sync_playwright

def verify_ftue():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        # Clear local storage to simulate FTUE
        context = browser.new_context(
            storage_state=None
        )
        page = context.new_page()

        # Step 1: Visit Home, expect Onboarding Modal
        print("Navigating to home...")
        # Assuming HashRouter, so root is /#/ or just / and it redirects/loads
        page.goto("http://localhost:5173/")
        page.wait_for_load_state("networkidle")

        # Take screenshot of Slide 1 (Welcome)
        print("Taking screenshot of Welcome slide...")
        page.screenshot(path="verification/onboarding_1_welcome.png")

        # Click Get Started
        print("Clicking Get Started...")
        page.get_by_role("button", name="Get Started").click()
        page.wait_for_timeout(500)

        # Take screenshot of Slide 2 (Sync)
        print("Taking screenshot of Sync slide...")
        page.screenshot(path="verification/onboarding_2_sync.png")

        # Click Use Defaults
        print("Clicking Use Defaults...")
        page.get_by_role("button", name="Use Defaults & Continue").click()
        page.wait_for_timeout(500)

        # Take screenshot of Slide 3 (Ready)
        print("Taking screenshot of Ready slide...")
        page.screenshot(path="verification/onboarding_3_ready.png")

        # Click Start Scanning
        print("Clicking Start Scanning...")
        page.get_by_role("button", name="Start Scanning").click()
        page.wait_for_timeout(500)

        # Verify Onboarding closed and we are on Home
        print("Taking screenshot of Home after onboarding...")
        page.screenshot(path="verification/home_after_onboarding.png")

        # Verify Defaults are seeded
        localStorage = page.evaluate("() => localStorage.getItem('hb_categories')")
        print(f"Categories in localStorage: {localStorage is not None}")

        # Go to Settings to verify OCR options removed
        print("Navigating to Settings...")
        # HashRouter requires /#/settings
        page.goto("http://localhost:5173/#/settings")
        page.wait_for_load_state("networkidle")
        page.wait_for_timeout(1000) # Give it a moment to render

        print("Taking screenshot of Settings...")
        page.screenshot(path="verification/settings_cleaned.png")

        browser.close()

if __name__ == "__main__":
    verify_ftue()
