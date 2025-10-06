import smtplib
import json
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from datetime import datetime, timedelta
from typing import Dict, List, Optional
import requests
from flask import current_app

from app.utils.logger import setup_logger
from app.models.user import User
from app.models.alerts import Alert

logger = setup_logger(__name__)


class NotificationService:
    """Production-ready notification service for air quality alerts."""
    
    def __init__(self):
        self.email_config = {}
        self.sms_config = {}
        self.push_config = {}
        self.notification_history = []
        
    def init_app(self, app):
        """Initialize notification service with Flask app configuration."""
        # Email configuration
        self.email_config = {
            'smtp_server': app.config.get('SMTP_SERVER', 'smtp.gmail.com'),
            'smtp_port': app.config.get('SMTP_PORT', 587),
            'smtp_username': app.config.get('SMTP_USERNAME', ''),
            'smtp_password': app.config.get('SMTP_PASSWORD', ''),
            'from_email': app.config.get('FROM_EMAIL', 'noreply@airquality.com'),
            'from_name': app.config.get('FROM_NAME', 'Air Quality Alert System')
        }
        
        # SMS configuration (Twilio, AWS SNS, etc.)
        self.sms_config = {
            'provider': app.config.get('SMS_PROVIDER', 'twilio'),
            'account_sid': app.config.get('TWILIO_ACCOUNT_SID', ''),
            'auth_token': app.config.get('TWILIO_AUTH_TOKEN', ''),
            'from_number': app.config.get('TWILIO_FROM_NUMBER', ''),
            'aws_access_key': app.config.get('AWS_ACCESS_KEY_ID', ''),
            'aws_secret_key': app.config.get('AWS_SECRET_ACCESS_KEY', ''),
            'aws_region': app.config.get('AWS_REGION', 'us-east-1')
        }
        
        # Push notification configuration
        self.push_config = {
            'fcm_server_key': app.config.get('FCM_SERVER_KEY', ''),
            'apns_key_id': app.config.get('APNS_KEY_ID', ''),
            'apns_team_id': app.config.get('APNS_TEAM_ID', ''),
            'apns_bundle_id': app.config.get('APNS_BUNDLE_ID', '')
        }
        
        logger.info("Notification service initialized")
    
    def send_alert_notification(self, alert: Alert, current_value: float, 
                              record_data: Dict = None) -> Dict:
        """Send notification for triggered alert via all configured methods."""
        try:
            # Get user information
            user = User.find_by_id(str(alert.user_id))
            if not user:
                logger.error(f"User not found for alert {alert._id}")
                return {'status': 'error', 'message': 'User not found'}
            
            # Prepare notification content
            notification_data = self._prepare_notification_content(
                alert, user, current_value, record_data
            )
            
            results = {}
            
            # Send notifications via configured methods
            for method in alert.notification_methods:
                if method == 'email':
                    results['email'] = self._send_email_notification(user, notification_data)
                elif method == 'sms':
                    results['sms'] = self._send_sms_notification(user, notification_data)
                elif method == 'push':
                    results['push'] = self._send_push_notification(user, notification_data)
                elif method == 'console':
                    results['console'] = self._send_console_notification(user, notification_data)
            
            # Log notification attempt
            self._log_notification(alert, user, current_value, results)
            
            return {
                'status': 'success',
                'alert_id': str(alert._id),
                'user_id': str(user._id),
                'methods_attempted': list(results.keys()),
                'results': results,
                'timestamp': datetime.utcnow().isoformat()
            }
            
        except Exception as e:
            logger.error(f"Error sending alert notification: {str(e)}")
            return {'status': 'error', 'message': str(e)}
    
    def _prepare_notification_content(self, alert: Alert, user: User, 
                                    current_value: float, record_data: Dict = None) -> Dict:
        """Prepare notification content for all channels."""
        location_str = "Unknown Location"
        if alert.location and 'lat' in alert.location and 'lon' in alert.location:
            location_str = f"({alert.location['lat']:.3f}, {alert.location['lon']:.3f})"
        
        # Determine severity level
        severity = self._determine_severity(current_value, alert.threshold)
        
        # Health recommendations based on pollutant and level
        health_advice = self._get_health_recommendations(alert.pollutant, current_value)
        
        return {
            'subject': f"🚨 Air Quality Alert: {alert.pollutant} Level {severity}",
            'user_name': user.name,
            'pollutant': alert.pollutant,
            'current_value': current_value,
            'threshold': alert.threshold,
            'severity': severity,
            'location': location_str,
            'timestamp': datetime.utcnow().strftime('%Y-%m-%d %H:%M:%S UTC'),
            'health_advice': health_advice,
            'record_source': record_data.get('source', 'Unknown') if record_data else 'Unknown'
        }
    
    def _send_email_notification(self, user: User, notification_data: Dict) -> Dict:
        """Send email notification."""
        try:
            if not self.email_config.get('smtp_username') or not self.email_config.get('smtp_password'):
                logger.warning("Email configuration incomplete, skipping email notification")
                return {'status': 'skipped', 'reason': 'Email not configured'}
            
            # Create email message
            msg = MIMEMultipart('alternative')
            msg['Subject'] = notification_data['subject']
            msg['From'] = f"{self.email_config['from_name']} <{self.email_config['from_email']}>"
            msg['To'] = user.email
            
            # HTML email template
            html_content = self._generate_email_html(notification_data)
            
            # Plain text version
            text_content = self._generate_email_text(notification_data)
            
            # Attach both versions
            msg.attach(MIMEText(text_content, 'plain'))
            msg.attach(MIMEText(html_content, 'html'))
            
            # Send email
            with smtplib.SMTP(self.email_config['smtp_server'], self.email_config['smtp_port']) as server:
                server.starttls()
                server.login(self.email_config['smtp_username'], self.email_config['smtp_password'])
                server.send_message(msg)
            
            logger.info(f"Email notification sent to {user.email}")
            return {'status': 'success', 'recipient': user.email}
            
        except Exception as e:
            logger.error(f"Error sending email notification: {str(e)}")
            return {'status': 'error', 'message': str(e)}
    
    def _send_sms_notification(self, user: User, notification_data: Dict) -> Dict:
        """Send SMS notification."""
        try:
            # Check if user has phone number
            phone_number = user.preferences.get('phone_number')
            if not phone_number:
                return {'status': 'skipped', 'reason': 'No phone number provided'}
            
            # Prepare SMS message
            sms_message = self._generate_sms_text(notification_data)
            
            # Send via configured provider
            if self.sms_config['provider'] == 'twilio':
                return self._send_twilio_sms(phone_number, sms_message)
            elif self.sms_config['provider'] == 'aws_sns':
                return self._send_aws_sns_sms(phone_number, sms_message)
            else:
                logger.warning("SMS provider not configured")
                return {'status': 'skipped', 'reason': 'SMS provider not configured'}
                
        except Exception as e:
            logger.error(f"Error sending SMS notification: {str(e)}")
            return {'status': 'error', 'message': str(e)}
    
    def _send_twilio_sms(self, phone_number: str, message: str) -> Dict:
        """Send SMS via Twilio."""
        try:
            from twilio.rest import Client
            
            if not self.sms_config.get('account_sid') or not self.sms_config.get('auth_token'):
                return {'status': 'skipped', 'reason': 'Twilio not configured'}
            
            client = Client(self.sms_config['account_sid'], self.sms_config['auth_token'])
            
            message = client.messages.create(
                body=message,
                from_=self.sms_config['from_number'],
                to=phone_number
            )
            
            logger.info(f"SMS sent via Twilio to {phone_number}")
            return {'status': 'success', 'recipient': phone_number, 'message_sid': message.sid}
            
        except Exception as e:
            logger.error(f"Error sending Twilio SMS: {str(e)}")
            return {'status': 'error', 'message': str(e)}
    
    def _send_aws_sns_sms(self, phone_number: str, message: str) -> Dict:
        """Send SMS via AWS SNS."""
        try:
            import boto3
            
            if not self.sms_config.get('aws_access_key') or not self.sms_config.get('aws_secret_key'):
                return {'status': 'skipped', 'reason': 'AWS SNS not configured'}
            
            sns = boto3.client(
                'sns',
                aws_access_key_id=self.sms_config['aws_access_key'],
                aws_secret_access_key=self.sms_config['aws_secret_key'],
                region_name=self.sms_config['aws_region']
            )
            
            response = sns.publish(
                PhoneNumber=phone_number,
                Message=message
            )
            
            logger.info(f"SMS sent via AWS SNS to {phone_number}")
            return {'status': 'success', 'recipient': phone_number, 'message_id': response['MessageId']}
            
        except Exception as e:
            logger.error(f"Error sending AWS SNS SMS: {str(e)}")
            return {'status': 'error', 'message': str(e)}
    
    def _send_push_notification(self, user: User, notification_data: Dict) -> Dict:
        """Send push notification."""
        try:
            # Get user's device tokens
            device_tokens = user.preferences.get('device_tokens', [])
            if not device_tokens:
                return {'status': 'skipped', 'reason': 'No device tokens registered'}
            
            # Prepare push notification payload
            payload = {
                'title': notification_data['subject'],
                'body': f"{notification_data['pollutant']}: {notification_data['current_value']} (Threshold: {notification_data['threshold']})",
                'data': {
                    'pollutant': notification_data['pollutant'],
                    'value': notification_data['current_value'],
                    'threshold': notification_data['threshold'],
                    'location': notification_data['location'],
                    'timestamp': notification_data['timestamp']
                }
            }
            
            # Send via FCM (Firebase Cloud Messaging)
            return self._send_fcm_notification(device_tokens, payload)
            
        except Exception as e:
            logger.error(f"Error sending push notification: {str(e)}")
            return {'status': 'error', 'message': str(e)}
    
    def _send_fcm_notification(self, device_tokens: List[str], payload: Dict) -> Dict:
        """Send push notification via Firebase Cloud Messaging."""
        try:
            if not self.push_config.get('fcm_server_key'):
                return {'status': 'skipped', 'reason': 'FCM not configured'}
            
            headers = {
                'Authorization': f"key={self.push_config['fcm_server_key']}",
                'Content-Type': 'application/json'
            }
            
            results = []
            for token in device_tokens:
                fcm_payload = {
                    'to': token,
                    'notification': {
                        'title': payload['title'],
                        'body': payload['body']
                    },
                    'data': payload['data']
                }
                
                response = requests.post(
                    'https://fcm.googleapis.com/fcm/send',
                    headers=headers,
                    json=fcm_payload,
                    timeout=10
                )
                
                results.append({
                    'token': token[:10] + '...',  # Partial token for logging
                    'status': 'success' if response.status_code == 200 else 'error',
                    'response': response.json() if response.status_code == 200 else response.text
                })
            
            logger.info(f"Push notifications sent to {len(device_tokens)} devices")
            return {'status': 'success', 'results': results}
            
        except Exception as e:
            logger.error(f"Error sending FCM notification: {str(e)}")
            return {'status': 'error', 'message': str(e)}
    
    def _send_console_notification(self, user: User, notification_data: Dict) -> Dict:
        """Send console notification (for development/testing)."""
        try:
            console_message = f"""
{'='*60}
🚨 AIR QUALITY ALERT NOTIFICATION 🚨
{'='*60}
User: {notification_data['user_name']} ({user.email})
Pollutant: {notification_data['pollutant']}
Current Level: {notification_data['current_value']}
Alert Threshold: {notification_data['threshold']}
Severity: {notification_data['severity']}
Location: {notification_data['location']}
Time: {notification_data['timestamp']}
Source: {notification_data['record_source']}

Health Advice:
{notification_data['health_advice']}
{'='*60}
            """
            
            print(console_message)
            logger.info(f"Console notification displayed for {user.email}")
            
            return {'status': 'success', 'recipient': user.email}
            
        except Exception as e:
            logger.error(f"Error sending console notification: {str(e)}")
            return {'status': 'error', 'message': str(e)}
    
    def _generate_email_html(self, data: Dict) -> str:
        """Generate HTML email template."""
        return f"""
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <title>Air Quality Alert</title>
            <style>
                body {{ font-family: Arial, sans-serif; margin: 0; padding: 20px; background-color: #f5f5f5; }}
                .container {{ max-width: 600px; margin: 0 auto; background-color: white; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }}
                .header {{ background-color: #e74c3c; color: white; padding: 20px; text-align: center; }}
                .content {{ padding: 30px; }}
                .alert-box {{ background-color: #fff3cd; border: 1px solid #ffeaa7; border-radius: 4px; padding: 15px; margin: 20px 0; }}
                .value {{ font-size: 24px; font-weight: bold; color: #e74c3c; }}
                .footer {{ background-color: #f8f9fa; padding: 20px; text-align: center; font-size: 12px; color: #666; }}
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>🚨 Air Quality Alert</h1>
                </div>
                <div class="content">
                    <p>Hello {data['user_name']},</p>
                    
                    <div class="alert-box">
                        <h3>Alert Details</h3>
                        <p><strong>Pollutant:</strong> {data['pollutant']}</p>
                        <p><strong>Current Level:</strong> <span class="value">{data['current_value']}</span></p>
                        <p><strong>Your Threshold:</strong> {data['threshold']}</p>
                        <p><strong>Severity:</strong> {data['severity']}</p>
                        <p><strong>Location:</strong> {data['location']}</p>
                        <p><strong>Time:</strong> {data['timestamp']}</p>
                    </div>
                    
                    <h3>Health Recommendations</h3>
                    <p>{data['health_advice']}</p>
                    
                    <p>Stay safe and monitor air quality conditions in your area.</p>
                </div>
                <div class="footer">
                    <p>Air Quality Alert System | Powered by NASA TEMPO & Ground Station Data</p>
                </div>
            </div>
        </body>
        </html>
        """
    
    def _generate_email_text(self, data: Dict) -> str:
        """Generate plain text email."""
        return f"""
Air Quality Alert

Hello {data['user_name']},

An air quality alert has been triggered for your location.

Alert Details:
- Pollutant: {data['pollutant']}
- Current Level: {data['current_value']}
- Your Threshold: {data['threshold']}
- Severity: {data['severity']}
- Location: {data['location']}
- Time: {data['timestamp']}

Health Recommendations:
{data['health_advice']}

Stay safe and monitor air quality conditions in your area.

---
Air Quality Alert System
Powered by NASA TEMPO & Ground Station Data
        """
    
    def _generate_sms_text(self, data: Dict) -> str:
        """Generate SMS message."""
        return f"🚨 Air Quality Alert: {data['pollutant']} level {data['current_value']} exceeds your threshold of {data['threshold']} at {data['location']}. {data['health_advice'][:100]}..."
    
    def _determine_severity(self, current_value: float, threshold: float) -> str:
        """Determine alert severity level."""
        ratio = current_value / threshold
        
        if ratio >= 2.0:
            return "CRITICAL"
        elif ratio >= 1.5:
            return "HIGH"
        elif ratio >= 1.2:
            return "MODERATE"
        else:
            return "LOW"
    
    def _get_health_recommendations(self, pollutant: str, value: float) -> str:
        """Get health recommendations based on pollutant and level."""
        recommendations = {
            'PM2.5': {
                'low': "Sensitive individuals should consider reducing outdoor activities.",
                'moderate': "Everyone should limit prolonged outdoor exertion.",
                'high': "Avoid outdoor activities. Keep windows closed and use air purifiers.",
                'critical': "Stay indoors. Seek medical attention if experiencing symptoms."
            },
            'NO2': {
                'low': "Sensitive individuals may experience minor respiratory symptoms.",
                'moderate': "Limit outdoor activities, especially near traffic.",
                'high': "Avoid outdoor exercise. People with asthma should stay indoors.",
                'critical': "Emergency conditions. Stay indoors and seek medical help if needed."
            },
            'O3': {
                'low': "Sensitive groups should reduce outdoor activities during peak hours.",
                'moderate': "Limit outdoor activities between 10 AM - 4 PM.",
                'high': "Avoid outdoor activities. Stay in air-conditioned spaces.",
                'critical': "Dangerous conditions. Stay indoors and seek medical attention."
            }
        }
        
        # Determine level based on common thresholds
        if pollutant == 'PM2.5':
            if value <= 35:
                level = 'low'
            elif value <= 55:
                level = 'moderate'
            elif value <= 150:
                level = 'high'
            else:
                level = 'critical'
        elif pollutant == 'NO2':
            if value <= 53:
                level = 'low'
            elif value <= 100:
                level = 'moderate'
            elif value <= 360:
                level = 'high'
            else:
                level = 'critical'
        elif pollutant == 'O3':
            if value <= 70:
                level = 'low'
            elif value <= 85:
                level = 'moderate'
            elif value <= 105:
                level = 'high'
            else:
                level = 'critical'
        else:
            return "Monitor air quality conditions and follow local health advisories."
        
        return recommendations.get(pollutant, {}).get(level, "Follow local health advisories.")
    
    def _log_notification(self, alert: Alert, user: User, current_value: float, results: Dict):
        """Log notification attempt for audit purposes."""
        log_entry = {
            'timestamp': datetime.utcnow().isoformat(),
            'alert_id': str(alert._id),
            'user_id': str(user._id),
            'user_email': user.email,
            'pollutant': alert.pollutant,
            'current_value': current_value,
            'threshold': alert.threshold,
            'methods': list(results.keys()),
            'results': results
        }
        
        self.notification_history.append(log_entry)
        
        # Keep only last 1000 notifications in memory
        if len(self.notification_history) > 1000:
            self.notification_history = self.notification_history[-1000:]
        
        logger.info(f"Notification logged for alert {alert._id}")
    
    def get_notification_history(self, user_id: str = None, limit: int = 50) -> List[Dict]:
        """Get notification history."""
        history = self.notification_history
        
        if user_id:
            history = [entry for entry in history if entry['user_id'] == user_id]
        
        return history[-limit:]
    
    def test_notification_channels(self, user: User) -> Dict:
        """Test all notification channels for a user."""
        test_data = {
            'subject': '🧪 Test Notification - Air Quality Alert System',
            'user_name': user.name,
            'pollutant': 'TEST',
            'current_value': 999,
            'threshold': 100,
            'severity': 'TEST',
            'location': 'Test Location',
            'timestamp': datetime.utcnow().strftime('%Y-%m-%d %H:%M:%S UTC'),
            'health_advice': 'This is a test notification to verify your alert settings.',
            'record_source': 'Test System'
        }
        
        results = {}
        
        # Test email
        results['email'] = self._send_email_notification(user, test_data)
        
        # Test SMS if phone number provided
        if user.preferences.get('phone_number'):
            results['sms'] = self._send_sms_notification(user, test_data)
        
        # Test push if device tokens provided
        if user.preferences.get('device_tokens'):
            results['push'] = self._send_push_notification(user, test_data)
        
        # Always test console
        results['console'] = self._send_console_notification(user, test_data)
        
        return {
            'status': 'success',
            'user_id': str(user._id),
            'test_results': results,
            'timestamp': datetime.utcnow().isoformat()
        }


# Global notification service instance
notification_service = NotificationService()
