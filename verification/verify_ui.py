from playwright.sync_api import sync_playwright

def verify_changes():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        # We need to use mobile view or desktop view to verify both, but mostly header and generic buttons.
        # Let's start with Desktop to see the header clearly.
        page = browser.new_page(viewport={'width': 1280, 'height': 800})

        try:
            # Navigate to the app (assuming default vite port 5173)
            page.goto("http://localhost:5173/hb-go/")

            # Wait for content to load
            page.wait_for_selector('header')

            # Force onboarded state to skip onboarding overlay if we want to see the main UI
            # But we also want to verify Onboarding buttons.
            # So let's take a screenshot of the main page (which might show onboarding)

            # 1. Screenshot of Onboarding (if it appears)
            page.screenshot(path="verification/onboarding_step1.png")
            print("Captured onboarding_step1.png")

            # Click Get Started if available to see next step
            try:
                get_started = page.get_by_role("button", name="Get Started")
                if get_started.is_visible():
                    get_started.click()
                    page.wait_for_timeout(500)
                    page.screenshot(path="verification/onboarding_step2.png")
                    print("Captured onboarding_step2.png")

                    # Click "Use Defaults & Continue"
                    page.get_by_role("button", name="Use Defaults & Continue").click()
                    page.wait_for_timeout(500)
                    page.screenshot(path="verification/onboarding_step3.png")
                    print("Captured onboarding_step3.png")

                    # Click "Start Scanning"
                    page.get_by_role("button", name="Start Scanning").click()
                    page.wait_for_timeout(500)
            except Exception as e:
                print(f"Onboarding flow skipped or error: {e}")

            # Now we should be on the main page (Inbox)
            # Verify Header style
            page.screenshot(path="verification/main_page.png")
            print("Captured main_page.png")

        except Exception as e:
            print(f"Error: {e}")
        finally:
            browser.close()

if __name__ == "__main__":
    verify_changes()
