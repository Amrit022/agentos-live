import os
import csv
import sqlite3
import resend

# 1. Configured Resend API Key
resend.api_key = "re_KUuTedEC_Kue2hfBynTLRSWjKsKF9ieJD"

# 2. Database & CSV paths
DB_FILE = "database.db"
CSV_FILE = "leads.csv"

# 3. HTML Email Template
EMAIL_HTML = """
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; background-color: #0f172a; margin: 0; padding: 20px; color: #ffffff; }
    .container { max-width: 600px; background: #1e293b; padding: 40px; border-radius: 12px; border: 1px solid rgba(255, 255, 255, 0.08); margin: 0 auto; }
    .header { font-size: 26px; font-weight: bold; color: #ffffff; margin-bottom: 24px; text-align: center; border-bottom: 1px solid rgba(255, 255, 255, 0.08); padding-bottom: 20px; }
    .header span { color: #f59e0b; }
    .alert { background: rgba(239, 68, 68, 0.1); border: 1px solid rgba(239, 68, 68, 0.3); border-radius: 8px; padding: 16px; margin-bottom: 20px; text-align: center; }
    .alert strong { color: #ef4444; }
    .body-text { font-size: 16px; line-height: 1.6; color: #cbd5e1; }
    .cta-container { text-align: center; margin-top: 30px; }
    .cta-btn { display: inline-block; padding: 14px 28px; background-color: #f59e0b; color: #0f172a; text-decoration: none; font-weight: bold; border-radius: 8px; box-shadow: 0 0 20px rgba(245, 158, 11, 0.3); }
    .footer { margin-top: 40px; font-size: 12px; color: #64748b; border-top: 1px solid rgba(255, 255, 255, 0.08); padding-top: 20px; text-align: center; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">SafeFleet<span> Academy</span></div>
    <div class="alert"><strong>⚠️ HVNL 2026 Reforms — 1 August 2026</strong><br>No grace period. Is your team ready?</div>
    <div class="body-text">
      <p>Hello,</p>
      <p>Australia's biggest heavy vehicle regulatory change in a decade commences on <strong>1 August 2026</strong> — with no grace period.</p>
      <p>New mandatory Safety Management Systems, expanded Chain of Responsibility duties, and the Two-Tier HVA accreditation mean every driver, supervisor, and fleet manager needs updated compliance training <strong>now</strong>.</p>
      <p><strong>Our online training covers:</strong></p>
      <ul>
        <li>Chain of Responsibility (CoR) — Drivers, Supervisors & Executives</li>
        <li>Fatigue Management (Standard Hours, BFM, ACA transition)</li>
        <li>Load Restraint & Mass Management</li>
        <li>SMS Implementation & Audit Preparation</li>
      </ul>
      <p>Courses start from <strong>AUD $99</strong> with lifetime access and certificates of completion.</p>
      <div class="cta-container">
        <a href="https://www.agentosacademy.com" class="cta-btn">View All Courses</a>
      </div>
    </div>
    <div class="footer">
      SafeFleet Academy | Support: support@agentosacademy.com<br>
      To unsubscribe from these updates, please reply with 'UNSUBSCRIBE'.
    </div>
  </div>
</body>
</html>
"""

def get_emails_from_database():
    emails = []
    if os.path.exists(DB_FILE):
        try:
            conn = sqlite3.connect(DB_FILE)
            c = conn.cursor()
            c.execute("SELECT email FROM subscribers")
            rows = c.fetchall()
            conn.close()
            emails = [row[0] for row in rows if row[0] and "@" in row[0]]
        except Exception as e:
            print(f"⚠️ Could not read database: {e}")
    return emails

def get_emails_from_csv():
    emails = []
    if os.path.exists(CSV_FILE):
        try:
            with open(CSV_FILE, mode='r', encoding='utf-8-sig') as f:
                reader = csv.reader(f)
                header = next(reader, None)
                
                # Try to locate email column index
                email_idx = -1
                if header:
                    for i, col in enumerate(header):
                        if "email" in col.lower() or "mail" in col.lower():
                            email_idx = i
                            break
                
                # Default to first column if header search fails
                if email_idx == -1:
                    email_idx = 0
                    
                # Read all emails
                for row in reader:
                    if row and len(row) > email_idx:
                        val = row[email_idx].strip()
                        if val and "@" in val:
                            emails.append(val)
        except Exception as e:
            print(f"⚠️ Could not read CSV file: {e}")
    return emails

def run_bulk_sender():
    print("🤖 AgentOS Bulk Email System Initializing...")
    
    # Gather target emails from database & CSV
    db_emails = get_emails_from_database()
    csv_emails = get_emails_from_csv()
    
    # Combine lists and remove duplicates
    all_emails = list(set(db_emails + csv_emails))
    
    print(f"📊 Database subscribers: {len(db_emails)}")
    print(f"📊 CSV leads: {len(csv_emails)}")
    print(f"🎯 Total unique recipients to send: {len(all_emails)}")
    
    if not all_emails:
        print("\n❌ No emails found. Please do one of the following:")
        print("  1. Have users subscribe on your website homepage.")
        print(f"  2. Create a file named '{CSV_FILE}' in this folder and paste your email list into the first column.")
        return
        
    print("\n🚀 Starting bulk email delivery...\n")
    success_count = 0
    fail_count = 0
    
    for idx, email in enumerate(all_emails, 1):
        try:
            # Send email via Resend API
            params = {
                "from": "AgentOS Academy <support@agentosacademy.com>",
                "to": [email],
                "subject": "Build & Scale a $10K/mo AI Automation Agency (No Code)",
                "html": EMAIL_HTML,
            }
            resend.Emails.send(params)
            success_count += 1
            print(f"[{idx}/{len(all_emails)}] ✅ Sent successfully to: {email}")
        except Exception as e:
            fail_count += 1
            print(f"[{idx}/{len(all_emails)}] ❌ Failed to send to {email}: {e}")
            
    print(f"\n✨ Bulk delivery completed! Successful: {success_count} | Failed: {fail_count}")

if __name__ == "__main__":
    run_bulk_sender()
