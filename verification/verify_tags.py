
from playwright.sync_api import sync_playwright, expect
import time

def verify_tag_suggestions():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context()
        page = context.new_page()

        # 1. Inject localStorage data for tags
        page.add_init_script("""
            localStorage.setItem('hb_tags', JSON.stringify(['Lunch', 'Dinner', 'Groceries', 'Transport', 'Utilities', 'Travel']));
            localStorage.setItem('hb_has_onboarded', 'true');
        """)

        # 2. Go to Editor
        page.goto("http://localhost:5173/#/editor/new")

        # Wait for page load
        page.get_by_role("heading", name="New Transaction").wait_for()

        # 3. Simulate typing in Tags input
        tags_input = page.locator('input[name="tags"]')
        tags_input.fill("Lu")

        # Wait for suggestions to appear
        suggestion_button = page.get_by_role("button", name="Lunch")
        expect(suggestion_button).to_be_visible()

        # Take screenshot of suggestions appearing
        page.screenshot(path="verification/tags_suggestion_1.png")
        print("Screenshot 1 taken: Suggestions visible")

        # 4. Click the suggestion
        suggestion_button.click()

        # Verify input value updated to "Lunch " (with space)
        expect(tags_input).to_have_value("Lunch ")

        # 5. Type another tag
        # Focus explicitly
        tags_input.focus()
        tags_input.type("Tra")

        transport_btn = page.get_by_role("button", name="Transport")

        # Increase timeout just in case
        expect(transport_btn).to_be_visible(timeout=5000)

        # Take screenshot of multiple suggestions
        page.screenshot(path="verification/tags_suggestion_2.png")
        print("Screenshot 2 taken: Multiple suggestions")

        browser.close()

if __name__ == "__main__":
    verify_tag_suggestions()
