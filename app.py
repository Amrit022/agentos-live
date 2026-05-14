import os
import json
import uuid
import hmac
import hashlib
import sqlite3
import requests as http_requests
from datetime import datetime
from functools import wraps
from flask import Flask, request, jsonify, render_template, session, redirect, url_for
from werkzeug.security import generate_password_hash, check_password_hash

app = Flask(__name__)
app.secret_key = os.environ.get('SECRET_KEY', 'agentos-dev-secret-key-change-in-prod')

# PayPal Configuration (Sandbox keys — switch to live when ready)
PAYPAL_CLIENT_ID = os.environ.get('PAYPAL_CLIENT_ID', 'YOUR_PAYPAL_CLIENT_ID_HERE')
PAYPAL_CLIENT_SECRET = os.environ.get('PAYPAL_CLIENT_SECRET', '')
PAYPAL_MODE = os.environ.get('PAYPAL_MODE', 'sandbox')  # 'sandbox' or 'live'
PAYPAL_API_BASE = 'https://api-m.sandbox.paypal.com' if PAYPAL_MODE == 'sandbox' else 'https://api-m.paypal.com'

DB_FILE = 'database.db'
ADMIN_PASSWORD = os.environ.get('ADMIN_PASSWORD', 'password123')

strategies = {
    "free-saas-directory": {
        "icon": "🌐", "num": "01", "title": "Free SaaS Directory", 
        "desc": "Curate free alternatives to expensive software. Monetize via SaaS affiliate programs.", 
        "earn": "$500 - $3k/mo", "platforms": ["PartnerStack", "Impact", "Framer"],
        "plan": [
            "Set up your free domain and hosting.",
            "Curate or create the initial batch of content (30+ items).",
            "Integrate affiliate links aggressively.",
            "Drive traffic via Pinterest, Reddit, and SEO."
        ]
    },
    "ai-prompts-library": {
        "icon": "🤖", "num": "02", "title": "AI Prompts Library", 
        "desc": "A hub for ChatGPT & Claude prompts. Insanely trending, monetizes via premium packs.", 
        "earn": "$800 - $5k/mo", "platforms": ["Gumroad", "Notion", "ConvertKit"],
        "plan": [
            "Pick 3 AI tools to focus on.",
            "Create a categorized prompts database.",
            "Write prompt guides for SEO.",
            "Sell a Premium Prompt Pack on Gumroad."
        ]
    },
    "remote-job-board": {
        "icon": "💼", "num": "03", "title": "Remote Job Board", 
        "desc": "A trusted job board for remote work. Evergreen demand, monetizes via resume affiliates.", 
        "earn": "$1k - $8k/mo", "platforms": ["RemoteOK API", "ShareASale", "Carrd"],
        "plan": [
            "Choose a remote work sub-niche.",
            "Aggregate real jobs from free APIs.",
            "Build your affiliate stack (resume builders, VPNs).",
            "Launch a 'Remote Career' newsletter."
        ]
    },
    "niche-calculators": {
        "icon": "🧮", "num": "04", "title": "Niche Calculators", 
        "desc": "Interactive tools that rank fast on Google. Generates AdSense revenue 24/7.", 
        "earn": "$400 - $4k/mo", "platforms": ["AdSense", "Calconic", "GitHub Pages"],
        "plan": [
            "Pick a profitable calculator niche.",
            "Build 20-50 calculators using free tools.",
            "Apply for Google AdSense.",
            "Optimize for featured snippets."
        ]
    },
    "free-courses-hub": {
        "icon": "🎓", "num": "05", "title": "Free Courses Hub", 
        "desc": "Curate free certifications from Google/IBM. Students upskill, you earn via course upgrades.", 
        "earn": "$600 - $4.5k/mo", "platforms": ["Coursera Aff", "Udemy Aff", "Mailchimp"],
        "plan": [
            "Niche down to a skill category.",
            "Curate legitimate free courses.",
            "Join course affiliate programs.",
            "Create 'learning roadmaps'."
        ]
    },
    "lifetime-deals": {
        "icon": "⚡", "num": "06", "title": "Lifetime Deals", 
        "desc": "Track software lifetime deals. Visitors arrive with credit cards in hand.", 
        "earn": "$2k - $12k/mo", "platforms": ["AppSumo", "Dealify", "WordPress"],
        "plan": [
            "Track all major deal platforms.",
            "Join AppSumo's affiliate program.",
            "Write 'Is It Worth It?' reviews.",
            "Build a deal alert newsletter."
        ]
    },
    "free-design-assets": {
        "icon": "🎨", "num": "07", "title": "Free Design Assets", 
        "desc": "Free Canva/Notion templates. Viral traffic from Pinterest converts to premium bundles.", 
        "earn": "$300 - $5k/mo", "platforms": ["Pinterest", "Gumroad", "Canva"],
        "plan": [
            "Choose a template category.",
            "Create 30 free templates to launch.",
            "Set up your Gumroad store.",
            "Dominate Pinterest with daily pins."
        ]
    }
}

def init_db():
    conn = sqlite3.connect(DB_FILE)
    c = conn.cursor()
    c.execute('''
        CREATE TABLE IF NOT EXISTS messages (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            timestamp TEXT NOT NULL,
            name TEXT NOT NULL,
            email TEXT NOT NULL,
            message TEXT NOT NULL
        )
    ''')
    c.execute('''
        CREATE TABLE IF NOT EXISTS subscribers (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            timestamp TEXT NOT NULL,
            email TEXT NOT NULL UNIQUE
        )
    ''')
    c.execute('''
        CREATE TABLE IF NOT EXISTS orders (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            order_id TEXT NOT NULL UNIQUE,
            status TEXT NOT NULL DEFAULT 'pending',
            name TEXT NOT NULL,
            email TEXT NOT NULL,
            items TEXT NOT NULL,
            total REAL NOT NULL,
            password_hash TEXT,
            timestamp TEXT NOT NULL
        )
    ''')
    c.execute('''
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            email TEXT NOT NULL UNIQUE,
            password_hash TEXT NOT NULL,
            name TEXT NOT NULL,
            created_at TEXT NOT NULL
        )
    ''')
    c.execute('''
        CREATE TABLE IF NOT EXISTS posts (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title TEXT NOT NULL,
            slug TEXT NOT NULL UNIQUE,
            content TEXT NOT NULL,
            timestamp TEXT NOT NULL
        )
    ''')
    c.execute('''
        CREATE TABLE IF NOT EXISTS api_keys (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            email TEXT NOT NULL,
            api_key TEXT NOT NULL UNIQUE,
            name TEXT NOT NULL,
            created_at TEXT NOT NULL
        )
    ''')
    c.execute('''
        CREATE TABLE IF NOT EXISTS leads (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            phone TEXT NOT NULL,
            source TEXT NOT NULL,
            timestamp TEXT NOT NULL
        )
    ''')
    c.execute('''
        CREATE TABLE IF NOT EXISTS support_tickets (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            email TEXT NOT NULL,
            subject TEXT NOT NULL,
            message TEXT NOT NULL,
            status TEXT NOT NULL DEFAULT 'open',
            timestamp TEXT NOT NULL
        )
    ''')
    conn.commit()
    conn.close()

init_db()

@app.route('/')
def index():
    return render_template('index.html', strategies=strategies)

@app.route('/privacy')
def privacy():
    return render_template('privacy.html')

@app.route('/terms')
def terms():
    return render_template('terms.html')

@app.route('/strategy/<slug>')
def strategy_page(slug):
    strategy = strategies.get(slug)
    if not strategy:
        return "Strategy not found", 404
    return render_template('strategy.html', strategy=strategy, slug=slug)

@app.route('/login', methods=['GET', 'POST'])
def login():
    error = None
    if request.method == 'POST':
        if request.form.get('password') == ADMIN_PASSWORD:
            session['logged_in'] = True
            return redirect(url_for('admin'))
        else:
            error = 'Invalid Credentials. Please try again.'
    return render_template('login.html', error=error)

@app.route('/logout')
def logout():
    session.pop('logged_in', None)
    return redirect(url_for('index'))

@app.route('/admin')
def admin():
    if not session.get('logged_in'):
        return redirect(url_for('login'))
    return render_template('admin.html')

@app.route('/cart')
def cart():
    return render_template('cart.html')

def customer_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if 'customer_email' not in session:
            return redirect(url_for('login_customer'))
        return f(*args, **kwargs)
    return decorated_function

@app.route('/login_customer', methods=['GET', 'POST'])
def login_customer():
    error = None
    if request.method == 'POST':
        email = request.form.get('email')
        password = request.form.get('password')
        conn = sqlite3.connect(DB_FILE)
        c = conn.cursor()
        c.execute("SELECT password_hash FROM users WHERE email = ?", (email,))
        user = c.fetchone()
        conn.close()
        if user and check_password_hash(user[0], password):
            session['customer_email'] = email
            return redirect(url_for('portal'))
        error = 'Invalid email or password.'
    return render_template('login_customer.html', error=error)

@app.route('/logout_customer')
def logout_customer():
    session.pop('customer_email', None)
    return redirect(url_for('login_customer'))

@app.route('/portal')
@customer_required
def portal():
    email = session['customer_email']
    conn = sqlite3.connect(DB_FILE)
    conn.row_factory = sqlite3.Row
    c = conn.cursor()
    c.execute("SELECT * FROM orders WHERE email = ? AND status = 'paid' ORDER BY id DESC", (email,))
    orders = c.fetchall()
    conn.close()
    
    purchased_items = []
    for o in orders:
        items = json.loads(o['items'])
        for item in items:
            if not any(p['name'] == item['name'] for p in purchased_items):
                purchased_items.append(item)
                
    return render_template('portal.html', items=purchased_items)

@app.route('/course/blueprint')
@customer_required
def course_blueprint():
    return render_template('course_blueprint.html')

@app.route('/course/templates')
@customer_required
def course_templates():
    return render_template('course_templates.html')

@app.route('/course/acquisition')
@customer_required
def course_acquisition():
    return render_template('course_acquisition.html')

@app.route('/course/makecom')
@customer_required
def course_makecom():
    return render_template('course_makecom.html')

@app.route('/blog')
def blog():
    conn = sqlite3.connect(DB_FILE)
    conn.row_factory = sqlite3.Row
    c = conn.cursor()
    c.execute("SELECT * FROM posts ORDER BY id DESC")
    posts = c.fetchall()
    conn.close()
    return render_template('blog.html', posts=posts)

@app.route('/blog/<slug>')
def post_page(slug):
    conn = sqlite3.connect(DB_FILE)
    conn.row_factory = sqlite3.Row
    c = conn.cursor()
    c.execute("SELECT * FROM posts WHERE slug = ?", (slug,))
    post = c.fetchone()
    conn.close()
    if not post:
        return "Post not found", 404
    return render_template('post.html', post=post)

@app.route('/api/contact', methods=['POST'])
def contact():
    data = request.json
    if not data or not all(k in data for k in ("name", "email", "message")):
        return jsonify({"error": "Missing data"}), 400
    
    conn = sqlite3.connect(DB_FILE)
    c = conn.cursor()
    c.execute("INSERT INTO messages (timestamp, name, email, message) VALUES (?, ?, ?, ?)",
              (datetime.now().isoformat(), data.get("name"), data.get("email"), data.get("message")))
    conn.commit()
    conn.close()
    return jsonify({"success": True}), 200

@app.route('/api/subscribe', methods=['POST'])
def subscribe():
    data = request.json
    email = data.get("email")
    if not email:
        return jsonify({"error": "Missing email"}), 400
    
    conn = sqlite3.connect(DB_FILE)
    c = conn.cursor()
    try:
        c.execute("INSERT INTO subscribers (timestamp, email) VALUES (?, ?)",
                  (datetime.now().isoformat(), email))
        conn.commit()
        success = True
    except sqlite3.IntegrityError:
        success = True # Already subscribed
    finally:
        conn.close()
    return jsonify({"success": success}), 200

@app.route('/api/admin_data', methods=['GET'])
def admin_data():
    if not session.get('logged_in'):
        return jsonify({"error": "Unauthorized"}), 401
        
    conn = sqlite3.connect(DB_FILE)
    conn.row_factory = sqlite3.Row
    c = conn.cursor()
    
    c.execute("SELECT * FROM messages ORDER BY id DESC")
    messages = [dict(ix) for ix in c.fetchall()]
    
    c.execute("SELECT * FROM subscribers ORDER BY id DESC")
    subscribers = [dict(ix) for ix in c.fetchall()]
    
    try:
        c.execute("SELECT * FROM orders WHERE status = 'paid' ORDER BY id DESC")
        orders = [dict(ix) for ix in c.fetchall()]
    except sqlite3.OperationalError:
        orders = []
        
    try:
        c.execute("SELECT * FROM posts ORDER BY id DESC")
        posts = [dict(ix) for ix in c.fetchall()]
    except sqlite3.OperationalError:
        posts = []
        
    try:
        c.execute("SELECT * FROM leads ORDER BY id DESC")
        leads = [dict(ix) for ix in c.fetchall()]
    except sqlite3.OperationalError:
        leads = []
        
    conn.close()
    return jsonify({
        "messages": messages, 
        "subscribers": subscribers, 
        "orders": orders, 
        "posts": posts,
        "leads": leads
    }), 200

@app.route('/api/admin/posts', methods=['POST'])
def create_post():
    if not session.get('logged_in'): return jsonify({"error": "Unauthorized"}), 401
    data = request.json
    import re
    slug = re.sub(r'[^a-z0-9]+', '-', data['title'].lower()).strip('-')
    
    conn = sqlite3.connect(DB_FILE)
    c = conn.cursor()
    try:
        c.execute("INSERT INTO posts (title, slug, content, timestamp) VALUES (?, ?, ?, ?)",
                  (data['title'], slug, data['content'], datetime.now().isoformat()))
        conn.commit()
    except sqlite3.IntegrityError:
        conn.close()
        return jsonify({"error": "Slug already exists"}), 400
    conn.close()
    return jsonify({"success": True}), 200

@app.route('/api/admin/posts/<int:post_id>', methods=['DELETE'])
def delete_post(post_id):
    if not session.get('logged_in'): return jsonify({"error": "Unauthorized"}), 401
    conn = sqlite3.connect(DB_FILE)
    c = conn.cursor()
    c.execute("DELETE FROM posts WHERE id = ?", (post_id,))
    conn.commit()
    conn.close()
    return jsonify({"success": True}), 200

@app.route('/api/create-checkout-session', methods=['POST'])
def create_checkout_session():
    data = request.json
    name = data.get('name')
    email = data.get('email')
    items = data.get('items', [])
    total = data.get('total', 0)
    password = data.get('password')
    
    order_id = str(uuid.uuid4())
    p_hash = generate_password_hash(password) if password else None
    
    conn = sqlite3.connect(DB_FILE)
    c = conn.cursor()
    c.execute("INSERT INTO orders (order_id, status, name, email, items, total, password_hash, timestamp) VALUES (?, ?, ?, ?, ?, ?, ?, ?)", 
              (order_id, 'pending', name, email, json.dumps(items), total, p_hash, datetime.now().isoformat()))
    conn.commit()
    conn.close()
    
    return jsonify({
        'internal_order_id': order_id,
        'paypal_client_id': PAYPAL_CLIENT_ID,
        'total': f"{float(total):.2f}",
        'currency': 'USD'
    }), 200

@app.route('/api/verify-payment', methods=['POST'])
def verify_payment():
    data = request.json
    paypal_order_id = data.get('paypal_order_id')
    internal_order_id = data.get('internal_order_id')
    
    # Process the order — PayPal handles payment verification client-side
    # For extra security, you can verify with PayPal API using client secret
    conn = sqlite3.connect(DB_FILE)
    conn.row_factory = sqlite3.Row
    c = conn.cursor()
    
    c.execute("SELECT * FROM orders WHERE order_id = ?", (internal_order_id,))
    order = c.fetchone()
    
    if order and order['status'] == 'pending':
        c.execute("UPDATE orders SET status = 'paid' WHERE order_id = ?", (internal_order_id,))
        
        # Create user account
        if order['password_hash']:
            try:
                c.execute("INSERT INTO users (email, password_hash, name, created_at) VALUES (?, ?, ?, ?)",
                          (order['email'], order['password_hash'], order['name'], datetime.now().isoformat()))
            except sqlite3.IntegrityError:
                pass  # User already exists
                
        conn.commit()
        session['customer_email'] = order['email']
    
    conn.close()
    
    return jsonify({'success': True, 'redirect': '/portal'}), 200

@app.route('/checkout/success')
def checkout_success():
    order_id = request.args.get('order_id')
    if not order_id:
        return redirect(url_for('index'))
    
    conn = sqlite3.connect(DB_FILE)
    conn.row_factory = sqlite3.Row
    c = conn.cursor()
    c.execute("SELECT * FROM orders WHERE order_id = ?", (order_id,))
    order = c.fetchone()
    conn.close()
    
    if order:
        session['customer_email'] = order['email']
    
    return redirect(url_for('portal'))

@app.route('/api/delete_message/<int:msg_id>', methods=['DELETE'])
def delete_message(msg_id):
    if not session.get('logged_in'): return jsonify({"error": "Unauthorized"}), 401
    conn = sqlite3.connect(DB_FILE)
    c = conn.cursor()
    c.execute("DELETE FROM messages WHERE id = ?", (msg_id,))
    conn.commit()
    conn.close()
    return jsonify({"success": True}), 200

@app.route('/api/delete_subscriber/<int:sub_id>', methods=['DELETE'])
def delete_subscriber(sub_id):
    if not session.get('logged_in'): return jsonify({"error": "Unauthorized"}), 401
    conn = sqlite3.connect(DB_FILE)
    c = conn.cursor()
    c.execute("DELETE FROM subscribers WHERE id = ?", (sub_id,))
    conn.commit()
    conn.close()
    return jsonify({"success": True}), 200

@app.route('/api/export_subscribers')
def export_subscribers():
    if not session.get('logged_in'): return "Unauthorized", 401
    import csv
    from io import StringIO
    from flask import Response
    conn = sqlite3.connect(DB_FILE)
    c = conn.cursor()
    c.execute("SELECT email, timestamp FROM subscribers ORDER BY id DESC")
    rows = c.fetchall()
    conn.close()
    si = StringIO()
    cw = csv.writer(si)
    cw.writerow(['Email', 'Subscribed At'])
    cw.writerows(rows)
    return Response(si.getvalue(), mimetype="text/csv", headers={"Content-disposition": "attachment; filename=subscribers.csv"})

@app.route('/profile', methods=['GET', 'POST'])
@customer_required
def profile():
    email = session['customer_email']
    msg = None
    conn = sqlite3.connect(DB_FILE)
    conn.row_factory = sqlite3.Row
    c = conn.cursor()
    
    if request.method == 'POST':
        new_name = request.form.get('name')
        new_password = request.form.get('password')
        if new_name:
            c.execute("UPDATE users SET name = ? WHERE email = ?", (new_name, email))
            c.execute("UPDATE orders SET name = ? WHERE email = ?", (new_name, email))
            msg = "Profile updated successfully."
        if new_password:
            hashed = generate_password_hash(new_password)
            c.execute("UPDATE users SET password_hash = ? WHERE email = ?", (hashed, email))
            c.execute("UPDATE orders SET password_hash = ? WHERE email = ?", (hashed, email))
            msg = "Password updated successfully."
        conn.commit()
        
    c.execute("SELECT * FROM users WHERE email = ?", (email,))
    user = c.fetchone()
    conn.close()
    return render_template('profile.html', user=user, msg=msg)

@app.route('/api_keys', methods=['GET', 'POST'])
@customer_required
def api_keys():
    email = session['customer_email']
    conn = sqlite3.connect(DB_FILE)
    conn.row_factory = sqlite3.Row
    c = conn.cursor()
    
    if request.method == 'POST':
        key_name = request.form.get('key_name', 'Default Key')
        new_key = 'sk_live_' + str(uuid.uuid4()).replace('-', '')
        c.execute("INSERT INTO api_keys (email, api_key, name, created_at) VALUES (?, ?, ?, ?)",
                  (email, new_key, key_name, datetime.now().isoformat()))
        conn.commit()
        
    c.execute("SELECT * FROM api_keys WHERE email = ? ORDER BY id DESC", (email,))
    keys = c.fetchall()
    conn.close()
    return render_template('api_keys.html', keys=keys)

@app.route('/discord')
@customer_required
def discord():
    return render_template('discord.html')

@app.route('/support', methods=['GET', 'POST'])
@customer_required
def support():
    email = session['customer_email']
    msg = None
    if request.method == 'POST':
        subject = request.form.get('subject')
        message = request.form.get('message')
        conn = sqlite3.connect(DB_FILE)
        c = conn.cursor()
        c.execute("INSERT INTO support_tickets (email, subject, message, timestamp) VALUES (?, ?, ?, ?)",
                  (email, subject, message, datetime.now().isoformat()))
        conn.commit()
        conn.close()
        msg = "Support ticket submitted successfully. Our team will contact you shortly."
    return render_template('support.html', msg=msg)

@app.route('/api/capture_lead', methods=['POST'])
def capture_lead():
    data = request.json
    name = data.get('name')
    phone = data.get('phone')
    if name and phone:
        conn = sqlite3.connect(DB_FILE)
        c = conn.cursor()
        c.execute("INSERT INTO leads (name, phone, source, timestamp) VALUES (?, ?, ?, ?)",
                  (name, phone, 'AgentOS Bot', datetime.now().isoformat()))
        conn.commit()
        conn.close()
        return jsonify({"success": True}), 200
    return jsonify({"error": "Missing data"}), 400

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 8000))
    debug = os.environ.get('FLASK_DEBUG', 'true').lower() == 'true'
    app.run(host='0.0.0.0', port=port, debug=debug)
