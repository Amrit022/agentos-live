import re

css_path = r"C:\Users\amrit\.gemini\antigravity\scratch\earn-online-hub\static\css\nexora.css"

with open(css_path, "r", encoding="utf-8") as f:
    content = f.read()

# 1. Swaps for colors (Cyber-blue and violet to Champagne-gold and soft-copper)
content = content.replace("#00f0ff", "#c5a880")
content = content.replace("rgba(0, 240, 255,", "rgba(197, 168, 128,")
content = content.replace("rgba(0,240,255,", "rgba(197, 168, 128,")

content = content.replace("#a855f7", "#b58a6f")
content = content.replace("rgba(168, 85, 247,", "rgba(181, 138, 111,")
content = content.replace("rgba(168,85,247,", "rgba(181, 138, 111,")

# 2. Deep backgrounds (cyan/violet galaxy mesh to obsidian/copper neutrals)
content = content.replace("#0a0a1a", "#0d0e10")
content = content.replace("#0f1129", "#151619")
content = content.replace("rgba(10, 10, 26,", "rgba(13, 14, 16,")
content = content.replace("rgba(15, 17, 41,", "rgba(22, 23, 26,")

# 3. Add alias for .product-grid (singular) alongside .products-grid (plural)
content = content.replace(".products-grid {", ".product-grid, .products-grid {")

# 4. Make card columns smaller (from minmax 270px to minmax 210px)
content = content.replace("minmax(270px, 1fr)", "minmax(210px, 1fr)")

# 5. Fix card hover effect box-shadows to be soft gold
content = content.replace("box-shadow: 0 16px 48px rgba(0,0,0,0.3), 0 0 30px rgba(0, 240, 255, 0.06);", 
                          "box-shadow: 0 10px 30px rgba(0,0,0,0.4), 0 0 20px rgba(197, 168, 128, 0.04);")

with open(css_path, "w", encoding="utf-8") as f:
    f.write(content)

print("Replacement successful.")
