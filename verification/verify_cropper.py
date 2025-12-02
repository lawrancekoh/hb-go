
import os
import binascii
from playwright.sync_api import sync_playwright

def verify_cropper():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(
            viewport={'width': 375, 'height': 812},
            user_agent='Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0 Mobile/15E148 Safari/604.1'
        )
        page = context.new_page()

        try:
            # Navigate directly to the Editor page (New Transaction)
            # Using HashRouter: /hb-go/#/editor/new
            url = "http://localhost:5173/hb-go/#/editor/new"
            print(f"Navigating to {url}")
            page.goto(url)
            page.wait_for_load_state("networkidle")

            # Create dummy image
            jpeg_hex = "ffd8ffe000104a46494600010101004800480000ffdb004300080606070605080707070909080a0c140d0c0b0b0c1912130f141d1a1f1e1d1a1c1c20242e2720222c231c1c2837292c30313434341f27393d38323c2e333432ffdb0043010909090c0b0c180d0d1832211c213232323232323232323232323232323232323232323232323232323232323232323232323232323232323232323232323232ffc00011080064006403012200021101031101ffc4001f0000010501010101010100000000000000000102030405060708090a0bffc400b5100002010303020403050504040000017d01020300041105122131410613516107227114328191a1082342b1c11552d1f02433627282090a161718191a25262728292a3435363738393a434445464748494a535455565758595a636465666768696a737475767778797a838485868788898a92939495969798999aa2a3a4a5a6a7a8a9aaf020410102030405060708090a0b01000301010101010101010100000000000102030405060708090a0bffc4001f01000301010101010101010100000000000102030405060708090a0bffda000c03010002110311003f00f958a28a2800a28a2800a28a2800a28a2800a28a2800a28a2800a28a2800a28a2800a28a2800a28a2800a28a2800a28a2800a28a2800a28a2800a28a2800a28a2800a28a2800a28a2800a28a2800a28a2800a28a2800a28a2800a28a2800a28a2800a28a2800a28a2800a28a2800a28a2800a28a2800a28a2800a28a2800a28a2800a28a2800a28a2800a28a2800afd9"
            with open("verification/dummy_receipt.jpg", "wb") as f:
                f.write(binascii.unhexlify(jpeg_hex))

            page.screenshot(path="verification/editor_page.png")
            print("Editor page loaded")

            # Look for file input
            file_input = page.locator('input[type="file"]').first
            if file_input.count() > 0:
                print("File input found")
                file_input.set_input_files("verification/dummy_receipt.jpg")

                # Wait for cropper
                print("Waiting for cropper...")
                page.wait_for_timeout(2000)

                # Check for "Rotate" button (title="Rotate 90°")
                rotate_btn = page.locator('button[title="Rotate 90°"]')

                if rotate_btn.count() > 0:
                     print("Cropper visible")
                     page.screenshot(path="verification/cropper_visible.png")

                     # Rotate
                     print("Rotating...")
                     rotate_btn.click()
                     page.wait_for_timeout(500)
                     page.screenshot(path="verification/cropper_rotated.png")

                     # Confirm
                     print("Confirming...")
                     page.get_by_text("Confirm").click()
                     page.wait_for_timeout(1000)
                     print("Crop confirmed")

                     # Take final screenshot of editor with image
                     page.screenshot(path="verification/editor_with_image.png")
                else:
                    print("Cropper not detected")
                    page.screenshot(path="verification/cropper_missing.png")
            else:
                print("File input not found")
                page.screenshot(path="verification/no_file_input.png")

        except Exception as e:
            print(f"Error: {e}")
            page.screenshot(path="verification/error.png")
        finally:
            browser.close()

if __name__ == "__main__":
    verify_cropper()
