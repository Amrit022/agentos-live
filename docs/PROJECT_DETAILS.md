# WealthWeb Monetization Hub
**Project Documentation & Details**

## Platform Overview
WealthWeb Hub is a full-stack, zero-investment digital business platform designed to capture leads, process payments, deliver digital products via a secure portal, and drive organic traffic through an SEO blog.

## Quick Start
1. **Activate Environment:** `.\venv\Scripts\activate`
2. **Run Server:** `python app.py`
3. **Local URL:** `http://127.0.0.1:8000/`

---

## 🔑 Important Access Details

### Admin Dashboard
- **URL:** `http://127.0.0.1:8000/admin`
- **Password:** `password123`
- *Features:* View total revenue, manage CRM leads, review orders, export newsletter subscribers, and publish SEO blog posts.

### Payment Gateway (PayPal)
- **Status:** Sandbox Mode Active
- **File:** `app.py`
- **Config:** Set `PAYPAL_CLIENT_ID` environment variable with your PayPal Client ID
- *Note:* The platform uses PayPal Smart Buttons for checkout. Set environment variables on your hosting provider (Render.com) to activate live payments.

---

## 🏗️ Architecture & Features

### 1. The E-Commerce Storefront (`index.html` & `cart.html`)
- Displays 7 zero-investment strategies.
- Features dynamic, glassmorphic UI elements and infinite-scrolling case studies.
- Users can add premium masterclasses to their LocalStorage cart.
- Includes a built-in promo code engine (try `LAUNCH20` for 20% off).

### 2. Secure Customer Portal (`portal.html`)
- **URL:** `http://127.0.0.1:8000/portal`
- When a user purchases a product, a secure account is instantly created with a hashed password.
- They are redirected to the portal where only *their specific purchased products* are unlocked.
- **Protected Content:** The premium course (`/course/blueprint`) is locked behind an authentication wall and cannot be accessed by public users.

### 3. SEO Blogging Engine (`blog.html` & `post.html`)
- Completely dynamic Content Management System (CMS).
- Admins can write and publish articles directly from the Admin Dashboard.
- Articles are auto-saved to the database, auto-assigned URL slugs, and instantly published to the live blog to capture Google Search traffic.

---

## 🗄️ Database Schema (`database.db`)
The platform uses a lightweight SQLite database for zero-cost hosting.

1. **`messages`**: Stores contact form submissions (Name, Email, Message).
2. **`subscribers`**: Stores newsletter sign-ups.
3. **`orders`**: Stores e-commerce purchases (Order ID, Name, Email, Items, Total Revenue, Payment Status).
4. **`users`**: Securely stores Customer Portal accounts (Email, Hashed Passwords).
5. **`posts`**: Stores published SEO articles (Title, Slug, Content, Timestamp).

---

## 🚀 Deployment Next Steps
When you are ready to launch to the world:
1. **Get Real Keys:** Create a free Stripe account and swap your API key.
2. **Hosting:** Deploy this repository to a free platform like **Render**, **Railway**, or **PythonAnywhere**. (The SQLite database will work instantly on these platforms without configuration).
3. **Domain:** Connect a custom domain (e.g., `wealthweb.com`).
