"""
Email Service — SMTP
Sends emails with collage PNG attachment via SMTP
"""

import os
import smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from email.mime.image import MIMEImage
from typing import List, Dict


class EmailService:
    """Handles sending emails with collage attachments via SMTP"""

    def __init__(self):
        self.host = os.getenv('SMTP_HOST', 'smtp.yandex.ru')
        self.port = int(os.getenv('SMTP_PORT', '587'))
        self.user = os.getenv('SMTP_USER', '')
        self.password = os.getenv('SMTP_PASSWORD', '')
        self.from_addr = os.getenv('SMTP_FROM', 'hello@seletti.ru')
        self.from_name = os.getenv('SMTP_FROM_NAME', 'Seletti Russia')
        self.use_tls = os.getenv('SMTP_USE_TLS', 'true').lower() in ('true', '1', 'yes')

        if self.is_configured():
            print("Email service configured (SMTP)")
        else:
            print("Warning: SMTP not fully configured — email sending disabled")

    def is_configured(self) -> bool:
        """Check if all required SMTP settings are present"""
        return bool(self.host and self.port and self.user and self.password)

    def _build_message(self, to_email: str, image_bytes: bytes, customer_type: str = '') -> MIMEMultipart:
        """Build MIME message with HTML body and PNG attachment"""
        msg = MIMEMultipart('mixed')
        msg['From'] = f"{self.from_name} <{self.from_addr}>"
        msg['To'] = to_email
        msg['Subject'] = 'Ваш гибрид от Seletti'

        # HTML body
        html = f"""\
<html>
<body style="font-family: Arial, sans-serif; color: #333;">
  <h2>Спасибо за участие!</h2>
  <p>Ваш уникальный гибрид от <strong>Seletti</strong> готов.</p>
  <p>Изображение прикреплено к этому письму.</p>
  <br>
  <p style="color: #888; font-size: 12px;">Seletti Russia</p>
</body>
</html>"""
        msg.attach(MIMEText(html, 'html', 'utf-8'))

        # PNG attachment
        img_part = MIMEImage(image_bytes, _subtype='png')
        img_part.add_header('Content-Disposition', 'attachment', filename='seletti-hybrid.png')
        msg.attach(img_part)

        return msg

    def send_email(self, to_email: str, image_bytes: bytes, customer_type: str = '') -> Dict:
        """Send a single email with PNG attachment. Returns {success, message}."""
        if not self.is_configured():
            return {'success': False, 'message': 'SMTP не настроен. Обратитесь к администратору.'}

        try:
            msg = self._build_message(to_email, image_bytes, customer_type)

            if self.use_tls:
                server = smtplib.SMTP(self.host, self.port, timeout=30)
                server.starttls()
            else:
                server = smtplib.SMTP_SSL(self.host, self.port, timeout=30)

            server.login(self.user, self.password)
            server.sendmail(self.from_addr, [to_email], msg.as_string())
            server.quit()

            print(f"Email sent to {to_email}")
            return {'success': True, 'message': 'Письмо отправлено'}
        except smtplib.SMTPAuthenticationError:
            print(f"SMTP auth error for {to_email}")
            return {'success': False, 'message': 'Ошибка авторизации SMTP. Проверьте логин и пароль.'}
        except Exception as e:
            print(f"Failed to send email to {to_email}: {e}")
            return {'success': False, 'message': f'Ошибка отправки: {e}'}

    def send_to_multiple(self, recipients: List[Dict], image_bytes: bytes) -> List[Dict]:
        """
        Send email to multiple recipients.
        recipients: [{email, customerType}, ...]
        Returns: [{email, success, message}, ...]
        """
        results = []
        for r in recipients:
            email = r.get('email', '')
            customer_type = r.get('customerType', '')
            result = self.send_email(email, image_bytes, customer_type)
            results.append({
                'email': email,
                'success': result['success'],
                'message': result['message']
            })
        return results


# Global singleton
email_service = EmailService()
