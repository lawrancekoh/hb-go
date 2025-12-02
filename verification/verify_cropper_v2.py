
import os
import time
from playwright.sync_api import sync_playwright

def verify_cropper(page):
    # Set onboarding as complete
    page.goto("http://localhost:5173/hb-go/")
    page.evaluate("localStorage.setItem('hb_has_onboarded', 'true')")

    # Reload to apply onboarding skip
    page.reload()

    # Go to editor/new directly
    page.goto("http://localhost:5173/hb-go/#/editor/new")

    # Create a dummy image
    if not os.path.exists("verification/test.jpg"):
        import base64
        # 1x1 white pixel jpeg
        img_data = base64.b64decode("/9j/4AAQSkZJRgABAQEAYABgAAD/2wBDAAgGBgcGBQgHBwcJCQgKDBQNDAsLDBkSEw8UHRofHh0aHBwgJC4nICIsIxwcKDcpLDAxNDQ0Hyc5PTgyPC4zNDL/2wBDAQkJCQwLDBgNDRgyIRwhMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjL/wAARCAABAAEDASIAAhEBAxEB/8QAHwAAAQUBAQEBAQEAAAAAAAAAAAECAwQFBgcICQoL/8QAtRAAAgEDAwIEAwUFBAQAAAF9AQIDAAQRBRIhMUEGE1FhByJxFDKBkaEII0KxwRVS0fAkM2JyggkKFhcYGRolJicoKSo0NTY3ODk6Q0RFRkdISUpTVFVWV1hZWmNkZWZnaGlqc3R1dnd4eXqDhIWGh4iJipKTlJWWl5iZmqKjpKWmp6ipqrKztLW2t7i5usLDxMXGx8jJytLT1NXW19jZ2uHi4+Tl5ufo6erx8vP09fb3+Pn6/8QAHwEAAwEBAQEBAQEBAQAAAAAAAAECAwQFBgcICQoL/8QAtREAAgECBAQDBAcFBAQAAQJ3AAECAxEEBSExBhJBUQdhcRMiMoEIFEKRobHBCSMzUvAVYnLRChYkNOEl8RcYGRomJygpKjU2Nzg5OkNERUZHSElKU1RVVldYWVpjZGVmZ2hpanN0dXZ3eHl6goOEhYaHiImKkpOUlZaXmJmaoqOkpaanqKmqsrO0tba3uLm6wsPExcbHyMnK0tPU1dbX2Nna4uPk5ebn6Onq8vP09fb3+Pn6/9oADAMBAAIRAxEAPwD3+iiigD//2Q==")
        with open("verification/test.jpg", "wb") as f:
            f.write(img_data)

    # The file input is hidden but we can find it.
    # In Editor.jsx: input type="file" ...
    page.set_input_files("input[type='file']", "verification/test.jpg")

    # Wait for "Crop Receipt" text which is in ImageCropper
    page.wait_for_selector("text=Crop Receipt", timeout=5000)

    # Locate slider
    slider = page.locator("input[type='range']")

    # Take screenshot at scale 1
    page.screenshot(path="verification/cropper_scale_1.png")

    # Change scale to 3.0
    # For range input, we can set value
    slider.fill("3")
    # Trigger change event if needed, but fill usually does it or we might need dispatchEvent
    # React `onChange` listens to 'input' or 'change'.

    # Wait for transition
    time.sleep(0.5)

    # Take screenshot at scale 3
    page.screenshot(path="verification/cropper_scale_3.png")

    print("Verification screenshots generated.")

with sync_playwright() as p:
    browser = p.chromium.launch()
    page = browser.new_page()
    try:
        verify_cropper(page)
    except Exception as e:
        print(f"Error: {e}")
        page.screenshot(path="verification/error.png")
    finally:
        browser.close()
