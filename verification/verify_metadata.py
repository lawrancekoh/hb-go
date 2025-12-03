from playwright.sync_api import sync_playwright

def verify_meta_and_offline():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()

        # Navigate to the app (assuming default port 5173 based on vite)
        # We need to wait a bit for the server to start, or we can just try.
        # But run_in_bash_session runs in background.
        # I'll try localhost:5173/hb-go/ based on base URL in vite.config.js
        try:
            page.goto("http://localhost:5173/hb-go/")
            page.wait_for_load_state("networkidle")
        except Exception as e:
            print(f"Error navigating: {e}")
            browser.close()
            return

        # 1. Verify Title
        title = page.title()
        print(f"Title: {title}")
        if title != "HB Go - Intelligent HomeBank Companion":
            print("FAILURE: Title does not match.")
        else:
            print("SUCCESS: Title matches.")

        # 2. Verify Meta Description
        description = page.locator('meta[name="description"]').get_attribute("content")
        print(f"Description: {description}")
        expected_desc = "The intelligent, offline-first receipt scanner for HomeBank. Detects objects, matches categories, and syncs via CSV. Privacy-focused."
        if description != expected_desc:
            print("FAILURE: Description does not match.")
        else:
             print("SUCCESS: Description matches.")

        # 3. Verify Open Graph Title
        og_title = page.locator('meta[property="og:title"]').get_attribute("content")
        print(f"OG Title: {og_title}")
        if og_title != "HB Go - Intelligent HomeBank Companion":
             print("FAILURE: OG Title does not match.")
        else:
             print("SUCCESS: OG Title matches.")

        # 4. Verify Open Graph Description
        og_desc = page.locator('meta[property="og:description"]').get_attribute("content")
        print(f"OG Description: {og_desc}")
        expected_og_desc = "Scan receipts, detect objects with AI, and sync with HomeBank. Offline & Privacy-First."
        if og_desc != expected_og_desc:
             print("FAILURE: OG Description does not match.")
        else:
             print("SUCCESS: OG Description matches.")

        # 5. Screenshot of Home Page to see branding? (Optional but good)
        # The prompt asked for "Branding: Update the App Title, Tagline..."
        # The Tagline is in README.md, but maybe I can check if anything visual changed on the page?
        # The user didn't ask to change the visible page content (H1 or text), only metadata and README.
        # Wait, Step 3 says "Update Documentation (README.md)".
        # Step 2 says "Update Metadata (index.html)".
        # Does the UI show the tagline?
        # I'll take a screenshot anyway.
        page.screenshot(path="verification/verification_metadata.png")

        browser.close()

if __name__ == "__main__":
    verify_meta_and_offline()
