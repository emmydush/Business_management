"""
Resize the icon to meet electron-builder requirements (256x256 minimum)
"""

from PIL import Image
import os

def resize_icon():
    try:
        # Open the original icon
        original_icon_path = "frontend/src/assets/images/icon.png"
        resized_icon_path = "frontend/src/assets/images/icon_256.png"
        
        if not os.path.exists(original_icon_path):
            print(f"❌ Original icon not found at {original_icon_path}")
            return False
            
        # Open and resize the image
        with Image.open(original_icon_path) as img:
            # Get original size
            original_size = img.size
            print(f"📏 Original icon size: {original_size[0]}x{original_size[1]}")
            
            # Resize to 256x256 while maintaining aspect ratio
            img_resized = img.resize((256, 256), Image.Resampling.LANCZOS)
            
            # Save the resized image
            img_resized.save(resized_icon_path, "PNG")
            
            print(f"✅ Icon resized and saved to {resized_icon_path}")
            print(f"📏 New icon size: 256x256")
            
            return True
            
    except ImportError:
        print("❌ PIL/Pillow not installed. Please install it with: pip install Pillow")
        return False
    except Exception as e:
        print(f"❌ Error resizing icon: {str(e)}")
        return False

if __name__ == "__main__":
    resize_icon()
