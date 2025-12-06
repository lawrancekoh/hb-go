from playwright.sync_api import sync_playwright

def verify_settings_footer():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        # Using a mobile viewport to match likely use case, but desktop is also fine.
        # The footer is visible on both.
        page = browser.new_page(viewport={'width': 1280, 'height': 1280})

        # Navigate to Settings page
        # Note: hash router is used, so use /#/settings
        # The base path is /hb-go/, so we should probably include that if testing against the dev server with base path
        # But the output says http://localhost:5173/hb-go/
        # Let's try http://localhost:5173/hb-go/#/settings

        url = "http://localhost:5173/hb-go/#/settings"
        print(f"Navigating to {url}")
        page.goto(url)

        # Wait for footer to be visible
        try:
            footer_link = page.get_by_role("link", name="LinkedIn")
            footer_link.wait_for(state="visible", timeout=10000)
        except Exception as e:
            print("Could not find LinkedIn link, maybe path is wrong?")
            page.screenshot(path="error_screenshot.png")
            raise e

        # Check that "Contact" is NOT present
        # We can try to find it and assert count is 0
        contact_links = page.get_by_role("link", name="Contact")
        if contact_links.count() > 0:
            print("Error: Contact link found!")
        else:
            print("Success: Contact link not found.")

        # Take screenshot of the footer area
        # We can scroll to bottom
        page.evaluate("window.scrollTo(0, document.body.scrollHeight)")

        # Take screenshot
        page.screenshot(path="verification_settings_footer.png")

        browser.close()

if __name__ == "__main__":
    verify_settings_footer()
