
from playwright.sync_api import sync_playwright

def verify_editor(page):
    # 1. Load the base URL
    page.goto("http://localhost:5173/hb-go/")

    # 2. Set localStorage to bypass onboarding
    page.evaluate("localStorage.setItem('hb_has_onboarded', 'true')")

    # 3. Reload the page to ensure App re-mounts and reads localStorage
    page.reload()

    # 4. Navigate to the CORRECT Editor URL
    print("Navigating to editor with onboarding bypassed...")
    page.goto("http://localhost:5173/hb-go/#/editor/new")

    # Wait for the page to load
    page.wait_for_timeout(2000)

    # Check if modal is blocking
    if page.locator("text=Welcome to HB Go").is_visible():
        print("Onboarding still visible. Bypassing failed. Clicking through...")
        # Try to click Get Started -> Use Defaults -> Start Scanning
        page.click("text=Get Started")
        page.wait_for_timeout(500)
        page.click("text=Use Defaults & Continue")
        page.wait_for_timeout(500)
        page.click("text=Start Scanning")
        page.wait_for_timeout(1000)

    # 5. Check if the Toggle Buttons are visible
    try:
        page.wait_for_selector("button:has-text('Expense')", timeout=5000)
    except:
        print("Expense button not found, taking debug screenshot")
        page.screenshot(path="verification/debug_fail_still_modal.png")
        raise

    page.wait_for_selector("button:has-text('Income')")
    print("Buttons found!")

    # 6. Take a screenshot of the initial state (Expense selected by default)
    page.screenshot(path="verification/editor_initial.png")

    # 7. Click Income
    page.click("button:has-text('Income')")
    page.wait_for_timeout(500)

    # 8. Type an amount
    page.fill("input[name='amount']", "123.45")

    # 9. Take a screenshot of Income state
    page.screenshot(path="verification/editor_income.png")

    # 10. Click Expense again
    page.click("button:has-text('Expense')")
    page.wait_for_timeout(500)

    # 11. Take a screenshot of Expense state
    page.screenshot(path="verification/editor_expense.png")

if __name__ == "__main__":
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        try:
            verify_editor(page)
        except Exception as e:
            print(f"Error: {e}")
        finally:
            browser.close()
