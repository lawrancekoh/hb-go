from playwright.sync_api import sync_playwright, expect
import re
import base64

def verify_cropper(page):
    # Navigate to app with base path
    page.goto("http://localhost:5173/hb-go/")

    # Wait for app to load (checking for Home page element)
    expect(page.get_by_text("No transactions yet")).to_be_visible()

    # Go to editor
    page.goto("http://localhost:5173/hb-go/#/editor/new")

    # Check if we are on the new transaction page
    expect(page.get_by_role("button", name="Save")).to_be_visible()

    # Create a dummy image file.
    # Minimal 1x1 JPEG
    jpeg_b64 = "/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAP//////////////////////////////////////////////////////////////////////////////////////wgALCAABAAEBAREA/8QAFBABAAAAAAAAAAAAAAAAAAAAAP/aAAgBAQABPxA="

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

    # Verify the padding/safe margins (p-8 is 2rem = 32px)
    # The container with "bg-neutral-900" should have padding.
    # We select it by class.
    container = page.locator('.bg-neutral-900')
    expect(container).to_have_class(re.compile(r'p-8'))

    # Verify default zoom is 1 (scale 1)
    # The wrapper div should have transform: scale(1)
    # It is the div inside .bg-neutral-900
    wrapper = container.locator('div').first

    # Verify the wrapper has the transform style.
    expect(wrapper).to_have_attribute("style", re.compile(r"transform: scale\(1\)"))

    # Take a screenshot of the cropper
    page.screenshot(path="verification/cropper_verification.png")

if __name__ == "__main__":
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        try:
            verify_cropper(page)
        except Exception as e:
            print(f"Error: {e}")
            page.screenshot(path="verification/error.png")
            raise e
        finally:
            browser.close()
