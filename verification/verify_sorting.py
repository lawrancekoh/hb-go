
import asyncio
from playwright.async_api import async_playwright, expect

async def run():
    async with async_playwright() as p:
        browser = await p.chromium.launch()
        context = await browser.new_context()
        page = await context.new_page()

        # The base URL is /hb-go/
        base_url = "http://localhost:5173/hb-go/"

        print(f"Navigating to {base_url}...")
        await page.goto(base_url)

        # Bypass onboarding
        print("Bypassing onboarding...")
        await page.evaluate("localStorage.setItem('hb_has_onboarded', 'true')")
        await page.reload()

        # Wait a bit
        await page.wait_for_timeout(2000)

        # -------------------------------------------------------------------
        # Tx 1: 09:00
        # -------------------------------------------------------------------
        print("Adding Tx 1 (09:00)...")
        await page.goto(base_url + "#/editor/new")
        await page.wait_for_selector('input[type="date"]')

        # Fill date & time
        await page.locator('input[type="date"]').fill("2023-10-10")
        await page.locator('input[type="time"]').fill("09:00")

        # Payee input
        await page.locator('input[name="payee"]').fill("Tx 09:00")

        # Amount
        await page.locator('input[name="amount"]').fill("10")

        # Save
        await page.get_by_role("button", name="Save").click()
        await page.wait_for_url(base_url + "#/")


        # -------------------------------------------------------------------
        # Tx 2: 14:00
        # -------------------------------------------------------------------
        print("Adding Tx 2 (14:00)...")
        await page.goto(base_url + "#/editor/new")
        await page.wait_for_selector('input[type="date"]')

        await page.locator('input[type="date"]').fill("2023-10-10")
        await page.locator('input[type="time"]').fill("14:00")
        await page.locator('input[name="payee"]').fill("Tx 14:00")
        await page.locator('input[name="amount"]').fill("20")

        await page.get_by_role("button", name="Save").click()
        await page.wait_for_url(base_url + "#/")

        # -------------------------------------------------------------------
        # Tx 3: 10:00
        # -------------------------------------------------------------------
        print("Adding Tx 3 (10:00)...")
        await page.goto(base_url + "#/editor/new")
        await page.wait_for_selector('input[type="date"]')

        await page.locator('input[type="date"]').fill("2023-10-10")
        await page.locator('input[type="time"]').fill("10:00")
        await page.locator('input[name="payee"]').fill("Tx 10:00")
        await page.locator('input[name="amount"]').fill("15")

        await page.get_by_role("button", name="Save").click()
        await page.wait_for_url(base_url + "#/")

        # -------------------------------------------------------------------
        # Verification
        # -------------------------------------------------------------------
        print("Verifying order...")
        await page.wait_for_selector(".group") # Ensure list is rendered

        # Capture screenshot
        await page.screenshot(path="verification/sorting_verification.png")

        # Extract payee names
        # Note: 'h3.font-semibold' is the selector for Payee name in Home.jsx
        payees = await page.locator("h3.font-semibold").all_inner_texts()
        print("Payees order:", payees)

        # Expected order: Tx 14:00, Tx 10:00, Tx 09:00
        if len(payees) < 3:
             print("Not enough transactions found!")
             exit(1)

        assert payees[0] == "Tx 14:00", f"Expected first to be Tx 14:00, got {payees[0]}"
        assert payees[1] == "Tx 10:00", f"Expected second to be Tx 10:00, got {payees[1]}"
        assert payees[2] == "Tx 09:00", f"Expected third to be Tx 09:00, got {payees[2]}"

        print("Verification Passed!")
        await browser.close()

if __name__ == "__main__":
    asyncio.run(run())
