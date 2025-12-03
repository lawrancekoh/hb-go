from playwright.sync_api import sync_playwright

def verify_footer_changes():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        # Use HashRouter format as per memory: /#/help, /#/settings
        # Wait for the app to load
        page = browser.new_page()

        # 1. Verify Home Page (Layout) - Should NOT have footer
        print("Checking Home Page for footer absence...")
        page.goto("http://localhost:5173/#/")
        page.wait_for_selector("body")
        # Give it a moment to render
        page.wait_for_timeout(2000)

        # Check if the footer with "Developed by Lawrance Koh" exists in Layout
        # In the original Layout, it was a <footer> tag.
        # We removed it, so there should be no footer tag in Layout, OR no footer visible at the bottom of Home.
        # However, Settings has a footer now.

        # Let's take a screenshot of Home to visually confirm.
        page.screenshot(path="verification/home_no_footer.png")

        # We can also check for the text "Developed by Lawrance Koh" on Home. It should be absent.
        content = page.content()
        if "Developed by Lawrance Koh" in content:
            print("FAILURE: 'Developed by Lawrance Koh' found on Home page (should be gone from global footer).")
        else:
            print("SUCCESS: 'Developed by Lawrance Koh' NOT found on Home page.")

        # 2. Verify Settings Page - Should HAVE new footer
        print("Checking Settings Page for new footer...")
        page.goto("http://localhost:5173/#/settings")
        page.wait_for_selector("h1:has-text('Settings')")
        page.wait_for_timeout(2000)

        # Scroll to bottom
        page.evaluate("window.scrollTo(0, document.body.scrollHeight)")
        page.wait_for_timeout(1000)

        # Take screenshot of Settings footer
        page.screenshot(path="verification/settings_footer.png")

        # Check for new elements
        if page.get_by_text("HB Go").count() > 0:
             print("Found 'HB Go' text")

        if page.get_by_text("Offline PWA").count() > 0:
             print("Found 'Offline PWA' text")

        if page.get_by_text("Developed by Lawrance Koh").count() > 0:
             print("Found 'Developed by Lawrance Koh' credit")

        # Check for links
        if page.get_by_role("link", name="Contact").count() > 0:
             print("Found Contact link")

        if page.get_by_role("link", name="Support").count() > 0:
             print("Found Support link")

        if page.get_by_role("link", name="Source").count() > 0:
             print("Found Source link")

        browser.close()

if __name__ == "__main__":
    verify_footer_changes()
