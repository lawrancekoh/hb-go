from playwright.sync_api import sync_playwright, expect
import time

def run(playwright):
    browser = playwright.chromium.launch(headless=True)
    page = browser.new_page()

    # Bypass onboarding
    page.goto("http://localhost:5173/hb-go/") # Load to set origin
    page.evaluate("localStorage.setItem('hb_has_onboarded', 'true')")

    # Go to Editor to add transaction
    page.goto("http://localhost:5173/hb-go/#/editor/new")
    page.wait_for_timeout(2000)

    # Fill form
    # Note: Editor might default amount to 0 or focus it.
    # We need to find the input. Memory says inputs are 'Payee', 'Category', 'Memo', 'Tags', 'Amount'.
    # And Amount input color changes based on toggle.

    # Fill Amount
    page.fill("input[name='amount']", "1000")

    # Toggle to expense (if not already? Default is expense usually, but let's check toggle)
    # The toggle usually says "Expense" or "Income". Memory says "Editor interface includes an 'Expense / Income' toggle".
    # We'll assume default is Expense (negative).

    # Fill Payee (required?)
    # Payee is usually required or auto-filled.
    page.fill("input[placeholder='Payee']", "Test Shop")

    # Click Save (Floppy disk icon or "Save" text?)
    # Usually a button at bottom or top right.
    # Let's assume there is a button with type="submit" or verify button.
    # I'll look for a button that looks like save.

    # Actually, simpler:
    # Just look for the button with class related to saving.
    # Or press Enter in a field?

    # Let's look at Editor code if needed, but I'll try to just click the button that likely exists.
    # Assuming there's a big button at the bottom.
    page.get_by_role("button", name="Save Transaction").click()

    page.wait_for_timeout(2000)

    # Should be back at Home.
    # Take screenshot in mobile view
    page.set_viewport_size({"width": 375, "height": 800})
    page.screenshot(path="verification/mobile_layout_populated.png")

    browser.close()

with sync_playwright() as playwright:
    run(playwright)
