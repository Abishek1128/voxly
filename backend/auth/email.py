# import smtplib
# from email.mime.multipart import MIMEMultipart
# from email.mime.text import MIMEText
# import os
# from dotenv import load_dotenv

# load_dotenv()


# def send_verification_email(to_email: str, token: str):
#     SMTP_SERVER = "smtp.gmail.com"
#     SMTP_PORT = 587
#     EMAIL_ADDRESS = os.getenv("EMAIL_ADDRESS")
#     EMAIL_PASSWORD = os.getenv("EMAIL_PASSWORD")

#     verify_link = f"http://localhost:5173/verify-email?token={token}"

#     html_content = f"""
# <!DOCTYPE html>
# <html lang="en">
# <head>
#   <meta charset="UTF-8" />
#   <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
#   <title>Verify your VOXLY account</title>
# </head>
# <body style="margin:0;padding:0;background:#04040a;font-family:'DM Sans',Arial,sans-serif;">

#   <!-- Outer wrapper -->
#   <table width="100%" cellpadding="0" cellspacing="0" border="0"
#          style="background:#04040a;padding:48px 16px;">
#     <tr>
#       <td align="center">

#         <!-- Card -->
#         <table width="520" cellpadding="0" cellspacing="0" border="0"
#                style="background:#0d0d18;border:1px solid rgba(255,255,255,0.07);
#                       border-radius:20px;overflow:hidden;">

#           <!-- Top accent bar -->
#           <tr>
#             <td style="height:3px;
#                        background:linear-gradient(90deg,#00D1FF,#7B3FF2,#FF2FB3);
#                        font-size:0;line-height:0;">&nbsp;</td>
#           </tr>

#           <!-- Header -->
#           <tr>
#             <td align="center" style="padding:36px 40px 28px;">
#               <!-- Logo mark -->
#               <table cellpadding="0" cellspacing="0" border="0">
#                 <tr>
#                   <td style="background:linear-gradient(135deg,#00D1FF,#7B3FF2);
#                              border-radius:12px;width:40px;height:40px;
#                              text-align:center;vertical-align:middle;">
#                     <span style="font-size:18px;font-weight:800;color:#fff;
#                                  font-family:Arial,sans-serif;line-height:40px;">V</span>
#                   </td>
#                   <td style="padding-left:10px;vertical-align:middle;">
#                     <span style="font-size:20px;font-weight:800;color:#ffffff;
#                                  letter-spacing:-0.02em;font-family:Arial,sans-serif;">VOXLY</span>
#                   </td>
#                 </tr>
#               </table>
#             </td>
#           </tr>

#           <!-- Divider -->
#           <tr>
#             <td style="padding:0 40px;">
#               <div style="height:1px;background:rgba(255,255,255,0.06);font-size:0;">&nbsp;</div>
#             </td>
#           </tr>

#           <!-- Body -->
#           <tr>
#             <td style="padding:36px 40px 12px;">
#               <p style="margin:0 0 8px;font-size:22px;font-weight:700;
#                         color:#ffffff;letter-spacing:-0.01em;line-height:1.3;">
#                 Verify your email address
#               </p>
#               <p style="margin:0 0 28px;font-size:14px;color:rgba(255,255,255,0.45);
#                         line-height:1.7;">
#                 Thanks for signing up for VOXLY. Click the button below to confirm
#                 your email and activate your account.
#               </p>

#               <!-- CTA Button -->
#               <table cellpadding="0" cellspacing="0" border="0" style="margin-bottom:28px;">
#                 <tr>
#                   <td style="background:linear-gradient(135deg,#00D1FF,#7B3FF2);
#                              border-radius:12px;box-shadow:0 4px 24px rgba(0,209,255,0.3);">
#                     <a href="{verify_link}"
#                        style="display:inline-block;padding:14px 36px;
#                               font-size:14px;font-weight:700;color:#ffffff;
#                               text-decoration:none;letter-spacing:0.01em;
#                               font-family:Arial,sans-serif;">
#                       ✓ &nbsp;Verify Email Address
#                     </a>
#                   </td>
#                 </tr>
#               </table>

#               <!-- Expiry notice -->
#               <table cellpadding="0" cellspacing="0" border="0"
#                      style="background:rgba(255,184,0,0.06);
#                             border:1px solid rgba(255,184,0,0.2);
#                             border-radius:10px;margin-bottom:28px;width:100%;">
#                 <tr>
#                   <td style="padding:12px 16px;">
#                     <p style="margin:0;font-size:12px;color:rgba(255,184,0,0.85);
#                                line-height:1.6;">
#                       ⏱&nbsp; This link expires in <strong>15 minutes</strong>.
#                       If it expires, you can request a new one from the sign-in page.
#                     </p>
#                   </td>
#                 </tr>
#               </table>

#               <!-- Fallback link -->
#               <p style="margin:0 0 6px;font-size:12px;color:rgba(255,255,255,0.25);
#                         line-height:1.6;">
#                 Button not working? Copy and paste this link into your browser:
#               </p>
#               <p style="margin:0 0 32px;font-size:11px;
#                         color:rgba(0,209,255,0.55);word-break:break-all;line-height:1.6;">
#                 {verify_link}
#               </p>
#             </td>
#           </tr>

#           <!-- Divider -->
#           <tr>
#             <td style="padding:0 40px;">
#               <div style="height:1px;background:rgba(255,255,255,0.05);font-size:0;">&nbsp;</div>
#             </td>
#           </tr>

#           <!-- Footer -->
#           <tr>
#             <td style="padding:24px 40px 32px;">
#               <p style="margin:0 0 6px;font-size:11px;color:rgba(255,255,255,0.2);
#                         line-height:1.6;">
#                 If you didn't create a VOXLY account, you can safely ignore this email.
#               </p>
#               <p style="margin:0;font-size:11px;color:rgba(255,255,255,0.12);line-height:1.6;">
#                 © 2026 VOXLY — Voice Powered Interview Intelligence
#               </p>
#             </td>
#           </tr>

#         </table>
#         <!-- /Card -->

#       </td>
#     </tr>
#   </table>

# </body>
# </html>
# """

#     message = MIMEMultipart("alternative")
#     message["Subject"] = "Verify your email"
#     message["From"] = EMAIL_ADDRESS
#     message["To"] = to_email

#     message.attach(MIMEText(html_content, "html"))

#     try:
#         # ✅ Use context manager (important fix)
#         with smtplib.SMTP(SMTP_SERVER, SMTP_PORT) as server:
#             server.ehlo()              # identify ourselves
#             server.starttls()          # secure connection
#             server.ehlo()
#             server.login(EMAIL_ADDRESS, EMAIL_PASSWORD)
#             server.sendmail(
#                 EMAIL_ADDRESS,
#                 to_email,
#                 message.as_string()
#             )

#         print("✅ Email sent successfully!")

#     except Exception as e:
#         print("❌ Failed to send email:", str(e))


# backend/auth/email.py
# backend/auth/email.py
import smtplib
import os
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from dotenv import load_dotenv

load_dotenv()


def _smtp_config():
    return {
        "server":   "smtp.gmail.com",
        "port":     587,
        "address":  os.getenv("EMAIL_ADDRESS"),
        "password": os.getenv("EMAIL_PASSWORD"),
    }


def _send(to_email: str, subject: str, html: str):
    cfg = _smtp_config()
    msg = MIMEMultipart("alternative")
    msg["Subject"] = subject
    msg["From"]    = cfg["address"]
    msg["To"]      = to_email
    msg.attach(MIMEText(html, "html"))
    try:
        with smtplib.SMTP(cfg["server"], cfg["port"]) as server:
            server.ehlo()
            server.starttls()
            server.ehlo()
            server.login(cfg["address"], cfg["password"])
            server.sendmail(cfg["address"], to_email, msg.as_string())
        print(f"✅ Email sent to {to_email}")
    except Exception as e:
        print(f"❌ Failed to send email: {e}")


def _logo_html() -> str:
    """Pure HTML/CSS VOXLY wordmark — no images, renders in all email clients."""
    return """
    <table cellpadding="0" cellspacing="0" border="0" style="margin:0 auto;">
      <tr>
        <td style="background:linear-gradient(135deg,#00D1FF,#7B3FF2);
                   border-radius:10px;width:36px;height:36px;
                   text-align:center;vertical-align:middle;">
          <span style="font-size:17px;font-weight:900;color:#ffffff;
                       font-family:Arial,sans-serif;line-height:36px;
                       display:block;">V</span>
        </td>
        <td style="padding-left:10px;vertical-align:middle;">
          <span style="font-size:22px;font-weight:900;color:#ffffff;
                       letter-spacing:0.08em;font-family:Arial,sans-serif;">VOXLY</span>
        </td>
      </tr>
    </table>
    """


# ── Email Verification ────────────────────────────────────────────────
def send_verification_email(to_email: str, token: str):
    verify_link = f"http://localhost:5173/verify-email?token={token}"

    html = f"""
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1.0"/>
  <title>Verify your VOXLY account</title>
</head>
<body style="margin:0;padding:0;background:#04040a;font-family:Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" border="0"
         style="background:#04040a;padding:48px 16px;">
    <tr><td align="center">
      <table width="520" cellpadding="0" cellspacing="0" border="0"
             style="background:#0d0d18;border:1px solid rgba(255,255,255,0.07);
                    border-radius:20px;overflow:hidden;max-width:520px;">

        <!-- Accent bar -->
        <tr>
          <td style="height:4px;
                     background:linear-gradient(90deg,#00D1FF,#7B3FF2,#FF2FB3);
                     font-size:0;line-height:0;">&nbsp;</td>
        </tr>

        <!-- Logo -->
        <tr>
          <td align="center" style="padding:36px 40px 28px;">
            {_logo_html()}
          </td>
        </tr>

        <!-- Divider -->
        <tr>
          <td style="padding:0 40px;">
            <div style="height:1px;background:rgba(255,255,255,0.06);font-size:0;">&nbsp;</div>
          </td>
        </tr>

        <!-- Body -->
        <tr>
          <td style="padding:36px 40px 12px;">
            <p style="margin:0 0 8px;font-size:22px;font-weight:700;color:#ffffff;
                      line-height:1.3;text-align:center;font-family:Arial,sans-serif;">
              Verify your email address
            </p>
            <p style="margin:0 0 28px;font-size:14px;color:rgba(255,255,255,0.45);
                      line-height:1.7;text-align:center;font-family:Arial,sans-serif;">
              Thanks for signing up for VOXLY. Click the button below to confirm
              your email and activate your account.
            </p>

            <!-- CTA Button -->
            <table cellpadding="0" cellspacing="0" border="0" style="margin:0 auto 28px auto;">
              <tr>
                <td align="center"
                    style="background:linear-gradient(135deg,#00D1FF,#7B3FF2);
                           border-radius:12px;">
                  <a href="{verify_link}"
                     style="display:inline-block;padding:14px 40px;font-size:14px;
                            font-weight:700;color:#ffffff;text-decoration:none;
                            font-family:Arial,sans-serif;white-space:nowrap;">
                    ✓ &nbsp;Verify Email Address
                  </a>
                </td>
              </tr>
            </table>

            <!-- Expiry notice -->
            <table cellpadding="0" cellspacing="0" border="0"
                   style="background:rgba(255,184,0,0.06);
                          border:1px solid rgba(255,184,0,0.25);
                          border-radius:10px;margin-bottom:28px;width:100%;">
              <tr>
                <td style="padding:12px 16px;text-align:center;">
                  <p style="margin:0;font-size:12px;color:rgba(255,184,0,0.9);
                             line-height:1.6;font-family:Arial,sans-serif;">
                    ⏱ &nbsp;This link expires in <strong>15 minutes</strong>.
                    If it expires, request a new one from the sign-in page.
                  </p>
                </td>
              </tr>
            </table>

            <!-- Fallback URL -->
            <p style="margin:0 0 6px;font-size:12px;color:rgba(255,255,255,0.25);
                      line-height:1.6;text-align:center;font-family:Arial,sans-serif;">
              Button not working? Copy and paste this link into your browser:
            </p>
            <p style="margin:0 0 32px;font-size:11px;color:rgba(0,209,255,0.6);
                      word-break:break-all;line-height:1.6;text-align:center;
                      font-family:Arial,sans-serif;">
              {verify_link}
            </p>
          </td>
        </tr>

        <!-- Divider -->
        <tr>
          <td style="padding:0 40px;">
            <div style="height:1px;background:rgba(255,255,255,0.05);font-size:0;">&nbsp;</div>
          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="padding:24px 40px 32px;text-align:center;">
            <p style="margin:0 0 6px;font-size:11px;color:rgba(255,255,255,0.2);
                      line-height:1.6;font-family:Arial,sans-serif;">
              If you didn't create a VOXLY account, you can safely ignore this email.
            </p>
            <p style="margin:0;font-size:11px;color:rgba(255,255,255,0.12);
                      line-height:1.6;font-family:Arial,sans-serif;">
              © 2026 VOXLY — Voice Powered Interview Intelligence
            </p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>
"""
    _send(to_email, "Verify your VOXLY email", html)


# ── Password Reset ────────────────────────────────────────────────────
def send_reset_email(to_email: str, token: str):
    reset_link = f"http://localhost:5173/reset-password?token={token}"

    html = f"""
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1.0"/>
  <title>Reset your VOXLY password</title>
</head>
<body style="margin:0;padding:0;background:#04040a;font-family:Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" border="0"
         style="background:#04040a;padding:48px 16px;">
    <tr><td align="center">
      <table width="520" cellpadding="0" cellspacing="0" border="0"
             style="background:#0d0d18;border:1px solid rgba(255,255,255,0.07);
                    border-radius:20px;overflow:hidden;max-width:520px;">

        <!-- Accent bar — amber/pink to distinguish from verify email -->
        <tr>
          <td style="height:4px;
                     background:linear-gradient(90deg,#FFB800,#FF2FB3,#7B3FF2);
                     font-size:0;line-height:0;">&nbsp;</td>
        </tr>

        <!-- Logo -->
        <tr>
          <td align="center" style="padding:36px 40px 28px;">
            {_logo_html()}
          </td>
        </tr>

        <!-- Divider -->
        <tr>
          <td style="padding:0 40px;">
            <div style="height:1px;background:rgba(255,255,255,0.06);font-size:0;">&nbsp;</div>
          </td>
        </tr>

        <!-- Body -->
        <tr>
          <td style="padding:36px 40px 12px;">
            <p style="text-align:center;font-size:36px;margin:0 0 16px;line-height:1;">🔐</p>
            <p style="margin:0 0 8px;font-size:22px;font-weight:700;color:#ffffff;
                      line-height:1.3;text-align:center;font-family:Arial,sans-serif;">
              Reset your password
            </p>
            <p style="margin:0 0 28px;font-size:14px;color:rgba(255,255,255,0.45);
                      line-height:1.7;text-align:center;font-family:Arial,sans-serif;">
              We received a request to reset the password for your VOXLY account.
              Click the button below to choose a new password.
            </p>

            <!-- CTA Button -->
            <table cellpadding="0" cellspacing="0" border="0" style="margin:0 auto 28px auto;">
              <tr>
                <td align="center"
                    style="background:linear-gradient(135deg,#FFB800,#FF2FB3);
                           border-radius:12px;">
                  <a href="{reset_link}"
                     style="display:inline-block;padding:14px 40px;font-size:14px;
                            font-weight:700;color:#ffffff;text-decoration:none;
                            font-family:Arial,sans-serif;white-space:nowrap;">
                    🔑 &nbsp;Reset Password
                  </a>
                </td>
              </tr>
            </table>

            <!-- Expiry notice -->
            <table cellpadding="0" cellspacing="0" border="0"
                   style="background:rgba(255,184,0,0.06);
                          border:1px solid rgba(255,184,0,0.25);
                          border-radius:10px;margin-bottom:28px;width:100%;">
              <tr>
                <td style="padding:12px 16px;text-align:center;">
                  <p style="margin:0;font-size:12px;color:rgba(255,184,0,0.9);
                             line-height:1.6;font-family:Arial,sans-serif;">
                    ⏱ &nbsp;This link expires in <strong>15 minutes</strong>.
                    If you didn't request this, you can safely ignore this email.
                  </p>
                </td>
              </tr>
            </table>

            <!-- Fallback URL -->
            <p style="margin:0 0 6px;font-size:12px;color:rgba(255,255,255,0.25);
                      line-height:1.6;text-align:center;font-family:Arial,sans-serif;">
              Button not working? Copy and paste this link:
            </p>
            <p style="margin:0 0 32px;font-size:11px;color:rgba(255,184,0,0.6);
                      word-break:break-all;line-height:1.6;text-align:center;
                      font-family:Arial,sans-serif;">
              {reset_link}
            </p>
          </td>
        </tr>

        <!-- Divider -->
        <tr>
          <td style="padding:0 40px;">
            <div style="height:1px;background:rgba(255,255,255,0.05);font-size:0;">&nbsp;</div>
          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="padding:24px 40px 32px;text-align:center;">
            <p style="margin:0 0 6px;font-size:11px;color:rgba(255,255,255,0.2);
                      line-height:1.6;font-family:Arial,sans-serif;">
              If you didn't request a password reset, no action is needed.
              Your password will remain unchanged.
            </p>
            <p style="margin:0;font-size:11px;color:rgba(255,255,255,0.12);
                      line-height:1.6;font-family:Arial,sans-serif;">
              © 2026 VOXLY — Voice Powered Interview Intelligence
            </p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>
"""
    _send(to_email, "Reset your VOXLY password", html)