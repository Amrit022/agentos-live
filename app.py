import os
import json
import uuid
import string
import random
import sqlite3
from datetime import datetime
from functools import wraps
from flask import (
    Flask, request, jsonify, render_template,
    session, redirect, url_for, g, send_file
)
from werkzeug.security import generate_password_hash, check_password_hash

app = Flask(__name__)
app.secret_key = os.environ.get('SECRET_KEY', 'nexora-secret-key-change-in-production')

DATABASE = os.path.join(os.path.dirname(os.path.abspath(__file__)), "database.db")
ADMIN_PASSWORD = os.environ.get('ADMIN_PASSWORD', 'password123')

# PayPal Configuration (Sandbox keys — USD payments)
PAYPAL_CLIENT_ID = os.environ.get('PAYPAL_CLIENT_ID', 'Af9wZg_O8vJIARumOvVa-VE8ER2vpKOJ4YDVhFp4GGD0PNCg3QvATL_qNHvHRA33JojiLqcoOvffv5Ht')

# ---------------------------------------------------------------------------
# Database helpers
# ---------------------------------------------------------------------------

def get_db():
    if "db" not in g:
        g.db = sqlite3.connect(DATABASE)
        g.db.row_factory = sqlite3.Row
        g.db.execute("PRAGMA journal_mode=WAL")
        g.db.execute("PRAGMA foreign_keys=ON")
    return g.db


@app.teardown_appcontext
def close_db(exception):
    db = g.pop("db", None)
    if db is not None:
        db.close()


def init_db():
    db = sqlite3.connect(DATABASE)
    db.execute("PRAGMA foreign_keys=ON")
    db.executescript("""
        CREATE TABLE IF NOT EXISTS products (
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

        CREATE TABLE IF NOT EXISTS cart_items (
            id          INTEGER PRIMARY KEY AUTOINCREMENT,
            cart_id     TEXT NOT NULL,
            product_id  INTEGER NOT NULL,
            quantity    INTEGER NOT NULL DEFAULT 1,
            added_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (product_id) REFERENCES products(id)
        );

        CREATE TABLE IF NOT EXISTS orders (
            id          INTEGER PRIMARY KEY AUTOINCREMENT,
            order_id    TEXT NOT NULL UNIQUE,
            cart_id     TEXT NOT NULL,
            customer_name  TEXT NOT NULL,
            customer_email TEXT NOT NULL,
            customer_phone TEXT NOT NULL,
            address     TEXT NOT NULL,
            city        TEXT NOT NULL,
            state       TEXT NOT NULL,
            pincode     TEXT NOT NULL,
            total       REAL NOT NULL,
            supplier_cost REAL NOT NULL DEFAULT 0.0,
            profit      REAL NOT NULL DEFAULT 0.0,
            status      TEXT NOT NULL DEFAULT 'pending',
            supplier_status TEXT NOT NULL DEFAULT 'pending',
            tracking_number TEXT DEFAULT NULL,
            created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS order_items (
            id          INTEGER PRIMARY KEY AUTOINCREMENT,
            order_id    TEXT NOT NULL,
            product_id  INTEGER NOT NULL,
            product_name TEXT NOT NULL,
            price       REAL NOT NULL,
            quantity    INTEGER NOT NULL,
            FOREIGN KEY (order_id) REFERENCES orders(order_id),
            FOREIGN KEY (product_id) REFERENCES products(id)
        );

        CREATE TABLE IF NOT EXISTS messages (
            id          INTEGER PRIMARY KEY AUTOINCREMENT,
            name        TEXT NOT NULL,
            email       TEXT NOT NULL,
            message     TEXT NOT NULL,
            timestamp   TEXT NOT NULL
        );

        CREATE TABLE IF NOT EXISTS subscribers (
            id          INTEGER PRIMARY KEY AUTOINCREMENT,
            email       TEXT NOT NULL UNIQUE,
            timestamp   TEXT NOT NULL
        );

        CREATE TABLE IF NOT EXISTS users (
            id          INTEGER PRIMARY KEY AUTOINCREMENT,
            email       TEXT NOT NULL UNIQUE,
            password_hash TEXT NOT NULL,
            name        TEXT NOT NULL,
            created_at  TEXT NOT NULL
        );
    """)
    db.commit()
    db.close()

init_db()

# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def get_cart_id():
    if "cart_id" not in session:
        session["cart_id"] = str(uuid.uuid4())
    return session["cart_id"]


def generate_order_id():
    chars = string.ascii_uppercase + string.digits
    code = "".join(random.choices(chars, k=6))
    return f"NXR-{code}"


def row_to_dict(row):
    return dict(row) if row else None


def rows_to_list(rows):
    return [dict(r) for r in rows]

# Category Meta
CATEGORIES = {
    "tech":    {"name": "Tech & Gadgets",        "slug": "tech"},
    "fashion": {"name": "Fashion & Accessories", "slug": "fashion"},
    "home":    {"name": "Home & Kitchen",        "slug": "home"},
    "health":  {"name": "Health & Fitness",       "slug": "health"},
    "beauty":  {"name": "Beauty & Skincare",      "slug": "beauty"},
    "sports":  {"name": "Sports & Outdoors",     "slug": "sports"},
    "pets":    {"name": "Pet Supplies",          "slug": "pets"},
}

# ===================================================================
#  PAGE ROUTES
# ===================================================================

@app.route("/")
def index():
    db = get_db()
    products = rows_to_list(
        db.execute("SELECT * FROM products ORDER BY rating DESC").fetchall()
    )
    for p in products:
        p["features"] = json.loads(p["features"])
    return render_template("index.html", products=products, categories=CATEGORIES)


@app.route("/category/<slug>")
def category_page(slug):
    if slug not in CATEGORIES:
        return render_template("404.html", message="Category not found"), 404
    db = get_db()
    products = rows_to_list(
        db.execute("SELECT * FROM products WHERE category = ? ORDER BY rating DESC", (slug,)).fetchall()
    )
    for p in products:
        p["features"] = json.loads(p["features"])
    return render_template(
        "category.html",
        products=products,
        category_name=CATEGORIES[slug]["name"],
        category_slug=slug,
        categories=CATEGORIES
    )


@app.route("/product/<int:id>")
def product_page(id):
    db = get_db()
    row = db.execute("SELECT * FROM products WHERE id = ?", (id,)).fetchone()
    if not row:
        return render_template("404.html", message="Product not found"), 404
    product = row_to_dict(row)
    product["features"] = json.loads(product["features"])
    
    related = rows_to_list(
        db.execute(
            "SELECT * FROM products WHERE category = ? AND id != ? ORDER BY rating DESC LIMIT 4",
            (product["category"], id)
        ).fetchall()
    )
    for r in related:
        r["features"] = json.loads(r["features"])
        
    return render_template(
        "product.html",
        product=product,
        related_products=related,
        categories=CATEGORIES
    )


@app.route("/cart")
def cart_page():
    cart_id = get_cart_id()
    db = get_db()
    items = rows_to_list(
        db.execute("""
            SELECT ci.id, ci.quantity, p.id as product_id, p.name, p.slug,
                   p.price, p.image_url, p.stock, p.delivery_days
            FROM cart_items ci
            JOIN products p ON ci.product_id = p.id
            WHERE ci.cart_id = ?
        """, (cart_id,)).fetchall()
    )
    subtotal = sum(item["price"] * item["quantity"] for item in items)
    shipping = 0.0 if (subtotal >= 50.0 or subtotal == 0) else 5.99
    total = subtotal + shipping
    return render_template("cart.html", items=items, subtotal=subtotal, shipping=shipping, total=total, categories=CATEGORIES)


@app.route("/checkout")
def checkout_page():
    cart_id = get_cart_id()
    db = get_db()
    items = rows_to_list(
        db.execute("""
            SELECT ci.id, ci.quantity, p.id as product_id, p.name, p.slug,
                   p.price, p.image_url
            FROM cart_items ci
            JOIN products p ON ci.product_id = p.id
            WHERE ci.cart_id = ?
        """, (cart_id,)).fetchall()
    )
    if not items:
        return redirect(url_for("cart_page"))
    subtotal = sum(item["price"] * item["quantity"] for item in items)
    shipping = 0.0 if subtotal >= 50.0 else 5.99
    total = subtotal + shipping
    return render_template(
        "checkout.html",
        items=items,
        subtotal=subtotal,
        shipping=shipping,
        total=total,
        paypal_client_id=PAYPAL_CLIENT_ID,
        categories=CATEGORIES
    )


@app.route("/tracking")
def tracking_page():
    order_id = request.args.get("order_id", "").strip()
    order = None
    order_items = []
    if order_id:
        db = get_db()
        row = db.execute("SELECT * FROM orders WHERE order_id = ?", (order_id,)).fetchone()
        if row:
            order = row_to_dict(row)
            order_items = rows_to_list(
                db.execute("""
                    SELECT oi.*, p.image_url 
                    FROM order_items oi
                    JOIN products p ON oi.product_id = p.id
                    WHERE oi.order_id = ?
                """, (order_id,)).fetchall()
            )
    return render_template(
        "tracking.html",
        order=order,
        order_items=order_items,
        search_id=order_id,
        categories=CATEGORIES
    )


@app.route("/about")
def about_page():
    return render_template("about.html", categories=CATEGORIES)


@app.route("/login", methods=["GET", "POST"])
def login():
    error = None
    if request.method == "POST":
        if request.form.get("password") == ADMIN_PASSWORD:
            session["logged_in"] = True
            return redirect(url_for("admin"))
        else:
            error = "Invalid credentials. Please try again."
    return render_template("login.html", error=error)


@app.route("/logout")
def logout():
    session.pop("logged_in", None)
    return redirect(url_for("index"))


@app.route("/admin")
def admin():
    if not session.get("logged_in"):
        return redirect(url_for("login"))
    return render_template("admin.html")

# ===================================================================
#  API ROUTES
# ===================================================================

# ---- Products -----------------------------------------------------

@app.route("/api/products")
def api_products():
    db = get_db()
    products = rows_to_list(db.execute("SELECT * FROM products ORDER BY id").fetchall())
    for p in products:
        p["features"] = json.loads(p["features"])
    return jsonify(products)


@app.route("/api/products/<category>")
def api_products_by_category(category):
    if category not in CATEGORIES:
        return jsonify({"error": "Invalid category"}), 404
    db = get_db()
    products = rows_to_list(db.execute("SELECT * FROM products WHERE category = ? ORDER BY id", (category,)).fetchall())
    for p in products:
        p["features"] = json.loads(p["features"])
    return jsonify(products)


@app.route("/api/product/<int:id>")
def api_product(id):
    db = get_db()
    row = db.execute("SELECT * FROM products WHERE id = ?", (id,)).fetchone()
    if not row:
        return jsonify({"error": "Product not found"}), 404
    product = row_to_dict(row)
    product["features"] = json.loads(product["features"])
    return jsonify(product)

# ---- Cart ----------------------------------------------------------

@app.route("/api/cart")
def api_cart():
    cart_id = get_cart_id()
    db = get_db()
    items = rows_to_list(
        db.execute("""
            SELECT ci.id, ci.cart_id, ci.quantity, ci.added_at,
                   p.id as product_id, p.name, p.slug, p.category,
                   p.price, p.image_url, p.stock, p.delivery_days
            FROM cart_items ci
            JOIN products p ON ci.product_id = p.id
            WHERE ci.cart_id = ?
        """, (cart_id,)).fetchall()
    )
    subtotal = sum(item["price"] * item["quantity"] for item in items)
    shipping = 0.0 if (subtotal >= 50.0 or subtotal == 0) else 5.99
    total = subtotal + shipping
    return jsonify({
        "cart_id": cart_id,
        "items": items,
        "subtotal": subtotal,
        "shipping": shipping,
        "total": total,
        "count": sum(item["quantity"] for item in items)
    })


@app.route("/api/cart/add", methods=["POST"])
def api_cart_add():
    cart_id = get_cart_id()
    data = request.get_json(silent=True) or {}
    product_id = data.get("product_id")
    quantity = data.get("quantity", 1)

    if not product_id:
        return jsonify({"error": "product_id is required"}), 400

    db = get_db()
    product = db.execute("SELECT * FROM products WHERE id = ?", (product_id,)).fetchone()
    if not product:
        return jsonify({"error": "Product not found"}), 404

    existing = db.execute(
        "SELECT * FROM cart_items WHERE cart_id = ? AND product_id = ?",
        (cart_id, product_id)
    ).fetchone()

    if existing:
        new_qty = existing["quantity"] + quantity
        db.execute("UPDATE cart_items SET quantity = ? WHERE id = ?", (new_qty, existing["id"]))
    else:
        db.execute("INSERT INTO cart_items (cart_id, product_id, quantity) VALUES (?, ?, ?)", (cart_id, product_id, quantity))

    db.commit()
    return jsonify({"success": True, "message": "Added to cart"})


@app.route("/api/cart/update", methods=["POST"])
def api_cart_update():
    cart_id = get_cart_id()
    data = request.get_json(silent=True) or {}
    item_id = data.get("item_id")
    quantity = data.get("quantity")

    if not item_id or quantity is None:
        return jsonify({"error": "item_id and quantity are required"}), 400

    db = get_db()
    if quantity <= 0:
        db.execute("DELETE FROM cart_items WHERE id = ? AND cart_id = ?", (item_id, cart_id))
    else:
        db.execute("UPDATE cart_items SET quantity = ? WHERE id = ? AND cart_id = ?", (quantity, item_id, cart_id))

    db.commit()
    return jsonify({"success": True, "message": "Cart updated"})


@app.route("/api/cart/remove/<int:id>", methods=["DELETE"])
def api_cart_remove(id):
    cart_id = get_cart_id()
    db = get_db()
    db.execute("DELETE FROM cart_items WHERE id = ? AND cart_id = ?", (id, cart_id))
    db.commit()
    return jsonify({"success": True, "message": "Item removed from cart"})

# ---- Global PayPal Checkout & Order Flow ----------------------------

@app.route('/api/create-checkout-session', methods=['POST'])
def create_checkout_session():
    data = request.json or {}
    name = data.get('name')
    email = data.get('email')
    phone = data.get('phone')
    address = data.get('address')
    address2 = data.get('address2', '')
    city = data.get('city')
    state = data.get('state')
    pincode = data.get('pincode')
    
    if not all([name, email, phone, address, city, state, pincode]):
        return jsonify({"error": "Missing required shipping information."}), 400
        
    cart_id = get_cart_id()
    db = get_db()
    
    # Grab cart details
    items = rows_to_list(
        db.execute("""
            SELECT ci.quantity, p.id as product_id, p.name, p.price, p.supplier_cost
            FROM cart_items ci
            JOIN products p ON ci.product_id = p.id
            WHERE ci.cart_id = ?
        """, (cart_id,)).fetchall()
    )
    
    if not items:
        return jsonify({"error": "Cart is empty."}), 400
        
    subtotal = sum(item["price"] * item["quantity"] for item in items)
    shipping = 0.0 if subtotal >= 50.0 else 5.99
    total = subtotal + shipping
    
    supplier_cost = sum(item["supplier_cost"] * item["quantity"] for item in items)
    profit = total - supplier_cost

    order_id = generate_order_id()
    while db.execute("SELECT 1 FROM orders WHERE order_id = ?", (order_id,)).fetchone():
        order_id = generate_order_id()
        
    full_address = address + (f", {address2}" if address2 else "")

    # Create Order
    db.execute("""
        INSERT INTO orders (order_id, cart_id, customer_name, customer_email, customer_phone, 
                            address, city, state, pincode, total, supplier_cost, profit, status, supplier_status) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', 'pending')
    """, (
        order_id, cart_id, name, email, phone, 
        full_address, city, state, pincode, total, supplier_cost, profit
    ))
    
    # Insert Order Items
    for item in items:
        db.execute("""
            INSERT INTO order_items (order_id, product_id, product_name, price, quantity)
            VALUES (?, ?, ?, ?, ?)
        """, (order_id, item["product_id"], item["name"], item["price"], item["quantity"]))
        
    db.commit()
    
    return jsonify({
        'internal_order_id': order_id,
        'paypal_client_id': PAYPAL_CLIENT_ID,
        'total': f"{float(total):.2f}",
        'currency': 'USD'
    }), 200


@app.route('/api/verify-payment', methods=['POST'])
def verify_payment():
    data = request.json or {}
    paypal_order_id = data.get('paypal_order_id')
    internal_order_id = data.get('internal_order_id')
    
    db = get_db()
    order_row = db.execute("SELECT * FROM orders WHERE order_id = ?", (internal_order_id,)).fetchone()
    
    if order_row and order_row['status'] == 'pending':
        db.execute("UPDATE orders SET status = 'paid' WHERE order_id = ?", (internal_order_id,))
        
        # Clear Cart
        db.execute("DELETE FROM cart_items WHERE cart_id = ?", (order_row['cart_id'],))
        db.commit()
        
        # Reset cart session cookie
        session["cart_id"] = str(uuid.uuid4())
        
    return jsonify({'success': True, 'redirect': f'/tracking?order_id={internal_order_id}'}), 200


@app.route("/api/order")
def api_order_tracking_form():
    order_id = request.args.get("order_id", "").strip()
    return redirect(url_for("tracking_page", order_id=order_id))


@app.route("/api/order/<order_id>")
def api_get_order(order_id):
    db = get_db()
    order_row = db.execute("SELECT * FROM orders WHERE order_id = ?", (order_id,)).fetchone()
    if not order_row:
        return jsonify({"error": "Order not found"}), 404
    order = row_to_dict(order_row)
    order["items"] = rows_to_list(
        db.execute("SELECT * FROM order_items WHERE order_id = ?", (order_id,)).fetchall()
    )
    return jsonify(order)

# ---- CRM Contacts & Newsletter --------------------------------------

@app.route("/api/contact", methods=["POST"])
def contact():
    data = request.json or {}
    name = data.get("name")
    email = data.get("email")
    message = data.get("message")
    
    if not name or not email or not message:
        return jsonify({"error": "Missing required contact data"}), 400
        
    db = get_db()
    db.execute(
        "INSERT INTO messages (name, email, message, timestamp) VALUES (?, ?, ?, ?)",
        (name, email, message, datetime.now().isoformat())
    )
    db.commit()
    return jsonify({"success": True}), 200


@app.route("/api/subscribe", methods=["POST"])
def subscribe():
    data = request.json or {}
    email = data.get("email")
    if not email:
        return jsonify({"error": "Email is required"}), 400
        
    db = get_db()
    try:
        db.execute(
            "INSERT INTO subscribers (email, timestamp) VALUES (?, ?)",
            (email, datetime.now().isoformat())
        )
        db.commit()
    except sqlite3.IntegrityError:
        pass  # Already subscribed
    return jsonify({"success": True}), 200


@app.route("/api/capture_lead", methods=["POST"])
def capture_lead():
    # Keep compatibility with lead capture widgets
    data = request.json or {}
    name = data.get("name")
    phone = data.get("phone")
    if name and phone:
        db = get_db()
        db.execute(
            "INSERT INTO messages (name, email, message, timestamp) VALUES (?, ?, ?, ?)",
            (name, "lead@capture.com", f"Captured phone number: {phone}", datetime.now().isoformat())
        )
        db.commit()
        return jsonify({"success": True}), 200
    return jsonify({"error": "Missing data"}), 400

# ---- Admin & Dropshipping Fulfillment Dashboard ---------------------

@app.route("/api/admin_data")
def admin_data():
    if not session.get("logged_in"):
        return jsonify({"error": "Unauthorized"}), 401
        
    db = get_db()
    
    # Calculate dropshipping summary KPIs
    revenue = db.execute("SELECT SUM(total) FROM orders WHERE status = 'paid' OR status = 'fulfilled'").fetchone()[0] or 0.0
    supplier_costs = db.execute("SELECT SUM(supplier_cost) FROM orders WHERE status = 'paid' OR status = 'fulfilled'").fetchone()[0] or 0.0
    profit = revenue - supplier_costs
    margin = (profit / revenue * 100) if revenue > 0 else 0.0
    
    orders = rows_to_list(db.execute("SELECT * FROM orders ORDER BY id DESC").fetchall())
    
    # Include item summaries in orders list
    for o in orders:
        o["items"] = rows_to_list(
            db.execute("SELECT * FROM order_items WHERE order_id = ?", (o["order_id"],)).fetchall()
        )
        
    messages = rows_to_list(db.execute("SELECT * FROM messages ORDER BY id DESC").fetchall())
    subscribers = rows_to_list(db.execute("SELECT * FROM subscribers ORDER BY id DESC").fetchall())
    
    return jsonify({
        "revenue": round(revenue, 2),
        "supplier_costs": round(supplier_costs, 2),
        "profit": round(profit, 2),
        "margin": round(margin, 1),
        "orders": orders,
        "messages": messages,
        "subscribers": subscribers
    }), 200


@app.route("/api/admin/order/fulfill/<order_id>", methods=["POST"])
def fulfill_order(order_id):
    if not session.get("logged_in"):
        return jsonify({"error": "Unauthorized"}), 401
        
    db = get_db()
    order = db.execute("SELECT * FROM orders WHERE order_id = ?", (order_id,)).fetchone()
    if not order:
        return jsonify({"error": "Order not found"}), 404
        
    # Generate mock shipping tracking number
    digits = "".join(random.choices(string.digits, k=8))
    tracking = f"TRK-{digits}"
    
    # Update order state to simulate paying supplier and shipping
    db.execute("""
        UPDATE orders 
        SET status = 'fulfilled', supplier_status = 'paid_and_shipped', tracking_number = ?
        WHERE order_id = ?
    """, (tracking, order_id))
    db.commit()
    
    return jsonify({
        "success": True, 
        "tracking_number": tracking,
        "message": f"Order forwarded to supplier. Paid supplier ${order['supplier_cost']:.2f}. Product shipped directly to customer."
    }), 200


@app.route('/api/delete_message/<int:msg_id>', methods=['DELETE'])
def delete_message(msg_id):
    if not session.get('logged_in'):
        return jsonify({"error": "Unauthorized"}), 401
    db = get_db()
    db.execute("DELETE FROM messages WHERE id = ?", (msg_id,))
    db.commit()
    return jsonify({"success": True}), 200


@app.route('/api/delete_subscriber/<int:sub_id>', methods=['DELETE'])
def delete_subscriber(sub_id):
    if not session.get('logged_in'):
        return jsonify({"error": "Unauthorized"}), 401
    db = get_db()
    db.execute("DELETE FROM subscribers WHERE id = ?", (sub_id,))
    db.commit()
    return jsonify({"success": True}), 200


@app.route('/api/export_subscribers')
def export_subscribers():
    if not session.get('logged_in'):
        return "Unauthorized", 401
    import csv
    from io import StringIO
    from flask import Response
    
    db = get_db()
    rows = db.execute("SELECT email, timestamp FROM subscribers ORDER BY id DESC").fetchall()
    
    si = StringIO()
    cw = csv.writer(si)
    cw.writerow(['Email', 'Subscribed At'])
    for r in rows:
        cw.writerow([r['email'], r['timestamp']])
        
    return Response(
        si.getvalue(), 
        mimetype="text/csv", 
        headers={"Content-disposition": "attachment; filename=subscribers.csv"}
    )

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 8000))
    app.run(host="0.0.0.0", port=port, debug=True)
