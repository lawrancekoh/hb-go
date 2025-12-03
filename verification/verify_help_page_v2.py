from playwright.sync_api import sync_playwright

def verify_help_page():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()

        # Navigate to the Help page
        # Base path is /hb-go/, and HashRouter is used.
        # So the URL should be http://localhost:5173/hb-go/#/help
        page.goto("http://localhost:5173/hb-go/#/help")

        # Also need to handle onboarding if it appears.
        # The memory says: "Playwright verification scripts for the Editor must handle the Onboarding overlay by bypassing it via `localStorage.setItem('hb_has_onboarded', 'true')` and ensuring a full app mount (e.g., via reload)."

        # Let's try to set local storage before loading content fully, or reload.
        # Or, since we are using HashRouter, we can load the page, set local storage, and then reload.

        # However, page.goto waits for load.

        # Strategy:
        # 1. Go to root
        # 2. Set localStorage
        # 3. Reload/Go to help

        page.goto("http://localhost:5173/hb-go/")
        page.evaluate("localStorage.setItem('hb_has_onboarded', 'true')")
        page.goto("http://localhost:5173/hb-go/#/help")

        # Wait for the Pro Tips card to be visible
        # We look for the text "Pro Tips" which is in the CardTitle
        page.get_by_text("Pro Tips").wait_for(timeout=10000)

        # Verify the presence of new headers
        if page.get_by_role("heading", name="App Features").is_visible():
            print("Found 'App Features' subsection")
        else:
            print("ERROR: 'App Features' subsection not found")

        if page.get_by_role("heading", name="Desktop Workflow").is_visible():
            print("Found 'Desktop Workflow' subsection")
        else:
             print("ERROR: 'Desktop Workflow' subsection not found")

        # Verify specific new text
        # Using get_by_text with partial match logic or simply checking content
        if page.get_by_text("Snap a photo of the item itself").is_visible():
            print("Found 'No Receipt? No Problem' text")
        else:
            print("ERROR: 'No Receipt? No Problem' text not found")

        if page.get_by_text("We save the time").first.is_visible():
             print("Found 'Chronological Order' text")
        else:
             print("ERROR: 'Chronological Order' text not found")

        page.screenshot(path="verification/help_page_pro_tips.png", full_page=True)

        browser.close()

if __name__ == "__main__":
    verify_help_page()
