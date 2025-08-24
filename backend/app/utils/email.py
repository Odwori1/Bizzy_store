import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
import os
from dotenv import load_dotenv

load_dotenv()  # Load environment variables

def send_password_reset_email(email_to: str, username: str, reset_token: str):
    """
    Sends a password reset email to the user with a clickable link and token.
    """
    # Get email settings from environment variables
    smtp_server = os.getenv("SMTP_SERVER", "smtp.gmail.com")
    smtp_port = int(os.getenv("SMTP_PORT", "587"))
    email_from = os.getenv("EMAIL_FROM")
    email_password = os.getenv("EMAIL_PASSWORD")

    # Check if email credentials are configured
    if not email_from or not email_password:
        print("ERROR: Email credentials not configured. Cannot send email.")
        # In a production environment, you would log this error and potentially use a background job queue to retry.
        return False

    # Create the email message with improved content
    subject = "Bizzy POS - Password Reset Request"

    reset_link = f"http://localhost:3000/reset-password?token={reset_token}"

    body = f"""
Hello {username},

You have requested to reset your password for your Bizzy POS account.

Click the link below to reset your password:

{reset_link}

Or copy and paste this token manually:
{reset_token}

This link will expire in 1 hour.

If you did not request this, please ignore this email.

Thank you,
The Bizzy POS Team
"""

    # Create MIME message
    msg = MIMEMultipart()
    msg['From'] = email_from
    msg['To'] = email_to
    msg['Subject'] = subject
    # Attach the plain text body
    msg.attach(MIMEText(body, 'plain'))

    try:
        # Connect to SMTP server and send email
        server = smtplib.SMTP(smtp_server, smtp_port)
        server.starttls()  # Upgrade connection to secure
        server.login(email_from, email_password)
        server.sendmail(email_from, email_to, msg.as_string())
        server.quit()
        print(f"Password reset email sent to {email_to}")
        return True
    except Exception as e:
        print(f"Failed to send email to {email_to}: {e}")
        return False
