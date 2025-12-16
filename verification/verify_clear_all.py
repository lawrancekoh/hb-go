from playwright.sync_api import sync_playwright, expect
import time

def run():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context()
        page = context.new_page()

        print("Navigating to home...")
        page.goto("http://localhost:5173/hb-go/#/")

        print("Bypassing onboarding...")
        page.evaluate("localStorage.setItem('hb_has_onboarded', 'true')")
        page.reload()

        page.wait_for_selector("text=Total Pending")

        print("Adding a test transaction...")
        page.click("a[href='#/editor/new']")

        page.wait_for_url("**/editor/new")

        page.fill("input[name='amount']", "12.34")
        page.fill("input[name='payee']", "Test Payee")

        page.click("button:has-text('Save')")

        page.wait_for_url("**/hb-go/#/")
        page.wait_for_selector("text=Test Payee")

        print("Taking screenshot with transaction...")
        page.screenshot(path="verification/1_with_transaction.png")

        clear_btn = page.locator("button:has-text('Clear')")
        expect(clear_btn).to_be_enabled()

        print("Hovering Clear button...")
        clear_btn.hover()
        page.screenshot(path="verification/1_hover.png")

        print("Clicking Clear...")
        page.once("dialog", lambda dialog: dialog.accept())
        clear_btn.click()

        page.wait_for_selector("text=No transactions yet")

        print("Taking screenshot after clear...")
        page.screenshot(path="verification/2_cleared.png")

        browser.close()

if __name__ == "__main__":
    run()
