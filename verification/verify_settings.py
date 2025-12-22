from playwright.sync_api import sync_playwright

def verify_settings(page):
    # Navigate to Settings
    # Since it's a HashRouter, we go to /#/settings or click the nav link
    # But Settings is a page. The URL might be http://localhost:5173/hb-go/#/settings
    # The default route is Home. Let's assume we can navigate.

    # Wait for the app to load
    page.goto("http://localhost:5173/hb-go/#/settings")

    # Wait for the Intelligence card to appear
    page.wait_for_selector("text=Intelligence (Hybrid AI)")

    # Verify "Local AI" is selected or available
    # Check if "Hugging Face Access Token" is GONE
    # We search for the text. If it's not found, that's good.
    content = page.content()
    if "Hugging Face Access Token" in content:
        print("FAIL: Token field still present!")
    else:
        print("PASS: Token field removed.")

    # Verify "Model Status" check logic exists (we can't easily verify the check itself without mocking cache,
    # but we can verify the UI elements)

    # Check for "Download Model Assets" button
    download_btn = page.get_by_role("button", name="Download Model Assets")
    if download_btn.is_visible():
        print("PASS: Download button visible.")
    else:
        print("FAIL: Download button not found.")

    # Take screenshot
    page.screenshot(path="verification/settings_page.png", full_page=True)

if __name__ == "__main__":
    with sync_playwright() as p:
        browser = p.chromium.launch()
        page = browser.new_page()
        try:
            verify_settings(page)
        finally:
            browser.close()
