from playwright.sync_api import sync_playwright

def verify_export_logic():
    with sync_playwright() as p:
        print("Launching browser...")
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()

        base_url = "http://localhost:4173/hb-go/"

        print(f"Navigating to {base_url}...")
        page.goto(base_url, wait_until="domcontentloaded")
        page.wait_for_timeout(2000) # Give it a sec to settle

        # Bypass onboarding
        page.evaluate("localStorage.setItem('hb_has_onboarded', 'true')")

        # UI Fallback: Add transaction
        print("Adding transaction via UI...")
        page.goto(f"{base_url}#/editor/new", wait_until="domcontentloaded")

        try:
            page.wait_for_selector("input[name='amount']", timeout=5000)
        except:
            print("Failed to find amount input. Screenshotting.")
            page.screenshot(path="verification/error.png")
            browser.close()
            return

        page.fill("input[name='amount']", "10.00")
        page.fill("input[name='payee']", "Test Store")
        page.click("button[type='submit']")

        # Wait for home
        page.wait_for_timeout(2000)

        if page.get_by_text("Test Store").is_visible():
            print("Transaction loaded via UI.")
        else:
            print("Failed to load transaction. Exiting.")
            page.screenshot(path="verification/error_tx.png")
            browser.close()
            return

        # Setup dialog handler and timing tracking
        export_btn = page.get_by_role("button", name="Export")

        page.evaluate("window.confirmCalledAt = 0;")
        page.evaluate("window.exportClickedAt = 0;")

        def handle_dialog(dialog):
            print(f"Dialog appeared: {dialog.message}")
            page.evaluate("window.confirmCalledAt = Date.now();")
            dialog.accept() # Click OK to clear transactions

        page.on("dialog", handle_dialog)

        print("Clicking Export...")
        page.evaluate("window.exportClickedAt = Date.now();")
        export_btn.click()

        # Wait enough time for the delay (500ms) + dialog handling
        page.wait_for_timeout(2000)

        # Verify timing
        times = page.evaluate("""
            () => ({
                clicked: window.exportClickedAt,
                confirmed: window.confirmCalledAt
            })
        """)

        if times['confirmed'] == 0:
            print("FAILURE: Confirm dialog was never called.")
        else:
            diff = times['confirmed'] - times['clicked']
            print(f"Delay observed: {diff}ms")

            if diff >= 450:
                print("SUCCESS: Delay > 450ms is present.")
            else:
                print("FAILURE: Delay is too short.")

        # Verify clearing
        page.wait_for_timeout(1000)
        if page.get_by_text("No transactions yet").is_visible():
            print("SUCCESS: Transactions were cleared.")
        else:
            print("FAILURE: Transactions remain visible.")

        page.screenshot(path="verification/verify_export.png")
        browser.close()

if __name__ == "__main__":
    verify_export_logic()
