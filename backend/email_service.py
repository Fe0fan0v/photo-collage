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
        self.host = os.getenv('SMTP_HOST', 'smtp.mail.ru')
        self.port = int(os.getenv('SMTP_PORT', '465'))
        self.user = os.getenv('SMTP_USER', 'hello@seletti.ru')
        self.password = os.getenv('SMTP_PASSWORD', '')
        self.from_addr = os.getenv('SMTP_FROM', 'hello@seletti.ru')
        self.from_name = os.getenv('SMTP_FROM_NAME', 'Seletti Russia')
        self.use_tls = os.getenv('SMTP_USE_TLS', 'false').lower() in ('true', '1', 'yes')
        self.manager_email = os.getenv('MANAGER_EMAIL', 'hybrid@de-light.ru')

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

    def _build_manager_message(self, image_bytes: bytes, recipients: List[Dict],
                               collage_info: Dict = None) -> MIMEMultipart:
        """Build MIME message for manager with collage info and recipient data"""
        msg = MIMEMultipart('mixed')
        msg['From'] = f"{self.from_name} <{self.from_addr}>"
        msg['To'] = self.manager_email
        msg['Subject'] = 'Новый коллаж — Seletti Hybrid'

        # Build recipients info
        recipients_html = ''
        for i, r in enumerate(recipients, 1):
            email = r.get('email', '—')
            ctype = r.get('customerType', '—')
            recipients_html += f'<tr><td style="padding:4px 8px;">{i}</td><td style="padding:4px 8px;">{email}</td><td style="padding:4px 8px;">{ctype}</td></tr>'

        # Collage info
        collage_id = collage_info.get('collageId', '—') if collage_info else '—'
        collage_url = collage_info.get('url', '—') if collage_info else '—'
        datetime_str = collage_info.get('datetime', '—') if collage_info else '—'

        html = f"""\
<html>
<body style="font-family: Arial, sans-serif; color: #333;">
  <h2>Новый коллаж создан</h2>
  <table style="border-collapse: collapse; margin-bottom: 16px;">
    <tr><td style="padding:4px 8px;font-weight:bold;">ID коллажа:</td><td style="padding:4px 8px;">{collage_id}</td></tr>
    <tr><td style="padding:4px 8px;font-weight:bold;">Дата и время:</td><td style="padding:4px 8px;">{datetime_str}</td></tr>
    <tr><td style="padding:4px 8px;font-weight:bold;">Ссылка:</td><td style="padding:4px 8px;"><a href="{collage_url}">{collage_url}</a></td></tr>
  </table>
  <h3>Получатели:</h3>
  <table style="border-collapse: collapse; border: 1px solid #ccc;">
    <tr style="background: #f0f0f0;">
      <th style="padding:4px 8px; border: 1px solid #ccc;">№</th>
      <th style="padding:4px 8px; border: 1px solid #ccc;">Email</th>
      <th style="padding:4px 8px; border: 1px solid #ccc;">Тип клиента</th>
    </tr>
    {recipients_html}
  </table>
  <br>
  <p>Коллаж прикреплён к письму.</p>
  <p style="color: #888; font-size: 12px;">Seletti Russia — автоматическое уведомление</p>
</body>
</html>"""
        msg.attach(MIMEText(html, 'html', 'utf-8'))

        # PNG attachment
        img_part = MIMEImage(image_bytes, _subtype='png')
        img_part.add_header('Content-Disposition', 'attachment', filename='seletti-hybrid.png')
        msg.attach(img_part)

        return msg

    def send_manager_notification(self, image_bytes: bytes, recipients: List[Dict],
                                   collage_info: Dict = None) -> Dict:
        """Send notification to manager email with collage and all data"""
        if not self.is_configured() or not self.manager_email:
            return {'success': False, 'message': 'Manager email not configured'}

        try:
            msg = self._build_manager_message(image_bytes, recipients, collage_info)

            if self.use_tls:
                server = smtplib.SMTP(self.host, self.port, timeout=30)
                server.starttls()
            else:
                server = smtplib.SMTP_SSL(self.host, self.port, timeout=30)

            server.login(self.user, self.password)
            server.sendmail(self.from_addr, [self.manager_email], msg.as_string())
            server.quit()

            print(f"Manager notification sent to {self.manager_email}")
            return {'success': True, 'message': 'Уведомление менеджеру отправлено'}
        except Exception as e:
            print(f"Failed to send manager notification: {e}")
            return {'success': False, 'message': f'Ошибка отправки менеджеру: {e}'}

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
