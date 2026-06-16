import os
import json
import sqlite3

DATABASE = os.path.join(os.path.dirname(os.path.abspath(__file__)), "database.db")

PRODUCTS = [
    # ===== TECH & GADGETS =====
    {
        "name": "NEXORA Wireless Earbuds Pro",
        "slug": "wireless-earbuds-pro",
        "category": "tech",
        "category_display": "Tech & Gadgets",
        "price": 29.99,
        "supplier_cost": 18.50,
        "description": "Experience true wireless audio freedom with NEXORA Earbuds Pro. Featuring 42 hours of battery life, Active Noise Cancellation (ANC), ambient awareness mode, IPX5 water resistance, and deep bass dynamic drivers.",
        "features": ["42 Hours Playback with Case", "Active Noise Cancellation (ANC)", "IPX5 Water Resistant", "Bluetooth v5.3 Connectivity", "Smart Touch Controls", "Type-C Fast Charging"],
        "image_url": "/static/images/wireless-earbuds-pro.png",
        "rating": 4.8,
        "stock": 150,
        "delivery_days": 3,
    },
    {
        "name": "Smart Fitness Watch Elite",
        "slug": "smartwatch-elite",
        "category": "tech",
        "category_display": "Tech & Gadgets",
        "price": 49.99,
        "supplier_cost": 30.00,
        "description": "Sleek and premium smartwatch featuring a 1.3\" AMOLED glowing digital display. Track your real-time heart rate, SpO2 blood oxygen, steps, and sleep, with 120+ sport modes and standard Bluetooth calling.",
        "features": ["1.3\" AMOLED Display", "Bluetooth calling and notifications", "Heart rate & SpO2 monitoring", "120+ customized sports modes", "7-Day active battery life", "IP68 dust & water proof"],
        "image_url": "/static/images/smartwatch-elite.png",
        "rating": 4.7,
        "stock": 95,
        "delivery_days": 3,
    },
    {
        "name": "RGB LED Strip Lights (5m)",
        "slug": "led-strip-rgb",
        "category": "tech",
        "category_display": "Tech & Gadgets",
        "price": 19.99,
        "supplier_cost": 11.00,
        "description": "Transform your room with vibrant RGB LED strip lights. Perfect for home entertainment systems, bedrooms, and gaming rigs, with smart app and remote controls.",
        "features": ["5 Meters length", "Millions of colors (RGB)", "Smart app & remote control", "Music sync mode", "Easy adhesive installation", "Cuttable design"],
        "image_url": "/static/images/led-strip-rgb.png",
        "rating": 4.5,
        "stock": 210,
        "delivery_days": 2,
    },
    {
        "name": "Smart RGB LED Light Bulb",
        "slug": "smart-bulb-rgb",
        "category": "tech",
        "category_display": "Tech & Gadgets",
        "price": 14.99,
        "supplier_cost": 9.00,
        "description": "Vivid smart light bulb with standard B22 base, Alexa and Google Assistant integration, 16 million colors, and smart scheduling via app control.",
        "features": ["16 Million colors", "Alexa & Google Assistant support", "App-controlled scheduling", "No hub required", "B22 base connection", "Energy-saving LED"],
        "image_url": "/static/images/smart-bulb-rgb.png",
        "rating": 4.4,
        "stock": 350,
        "delivery_days": 2,
    },
    {
        "name": "Portronics SoundDrum Bluetooth Speaker",
        "slug": "portronics-sounddrum",
        "category": "tech",
        "category_display": "Tech & Gadgets",
        "price": 24.99,
        "supplier_cost": 15.00,
        "description": "Compact and powerful cylindrical Bluetooth speaker delivering 14W output with deep bass, TWS pairing, and IPX6 splash-proof body.",
        "features": ["14W Stereo output", "IPX6 Splash proof", "TWS pairing mode", "7 Hours battery playback", "Built-in mic for calling", "Type-C charging"],
        "image_url": "/static/images/wireless-earbuds-pro.png",  # Fallback to earbuds if needed or keep it simple
        "rating": 4.3,
        "stock": 120,
        "delivery_days": 4,
    },

    # ===== FASHION & ACCESSORIES =====
    {
        "name": "Luxury Aviator Sunglasses UV400",
        "slug": "aviator-sunglasses",
        "category": "fashion",
        "category_display": "Fashion & Accessories",
        "price": 24.99,
        "supplier_cost": 14.00,
        "description": "Timeless aviator sunglasses featuring premium gold-framed metal alloy and dark gradient polarised lenses. Offers 100% UV400 protection.",
        "features": ["100% UV400 Protection", "Polarised high-clarity lenses", "Gold-framed metal alloy", "Adjustable nose pads", "Comes with premium hard case", "Classic unisex design"],
        "image_url": "/static/images/aviator-sunglasses.png",
        "rating": 4.8,
        "stock": 180,
        "delivery_days": 3,
    },
    {
        "name": "Sleek Crossbody Leather Sling Bag",
        "slug": "crossbody-bag",
        "category": "fashion",
        "category_display": "Fashion & Accessories",
        "price": 34.99,
        "supplier_cost": 21.00,
        "description": "Trendy sling bag styled in matte black premium leather with durable silver-finished metal hardware, adjustable straps, and multiple secure pockets.",
        "features": ["Premium matte leather", "Water-resistant interior lining", "Adjustable shoulder strap", "3 zippered pockets", "Anti-theft back sleeve", "Unisex travel styling"],
        "image_url": "/static/images/crossbody-bag.png",
        "rating": 4.6,
        "stock": 120,
        "delivery_days": 3,
    },
    {
        "name": "Genuine Leather Bi-Fold Wallet",
        "slug": "leather-wallet",
        "category": "fashion",
        "category_display": "Fashion & Accessories",
        "price": 19.99,
        "supplier_cost": 11.50,
        "description": "Premium genuine leather bi-fold wallet with RFID blocking technology, 6 card slots, 2 currency compartments, and a coin pocket.",
        "features": ["Genuine Top-Grain Leather", "RFID Blocking Technology", "6 Card slots & 2 compartments", "Built-in coin zipper slot", "Sleek slimfold profile", "Comes in custom gift box"],
        "image_url": "/static/images/crossbody-bag.png",  # Reuse
        "rating": 4.5,
        "stock": 250,
        "delivery_days": 3,
    },
    {
        "name": "Lavie Strato 34L Backpack",
        "slug": "backpack-strato",
        "category": "fashion",
        "category_display": "Fashion & Accessories",
        "price": 39.99,
        "supplier_cost": 24.00,
        "description": "Spacious 34L laptop backpack with padded compartment fits up to 15.6\" devices. Made from water-resistant fabric with ergonomic shoulder straps.",
        "features": ["34 Litre storage volume", "Fits 15.6\" Laptop", "Water-resistant exterior", "Padded back and straps", "Organized multi-compartments", "Durable YKK zippers"],
        "image_url": "/static/images/crossbody-bag.png",  # Reuse
        "rating": 4.4,
        "stock": 140,
        "delivery_days": 4,
    },
    {
        "name": "Joker & Witch Minimalist Couple Watches",
        "slug": "couple-watch",
        "category": "fashion",
        "category_display": "Fashion & Accessories",
        "price": 59.99,
        "supplier_cost": 35.00,
        "description": "Elegant matching watches for couples. Styled in stainless steel mesh bands with precise Japanese quartz movement and scratch-resistant mineral glass.",
        "features": ["His & Hers matching set", "Stainless steel mesh bands", "Japanese Quartz Movement", "Scratch-resistant glass", "30m water-resistant", "Premium presentation box"],
        "image_url": "/static/images/aviator-sunglasses.png",  # Reuse
        "rating": 4.6,
        "stock": 80,
        "delivery_days": 4,
    },

    # ===== HOME & KITCHEN =====
    {
        "name": "Pigeon Induction Cooktop 1800W",
        "slug": "induction-cooktop",
        "category": "home",
        "category_display": "Home & Kitchen",
        "price": 44.99,
        "supplier_cost": 27.00,
        "description": "1800W crystal glass induction cooktop featuring digital display controls, 7 preset Indian cooking modes, automatic shut-off, and wide voltage protection.",
        "features": ["1800W High power output", "Premium crystal glass plate", "7 preset cooking modes", "Auto shutdown safety protection", "LED touch control panel", "Easy clean surface"],
        "image_url": "/static/images/smart-bulb-rgb.png",  # Reuse
        "rating": 4.3,
        "stock": 70,
        "delivery_days": 5,
    },
    {
        "name": "Milton vacuum Thermosteel Flask 1L",
        "slug": "thermosteel-flask",
        "category": "home",
        "category_display": "Home & Kitchen",
        "price": 24.99,
        "supplier_cost": 15.50,
        "description": "Double-walled vacuum insulated flask keeping beverages hot or cold for up to 24 hours. Features leak-proof flip lid and food-grade stainless steel body.",
        "features": ["1.0 Litre capacity", "24hr Hot/Cold insulation", "304 Food-grade stainless steel", "Leak-proof flip stopper", "BPA-free health grade", "Rust proof outer coating"],
        "image_url": "/static/images/smart-bulb-rgb.png",  # Reuse
        "rating": 4.6,
        "stock": 300,
        "delivery_days": 3,
    },
    {
        "name": "Prestige Svachh Pressure Cooker 5L",
        "slug": "pressure-cooker-5l",
        "category": "home",
        "category_display": "Home & Kitchen",
        "price": 49.99,
        "supplier_cost": 30.00,
        "description": "First spillage-control pressure cooker with deep lid for cleaner cooking. 5L aluminium body compatible with both induction and gas cooktops.",
        "features": ["5.0 Litre capacity", "Deep lid spillage control", "Induction & gas compatible", "Made of high grade aluminium", "ISI certified safety standards", "Gasket release system"],
        "image_url": "/static/images/smart-bulb-rgb.png",  # Reuse
        "rating": 4.7,
        "stock": 65,
        "delivery_days": 5,
    },
    {
        "name": "Cello Opalware Dazzle Dinner Set (18 Pcs)",
        "slug": "opalware-dinner-set",
        "category": "home",
        "category_display": "Home & Kitchen",
        "price": 39.99,
        "supplier_cost": 24.50,
        "description": "Elegant 18-piece dinner set made from premium opalware. Microwave and dishwasher safe, highly chip-resistant, and completely bone-ash free.",
        "features": ["18-Piece comprehensive set", "Premium opalware material", "Microwave & dishwasher safe", "Highly chip-resistant", "100% Bone-ash free", "Fade-proof floral designs"],
        "image_url": "/static/images/smart-bulb-rgb.png",  # Reuse
        "rating": 4.5,
        "stock": 90,
        "delivery_days": 4,
    },
    {
        "name": "LED Ceiling Smart Light Panel",
        "slug": "smart-light-panel",
        "category": "home",
        "category_display": "Home & Kitchen",
        "price": 29.99,
        "supplier_cost": 18.00,
        "description": "Flush mount LED smart ceiling panel with adjustable white temperature and full RGB backlight. Controls via app or voice commands.",
        "features": ["Adjustable white & RGB", "Flush mount profile", "App & voice controlled", "Alexa & Google support", "25,000 Hours life rating", "Energy efficient 24W output"],
        "image_url": "/static/images/smart-bulb-rgb.png",
        "rating": 4.4,
        "stock": 140,
        "delivery_days": 3,
    },

    # ===== HEALTH & FITNESS =====
    {
        "name": "NEXORA Premium Yoga Mat (6mm)",
        "slug": "yoga-mat-premium",
        "category": "health",
        "category_display": "Health & Fitness",
        "price": 24.99,
        "supplier_cost": 15.00,
        "description": "Extra thick 6mm anti-skid yoga mat made from skin-friendly eco-EVA material. Features laser alignment lines and includes a convenient carrying strap.",
        "features": ["6mm comfort thickness", "Anti-skid texture pattern", "Eco-EVA skin-friendly material", "Laser alignment guides", "Includes carrying strap", "72\" x 24\" large size"],
        "image_url": "/static/images/yoga-mat-premium.png",
        "rating": 4.8,
        "stock": 190,
        "delivery_days": 3,
    },
    {
        "name": "Adjustable Dumbbells Set 10kg",
        "slug": "dumbbells-10kg",
        "category": "health",
        "category_display": "Health & Fitness",
        "price": 49.99,
        "supplier_cost": 31.00,
        "description": "Premium home workout dumbbell set (total 10kg). Threaded bars allow quick weight configuration swaps with secure star collars.",
        "features": ["10kg Adjustable total", "PVC coated weight plates", "Threaded steel handles", "Star lock security collars", "Comfort non-slip grip", "Perfect for home strength training"],
        "image_url": "/static/images/yoga-mat-premium.png",  # Reuse
        "rating": 4.4,
        "stock": 110,
        "delivery_days": 4,
    },
    {
        "name": "Digital Upper Arm BP Monitor",
        "slug": "bp-monitor-digital",
        "category": "health",
        "category_display": "Health & Fitness",
        "price": 39.99,
        "supplier_cost": 23.00,
        "description": "Fully automatic upper arm blood pressure monitor. Offers clinical-grade accuracy with a large backlight LCD display and dual user memory records.",
        "features": ["Fully automatic operation", "Large backlight LCD screen", "120-reading Dual memory records", "Heart rate tracking & irregular beat warning", "WHO classification metric indicator", "Powered by USB or AA batteries"],
        "image_url": "/static/images/yoga-mat-premium.png",  # Reuse
        "rating": 4.6,
        "stock": 130,
        "delivery_days": 3,
    },
    {
        "name": "Resistance Loop Bands Set (5 levels)",
        "slug": "resistance-bands",
        "category": "health",
        "category_display": "Health & Fitness",
        "price": 12.99,
        "supplier_cost": 7.00,
        "description": "Set of 5 natural latex loop resistance bands ranging from X-Light to X-Heavy. Perfect for stretching, physiotherapy, and mobility work.",
        "features": ["5 distinct resistance levels", "100% natural eco-latex", "Includes travel carry pouch", "Exercise guide book included", "Gentle on skin surfaces", "Suitable for all athletes"],
        "image_url": "/static/images/yoga-mat-premium.png",  # Reuse
        "rating": 4.5,
        "stock": 400,
        "delivery_days": 2,
    },
    {
        "name": "MuscleBlaze Whey Protein 1kg",
        "slug": "whey-protein-1kg",
        "category": "health",
        "category_display": "Health & Fitness",
        "price": 59.99,
        "supplier_cost": 37.00,
        "description": "High-purity whey protein concentrate containing 24g protein per serving, 5.29g BCAAs, and custom digestive DigeZyme enzymes.",
        "features": ["24g Protein per serving", "5.29g BCAAs included", "DigeZyme digestive enzyme complex", "Zero added sugar", "Labdoor certified purity", "Chocolate fudge flavor"],
        "image_url": "/static/images/yoga-mat-premium.png",  # Reuse
        "rating": 4.7,
        "stock": 160,
        "delivery_days": 4,
    },

    # ===== BEAUTY & SKINCARE =====
    {
        "name": "Niacinamide Glowing Face Serum",
        "slug": "face-serum-gold",
        "category": "beauty",
        "category_display": "Beauty & Skincare",
        "price": 19.99,
        "supplier_cost": 11.00,
        "description": "Clinical grade 10% Niacinamide + 1% Zinc face serum. Effectively reduces blemishes, controls excess sebum, and brightens overall skin tone.",
        "features": ["10% Niacinamide + 1% Zinc", "Fades dark spots and blemishes", "Reduces pore visibility & oil", "Fragrance-free clean formula", "Dermatologically tested", "Cruelty-free & vegan"],
        "image_url": "/static/images/face-serum-gold.png",
        "rating": 4.9,
        "stock": 200,
        "delivery_days": 3,
    },
    {
        "name": "Vitamin C Brightening Face Wash",
        "slug": "face-wash-vitc",
        "category": "beauty",
        "category_display": "Beauty & Skincare",
        "price": 14.99,
        "supplier_cost": 8.50,
        "description": "Daily brightening face wash infused with natural Vitamin C, Turmeric, and Aloe Vera. Cleanses pores and restores skin glow without drying.",
        "features": ["Vitamin C & Turmeric blend", "150ml flip-cap tube", "Paraben & Sulphate free", "Deep pore clearing action", "Restores natural skin moisture", "Suitable for all skin profiles"],
        "image_url": "/static/images/face-serum-gold.png",  # Reuse
        "rating": 4.5,
        "stock": 310,
        "delivery_days": 2,
    },
    {
        "name": "Plum Green Tea Clear Face Serum",
        "slug": "green-tea-serum",
        "category": "beauty",
        "category_display": "Beauty & Skincare",
        "price": 18.99,
        "supplier_cost": 11.00,
        "description": "Lightweight, non-comedogenic serum formulated with organic green tea extracts, AHA, and Niacinamide. Clears breakouts and smooths skin texture.",
        "features": ["Organic green tea extracts", "AHA & Niacinamide blend", "Non-comedogenic (won't clog pores)", "100% Vegan & cruelty-free", "30ml glass dropper packaging", "Designed for acne-prone skin"],
        "image_url": "/static/images/face-serum-gold.png",  # Reuse
        "rating": 4.4,
        "stock": 170,
        "delivery_days": 3,
    },
    {
        "name": "mCaffeine Coffee Exfoliating Scrub",
        "slug": "coffee-body-scrub",
        "category": "beauty",
        "category_display": "Beauty & Skincare",
        "price": 16.99,
        "supplier_cost": 9.50,
        "description": "Exfoliating body scrub packed with raw Arabica coffee, coconut oil, and Vitamin E. Polish away dead skin, remove tan, and hydrate dry areas.",
        "features": ["Pure Arabica Coffee grounds", "200g wide-mouth tub", "Enriched with Coconut Oil & Vit E", "Polishes away dead skin layers", "Zero SLS & Paraben additives", "FDA approved formula"],
        "image_url": "/static/images/face-serum-gold.png",  # Reuse
        "rating": 4.6,
        "stock": 220,
        "delivery_days": 3,
    },
    {
        "name": "Biotique Morning Nectar Sunscreen SPF30",
        "slug": "morning-nectar-sunscreen",
        "category": "beauty",
        "category_display": "Beauty & Skincare",
        "price": 12.99,
        "supplier_cost": 7.50,
        "description": "Lightweight moisturizing daily sunscreen lotion offering broad-spectrum SPF 30 UVA/UVB protection with pure morning nectar extracts.",
        "features": ["Broad spectrum SPF 30 protection", "120ml squeeze bottle", "Infused with morning nectar extracts", "Non-greasy rapid absorption", "Deep skin hydration", "All skin profiles friendly"],
        "image_url": "/static/images/face-serum-gold.png",  # Reuse
        "rating": 4.3,
        "stock": 280,
        "delivery_days": 2,
    },
]

def seed():
    conn = sqlite3.connect(DATABASE)
    c = conn.cursor()

    # Drop and recreate products table to clean any old structures
    c.execute("DROP TABLE IF EXISTS products")
    c.execute("""
        CREATE TABLE products (
            id          INTEGER PRIMARY KEY AUTOINCREMENT,
            name        TEXT NOT NULL,
            slug        TEXT NOT NULL UNIQUE,
            category    TEXT NOT NULL,
            category_display TEXT NOT NULL,
            price       REAL NOT NULL,
            supplier_cost REAL NOT NULL,
            description TEXT NOT NULL,
            features    TEXT NOT NULL DEFAULT '[]',
            image_url   TEXT NOT NULL,
            rating      REAL NOT NULL DEFAULT 4.0,
            stock       INTEGER NOT NULL DEFAULT 100,
            delivery_days INTEGER NOT NULL DEFAULT 3,
            created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
    """)

    for p in PRODUCTS:
        c.execute("""
            INSERT INTO products (name, slug, category, category_display, price, supplier_cost, description, features, image_url, rating, stock, delivery_days)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            p["name"], p["slug"], p["category"], p["category_display"],
            p["price"], p["supplier_cost"], p["description"], json.dumps(p["features"]),
            p["image_url"], p["rating"], p["stock"], p["delivery_days"]
        ))
    
    conn.commit()
    print(f"Seeded {len(PRODUCTS)} USD products successfully into {DATABASE}")
    conn.close()

if __name__ == "__main__":
    seed()
