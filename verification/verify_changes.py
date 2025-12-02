from playwright.sync_api import sync_playwright

def verify_changes():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context()
        page = context.new_page()

        # Navigate to the app (using HashRouter format)
        page.goto("http://localhost:5173/hb-go/")

        # Bypass Onboarding
        page.evaluate("localStorage.setItem('hb_has_onboarded', 'true')")
        # Ensure we are in a state where AI config is loaded for the Editor check
        page.evaluate("localStorage.setItem('hb_ai_config', '{\"provider\": \"openai\", \"apiKey\": \"dummy\", \"models\": [\"gpt-4o\"]}')")
        page.reload()

        # 1. Verify Editor Empty State
        # Navigate to Editor
        page.goto("http://localhost:5173/hb-go/#/editor/new")

        try:
            # We look for the text that appears when aiConfig is present
            page.wait_for_selector("text=Scan a receipt, or snap a photo of the item!", timeout=5000)
            page.screenshot(path="verification/editor_empty_state.png")
            print("Verified Editor empty state")
        except Exception as e:
            print(f"Failed to find editor text: {e}")
            page.screenshot(path="verification/editor_failure.png")

        # 2. Verify Settings Help Text
        page.goto("http://localhost:5173/hb-go/#/settings")

        try:
            # Check for help text
            page.wait_for_selector("text=Vision (Multi-modal)", timeout=5000)
            page.screenshot(path="verification/settings_help_text.png")
            print("Verified Settings help text")
        except Exception as e:
            print(f"Failed to find settings text: {e}")
            page.screenshot(path="verification/settings_failure.png")

        browser.close()

if __name__ == "__main__":
    verify_changes()
