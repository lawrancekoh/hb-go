from playwright.sync_api import sync_playwright, expect
import time

def verify_editor_default_date(page):
    # Navigate to the editor for a new transaction
    print("Navigating to /#/editor/new...")
    page.goto("http://localhost:5173/#/editor/new")

    # Wait for the page to load
    page.wait_for_selector("h1")

    # Check that the header says "New Transaction"
    expect(page.get_by_role("heading", name="New Transaction")).to_be_visible()

    # Get today's date in YYYY-MM-DD format
    from datetime import datetime
    today_str = datetime.now().strftime("%Y-%m-%d")
    print(f"Today is: {today_str}")

    # Check the date input
    date_input = page.locator("input[name='date']")
    date_value = date_input.input_value()
    print(f"Date input value: {date_value}")

    if date_value == today_str:
        print("SUCCESS: Date input is set to today's date.")
    else:
        print(f"FAILURE: Date input is {date_value}, expected {today_str}.")
        raise Exception(f"Date input mismatch. Expected {today_str}, got {date_value}")

    # Take a screenshot
    page.screenshot(path="verification/editor_default_date.png")
    print("Screenshot saved to verification/editor_default_date.png")

if __name__ == "__main__":
    with sync_playwright() as p:
        print("Launching browser...")
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        try:
            verify_editor_default_date(page)
        except Exception as e:
            print(f"Error: {e}")
        finally:
            browser.close()
