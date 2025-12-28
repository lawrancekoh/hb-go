
import os
from playwright.sync_api import sync_playwright

def verify_headers():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page(viewport={"width": 1280, "height": 800})

        # Listen to console logs
        page.on("console", lambda msg: print(f"Browser console: {msg.text}"))

        page.goto("http://localhost:5173/hb-go/#/")

        # Inject seed data script
        with open('seed_data.js', 'r') as f:
            seed_script = f.read()

        print("Injecting seed data...")
        page.evaluate(seed_script)

        # Wait a bit for DB operations
        page.wait_for_timeout(1000)

        print("Reloading...")
        page.reload()

        # Check if transactions are loaded
        # If "No transactions yet" is visible, seeding failed
        if page.is_visible("text=No transactions yet"):
            print("Error: Transactions not loaded.")
        else:
            print("Transactions loaded. Checking headers...")

        # Wait for transactions
        try:
            page.wait_for_selector("text=Today", timeout=5000)
            page.wait_for_selector("text=Yesterday", timeout=5000)
            print("Headers found!")
        except Exception as e:
            print(f"Error finding headers: {e}")
            # Take screenshot anyway for debugging

        os.makedirs("/home/jules/verification", exist_ok=True)
        page.screenshot(path="/home/jules/verification/day_separators.png", full_page=True)
        print("Screenshot taken.")

        browser.close()

if __name__ == "__main__":
    verify_headers()
