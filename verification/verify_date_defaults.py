from playwright.sync_api import sync_playwright, expect
import time

def run():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context()
        page = context.new_page()

        # 1. Navigate to the app (using localhost from npm run dev)
        # Assuming port 5173, but we should check.
        # Wait for dev server to be ready? I'll assume it is running on 5173.
        # Retry logic just in case
        try:
            page.goto("http://localhost:5173/hb-go/")
        except Exception as e:
            print(f"Failed to load page: {e}")
            return

        # Handle onboarding if present (set localStorage)
        page.evaluate("localStorage.setItem('hb_has_onboarded', 'true')")
        page.reload()

        # 2. Wait for Home to load
        # Check for 'New Transaction' button or text
        expect(page.get_by_text("New Transaction")).to_be_visible()

        # 3. Click 'New Transaction' to open Editor
        # On desktop it might be in header, on mobile it's a FAB.
        # Looking at Editor.jsx, it has title "New Transaction" when id='new'.
        # On Home page, we need to find the link to /editor/new
        page.get_by_role("link", name="New Transaction").click()

        # 4. Verify Editor loaded
        expect(page.get_by_role("heading", name="New Transaction")).to_be_visible()

        # 5. Check Date and Time fields
        # They should be populated with Today and Current Time by default
        date_input = page.locator("input[name='date']")
        time_input = page.locator("input[name='time']")

        date_val = date_input.input_value()
        time_val = time_input.input_value()

        print(f"Date found: {date_val}")
        print(f"Time found: {time_val}")

        # Basic check that they are not empty
        assert date_val != "", "Date should not be empty"
        assert time_val != "", "Time should not be empty"

        # 6. Take screenshot
        page.screenshot(path="verification/editor_default_values.png")

        browser.close()

if __name__ == "__main__":
    run()
