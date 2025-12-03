from playwright.sync_api import sync_playwright

def verify_settings_footer():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context()

        # Bypass onboarding by pre-setting localStorage
        context.add_init_script("""
            localStorage.setItem('hb_has_onboarded', 'true');
        """)

        page = context.new_page()

        # Navigate to Settings page
        page.goto("http://localhost:5173/#/settings")

        # Wait for footer to be visible
        page.wait_for_selector("footer")

        # Check for specific text added
        # Note: The robot emoji might be rendered differently depending on the system fonts in the container,
        # but we check for the text content.
        # Use a more flexible locator if exact text match fails due to whitespace or emojis
        footer_text = page.locator("footer").text_content()

        if "Built with" in footer_text and "Lawrance Koh" in footer_text:
             print("Credits text found")
        else:
             print("Credits text NOT found")

        if "A HomeBank user since March 2025" in footer_text:
             print("Story text found")
        else:
             print("Story text NOT found")

        # Check for LinkedIn link
        linkedin_link = page.get_by_role("link", name="LinkedIn")
        if linkedin_link.count() > 0:
            print("LinkedIn link found")
        else:
            print("LinkedIn link NOT found")

        # Take screenshot of the footer area
        footer = page.locator("footer")
        # Add some padding to screenshot if possible or just screenshot the element
        footer.screenshot(path="verification/settings_footer.png")

        browser.close()

if __name__ == "__main__":
    verify_settings_footer()
