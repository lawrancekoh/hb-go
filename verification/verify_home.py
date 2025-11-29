from playwright.sync_api import sync_playwright, expect

def verify_home_page():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        # Wait a bit for the server to spin up
        page = browser.new_page()
        try:
            # Vite default port is usually 5173
            page.goto("http://localhost:5173/hb-go/")

            # Check for the main header
            expect(page.get_by_role("heading", name="Inbox")).to_be_visible()

            # Check for the FAB
            expect(page.get_by_role("button", name="+")).to_be_visible()

            # Take a screenshot
            page.screenshot(path="verification/home_page.png")
            print("Screenshot taken successfully")
        except Exception as e:
            print(f"Error: {e}")
        finally:
            browser.close()

if __name__ == "__main__":
    verify_home_page()
