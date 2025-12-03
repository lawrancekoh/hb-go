
from playwright.sync_api import sync_playwright

def verify_help_footer():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        try:
            # Navigate to the Help page (hash router)
            page.goto('http://localhost:5173/#/help')
            page.wait_for_selector('h3:has-text("Still need help?")')

            # Scroll to bottom
            page.evaluate('window.scrollTo(0, document.body.scrollHeight)')
            page.wait_for_timeout(500) # Wait for potential layout shifts

            # Take screenshot of the footer area
            # We can select the last element with class border-t if we want targeted, or full page
            # Let's take full page to see context, or viewport
            page.screenshot(path='verification/help_footer.png', full_page=True)
            print('Screenshot saved to verification/help_footer.png')
        except Exception as e:
            print(f'Error: {e}')
        finally:
            browser.close()

if __name__ == '__main__':
    verify_help_footer()

