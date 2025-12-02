from playwright.sync_api import sync_playwright, expect
import re
import base64
import os

def verify_cropper(page):
    # Navigate to app with base path
    page.goto("http://localhost:5173/hb-go/")

    # Bypass onboarding if needed (though local storage might be clear)
    page.evaluate("localStorage.setItem('hb_has_onboarded', 'true')")
    page.reload()

    # Wait for app to load (checking for Home page element)
    # expect(page.get_by_text("No transactions yet")).to_be_visible()

    # Go to editor
    page.goto("http://localhost:5173/hb-go/#/editor/new")

    # Check if we are on the new transaction page
    expect(page.get_by_role("button", name="Save")).to_be_visible()

    # Create a dummy image file.
    # 100x100 JPEG
    jpeg_b64 = "/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAP//////////////////////////////////////////////////////////////////////////////////////wgALCAABAAEBAREA/8QAFBABAAAAAAAAAAAAAAAAAAAAAP/aAAgBAQABPxA="

    if not os.path.exists("verification/test.jpg"):
        with open("verification/test.jpg", "wb") as f:
            f.write(base64.b64decode(jpeg_b64))

    # The file input might be hidden or styled.
    file_input = page.locator('input[type="file"]')

    # Upload the file
    file_input.set_input_files("verification/test.jpg")

    # Now the Cropper should appear.
    # It has text "Crop Receipt"
    expect(page.get_by_text("Crop Receipt")).to_be_visible()

    # Verify Zoom Control exists (it's an input type="range")
    zoom_slider = page.locator('input[type="range"]')
    expect(zoom_slider).to_be_visible()

    # Verify the NEW Zoom Logic
    # 1. Container has p-8 and scrollable
    container = page.locator('.overflow-auto')
    expect(container).to_be_visible()
    expect(container).to_have_class(re.compile(r'touch-pan-y'))
    expect(container).to_have_class(re.compile(r'p-8'))
    expect(container).to_have_class(re.compile(r'overflow-auto'))
    expect(container).to_have_class(re.compile(r'justify-center'))

    # 2. Wrapper (ReactCrop) has width-based style
    # ReactCrop usually adds a div with class ReactCrop
    react_crop = container.locator('.ReactCrop')
    expect(react_crop).to_be_visible()

    # Default scale is 1, so width should be 100%
    expect(react_crop).to_have_attribute("style", re.compile(r"width: 100%"))

    # 3. Simulate Zoom via slider
    # Use JS evaluation to set value, as fill() can be flaky on range inputs
    zoom_slider.evaluate("el => { el.value = '2.0'; el.dispatchEvent(new Event('input', { bubbles: true })); el.dispatchEvent(new Event('change', { bubbles: true })); }")

    # Wait for React to update
    page.wait_for_timeout(500)

    # Verify new width (might be 200% or close depending on float, but 2.0 should be exact)
    expect(react_crop).to_have_attribute("style", re.compile(r"width: 200%"))

    # Take a screenshot of the cropper
    page.screenshot(path="verification/cropper_v2.png")
    print("Verification passed!")

if __name__ == "__main__":
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        try:
            verify_cropper(page)
        except Exception as e:
            print(f"Error: {e}")
            page.screenshot(path="verification/error_v2.png")
            raise e
        finally:
            browser.close()
