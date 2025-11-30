from playwright.sync_api import sync_playwright

def verify_upload_ui():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()

        # Navigate to the editor page (New Transaction)
        # Note: We are using HashRouter so base URL is /#/editor/new
        page.goto("http://localhost:3000/#/editor/new")

        # Wait for the page to load
        page.wait_for_selector("text=New Transaction")

        # Check if the input file element exists and has correct attributes
        file_input = page.locator("input[type='file']")

        accept_attr = file_input.get_attribute("accept")
        capture_attr = file_input.get_attribute("capture")

        print(f"Accept attribute: {accept_attr}")
        print(f"Capture attribute: {capture_attr}")

        if accept_attr == "image/*,application/pdf" and capture_attr is None:
            print("Verification PASSED: Attributes are correct.")
        else:
            print("Verification FAILED: Attributes are incorrect.")

        # Take a screenshot of the initial state
        page.screenshot(path="verification/editor_initial.png")

        browser.close()

if __name__ == "__main__":
    verify_upload_ui()
