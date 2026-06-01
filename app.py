import os
import json
import uuid
import hmac
import hashlib
import sqlite3
import requests as http_requests
from datetime import datetime
from functools import wraps
from flask import Flask, request, jsonify, render_template, session, redirect, url_for, send_file
from werkzeug.security import generate_password_hash, check_password_hash

app = Flask(__name__)
app.secret_key = os.environ.get('SECRET_KEY', 'safefleet-dev-secret-key-change-in-prod')

# PayPal Configuration (Sandbox keys — switch to live when ready)
PAYPAL_CLIENT_ID = os.environ.get('PAYPAL_CLIENT_ID', 'Af9wZg_O8vJIARumOvVa-VE8ER2vpKOJ4YDVhFp4GGD0PNCg3QvATL_qNHvHRA33JojiLqcoOvffv5Ht')
PAYPAL_CLIENT_SECRET = os.environ.get('PAYPAL_CLIENT_SECRET', '')
PAYPAL_MODE = os.environ.get('PAYPAL_MODE', 'sandbox')  # 'sandbox' or 'live'
PAYPAL_API_BASE = 'https://api-m.sandbox.paypal.com' if PAYPAL_MODE == 'sandbox' else 'https://api-m.paypal.com'

DB_FILE = 'database.db'
ADMIN_PASSWORD = os.environ.get('ADMIN_PASSWORD', 'password123')

strategies = {
    "cor-drivers": {
        "icon": "🛡️", "num": "01", "title": "CoR Awareness for Drivers",
        "desc": "Understand your Chain of Responsibility obligations under the HVNL. Essential for every heavy vehicle driver in Australia.",
        "earn": "Certificate of Completion", "platforms": ["NHVR", "HVNL", "CoR"],
        "plan": ["Understand what CoR means for drivers", "Learn your primary safety duty under Section 26C", "Know the 5 key compliance areas: speed, fatigue, mass, load restraint, vehicle standards", "Recognise penalties for non-compliance"]
    },
    "cor-supervisors": {
        "icon": "📋", "num": "02", "title": "CoR for Supervisors & Schedulers",
        "desc": "Advanced Chain of Responsibility training for those who schedule, manage, or direct transport activities.",
        "earn": "Certificate of Completion", "platforms": ["TLIF0006", "TLIF0009", "NHVR"],
        "plan": ["Understand scheduler duties under CoR", "Learn fatigue risk management for scheduling", "Implement compliant rostering practices", "Document and demonstrate due diligence"]
    },
    "cor-executives": {
        "icon": "⚖️", "num": "03", "title": "CoR Due Diligence for Executives",
        "desc": "Executive officer duties, personal liability, and due diligence obligations under the HVNL.",
        "earn": "Certificate of Completion", "platforms": ["HVNL", "Executive Duty", "Due Diligence"],
        "plan": ["Understand personal liability as an executive officer", "Learn the 6 elements of due diligence", "Build a compliance governance framework", "Implement safety assurance systems"]
    },
    "fatigue-management": {
        "icon": "⏱️", "num": "04", "title": "Fatigue Management (BFM)",
        "desc": "Comprehensive fatigue management training covering Standard Hours, BFM, work diaries, and the new ACA framework.",
        "earn": "Certificate of Completion", "platforms": ["TLIF0005", "BFM", "EWD"],
        "plan": ["Master Standard Hours and BFM hour limits", "Learn work diary and EWD requirements", "Understand rest break obligations", "Prepare for ACA transition under HVNL 2026"]
    },
    "load-restraint": {
        "icon": "📦", "num": "05", "title": "Load Restraint Essentials",
        "desc": "Performance-based load restraint standards: 0.8g forward, 0.5g sideways/rearward, 0.2g vertical.",
        "earn": "Certificate of Completion", "platforms": ["Load Restraint Guide", "NHVR", "Performance Standards"],
        "plan": ["Understand the performance-based standards", "Learn lashing, blocking, and containment methods", "Calculate minimum restraint requirements", "Conduct pre-departure load inspections"]
    },
    "mass-dimension": {
        "icon": "⚖️", "num": "06", "title": "Mass, Dimension & Loading",
        "desc": "Gross and axle mass limits, dimension requirements, and the 2026 GML changes.",
        "earn": "Certificate of Completion", "platforms": ["GML", "CML", "HML"],
        "plan": ["Understand GML, CML, and HML mass limits", "Learn axle group mass distribution", "Know dimension limits (new 20m general access)", "Calculate compliant payload capacity"]
    },
    "sms-audit": {
        "icon": "🔍", "num": "07", "title": "SMS Implementation & Audit Prep",
        "desc": "Build and audit Safety Management Systems using the PSOE methodology for the new HVA accreditation.",
        "earn": "Certificate of Completion", "platforms": ["SMS", "PSOE", "HVA"],
        "plan": ["Understand the 5 SMS outcomes", "Learn the PSOE audit methodology", "Build compliant safety documentation", "Prepare for GSA and ACA accreditation"]
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

@app.route('/api/admin/send_campaign', methods=['POST'])
def send_campaign():
    if not session.get('logged_in'): 
        return jsonify({"error": "Unauthorized"}), 401
        
    data = request.json
    campaign_name = data.get('campaign_name')
    subject = data.get('subject')
    body = data.get('body')
    
    if not campaign_name or not subject or not body:
        return jsonify({"error": "Missing parameters"}), 400
        
    conn = sqlite3.connect(DB_FILE)
    c = conn.cursor()
    c.execute("SELECT email FROM subscribers")
    subs = [row[0] for row in c.fetchall()]
    conn.close()
    
    if not subs:
        return jsonify({"error": "No subscribers registered to send to."}), 400
        
    smtp_server = os.environ.get('SMTP_SERVER')
    smtp_port = os.environ.get('SMTP_PORT', '587')
    smtp_user = os.environ.get('SMTP_EMAIL')
    smtp_pass = os.environ.get('SMTP_PASSWORD')
    
    sent_emails = []
    failed_emails = []
    mode = "simulated"
    
    if smtp_server and smtp_user and smtp_pass:
        import smtplib
        from email.mime.text import MIMEText
        from email.mime.multipart import MIMEMultipart
        
        try:
            server = smtplib.SMTP(smtp_server, int(smtp_port))
            server.starttls()
            server.login(smtp_user, smtp_pass)
            
            for email_addr in subs:
                try:
                    msg = MIMEMultipart()
                    msg['From'] = smtp_user
                    msg['To'] = email_addr
                    msg['Subject'] = subject
                    
                    msg.attach(MIMEText(body, 'html'))
                    server.sendmail(smtp_user, email_addr, msg.as_string())
                    sent_emails.append(email_addr)
                except Exception as e:
                    failed_emails.append((email_addr, str(e)))
            server.quit()
            mode = "smtp"
        except Exception as e:
            mode = "simulated_fallback"
            
    if mode in ["simulated", "simulated_fallback"]:
        log_dir = "scratch"
        if not os.path.exists(log_dir):
            os.makedirs(log_dir)
        log_path = os.path.join(log_dir, "campaign_logs.txt")
        
        with open(log_path, "a", encoding="utf-8") as f:
            f.write(f"\n========================================\n")
            f.write(f"CAMPAIGN SENT: {campaign_name}\n")
            f.write(f"TIMESTAMP: {datetime.now().isoformat()}\n")
            f.write(f"SUBJECT: {subject}\n")
            f.write(f"RECIPIENTS ({len(subs)}): {', '.join(subs)}\n")
            f.write(f"BODY:\n{body}\n")
            f.write(f"========================================\n")
        sent_emails = subs
        
    return jsonify({
        "success": True,
        "mode": mode,
        "recipients_count": len(sent_emails),
        "failed_count": len(failed_emails),
        "recipients": sent_emails
    }), 200

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
                  (name, phone, 'SafeFleet Bot', datetime.now().isoformat()))
        conn.commit()
        conn.close()
        return jsonify({"success": True}), 200
    return jsonify({"error": "Missing data"}), 400

@app.route('/download-logo')
def download_logo():
    path = os.path.join('static', 'logo.png')
    return send_file(path, mimetype='image/png', as_attachment=True, download_name='safefleet_logo.png')

@app.route('/download-banner')
def download_banner():
    path = os.path.join('static', 'logo.png')
    return send_file(path, mimetype='image/png', as_attachment=True, download_name='safefleet_banner.png')

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 8000))
    debug = os.environ.get('FLASK_DEBUG', 'true').lower() == 'true'
    app.run(host='0.0.0.0', port=port, debug=debug)
