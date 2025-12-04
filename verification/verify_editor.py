
import time
from playwright.sync_api import sync_playwright

def verify_editor_ux():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        # Using a context with storage state to simulate onboarding completion if needed
        # Or just manually set localStorage
        context = browser.new_context()

        # Add init script to skip onboarding
        context.add_init_script("""
            localStorage.setItem('hb_has_onboarded', 'true');
        """)

        page = context.new_page()

        # Navigate to Editor
        print("Navigating to Editor...")
        # Assuming port 5173 based on Vite defaults
        try:
            page.goto("http://localhost:5173/hb-go/#/editor/new")

            # Wait for page to load
            page.wait_for_selector("h1:has-text('New Transaction')", timeout=10000)

            # 1. Verify 'Today' button
            print("Verifying Today button...")
            today_btn = page.get_by_text("Today", exact=True)
            if today_btn.is_visible():
                print("Today button is visible.")
            else:
                print("Today button NOT visible.")

            # Take screenshot of empty form with Today button
            page.screenshot(path="verification/editor_initial.png")

            # 2. Verify Clear Button logic (Payee)
            print("Verifying Clear Button for Payee...")
            payee_input = page.locator("input[name='payee']")
            payee_input.fill("Test Merchant")

            # Wait a bit for state update
            time.sleep(0.5)

            # The Clear button is a button inside the relative container.
            # We can find it by the X icon or just as a button following the input.
            # Let's target the button that contains the SVG X.

            # We expect multiple X buttons if multiple fields are filled, but here only Payee is filled.
            # But wait, Amount might have a value? Initial amount is ''.

            # Let's limit scope to the Payee container.
            # Payee input parent is the relative div.
            payee_container = page.locator("input[name='payee']").locator("..")
            clear_btn = payee_container.locator("button")

            if clear_btn.is_visible():
                print("Clear button appeared.")
                page.screenshot(path="verification/editor_filled.png")

                # Click clear
                clear_btn.click()
                time.sleep(0.5)

                # Verify cleared
                val = payee_input.input_value()
                if val == "":
                    print("Payee cleared successfully.")
                else:
                    print(f"Payee NOT cleared. Value: '{val}'")

                page.screenshot(path="verification/editor_cleared.png")
            else:
                print("Clear button NOT visible.")
                page.screenshot(path="verification/editor_failed_btn.png")

        except Exception as e:
            print(f"Error: {e}")
            page.screenshot(path="verification/error.png")

        browser.close()

if __name__ == "__main__":
    verify_editor_ux()
