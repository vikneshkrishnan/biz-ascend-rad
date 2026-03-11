#!/usr/bin/env python3
"""
Email Service for Biz Ascend RAD
Uses Resend API for transactional emails
"""

import os
import json
import sys
import asyncio
import resend
from dotenv import load_dotenv

load_dotenv()

# Configuration
RESEND_API_KEY = os.environ.get('RESEND_API_KEY', '')
SENDER_EMAIL = os.environ.get('SENDER_EMAIL', 'onboarding@resend.dev')

# Initialize Resend
if RESEND_API_KEY:
    resend.api_key = RESEND_API_KEY

def get_report_email_html(company_name, rad_score, maturity_band, report_url):
    """Generate HTML for report completion email"""
    band_color = '#22c55e' if 'Strong' in maturity_band else '#f59e0b' if 'Developing' in maturity_band else '#f97316'
    
    return f'''
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f9fafb;">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
            <tr>
                <td>
                    <!-- Header -->
                    <table width="100%" cellpadding="0" cellspacing="0" style="background: #000; border-radius: 12px 12px 0 0; padding: 24px;">
                        <tr>
                            <td align="center">
                                <div style="width: 48px; height: 48px; background: #f97316; border-radius: 12px; display: inline-block; text-align: center; line-height: 48px;">
                                    <span style="color: white; font-size: 24px;">⚡</span>
                                </div>
                                <h1 style="color: white; margin: 16px 0 0; font-size: 24px;">Biz Ascend RAD™</h1>
                                <p style="color: #9ca3af; margin: 8px 0 0; font-size: 14px;">Revenue Acceleration Diagnostic</p>
                            </td>
                        </tr>
                    </table>
                    
                    <!-- Content -->
                    <table width="100%" cellpadding="0" cellspacing="0" style="background: white; padding: 32px; border-left: 1px solid #e5e7eb; border-right: 1px solid #e5e7eb;">
                        <tr>
                            <td>
                                <h2 style="color: #1f2937; margin: 0 0 16px; font-size: 20px;">Your Diagnostic Report is Ready</h2>
                                <p style="color: #6b7280; margin: 0 0 24px; line-height: 1.6;">
                                    The diagnostic assessment for <strong style="color: #1f2937;">{company_name}</strong> has been completed and your AI-generated report is now available.
                                </p>
                                
                                <!-- Score Card -->
                                <table width="100%" cellpadding="0" cellspacing="0" style="background: #fff7ed; border-radius: 12px; padding: 24px; margin-bottom: 24px; border-top: 4px solid {band_color};">
                                    <tr>
                                        <td align="center">
                                            <p style="color: #6b7280; margin: 0; font-size: 14px;">RAD Growth System Score</p>
                                            <p style="color: #f97316; margin: 8px 0; font-size: 48px; font-weight: 700;">{rad_score}</p>
                                            <span style="background: {band_color}; color: white; padding: 8px 20px; border-radius: 20px; font-size: 14px; font-weight: 600;">
                                                {maturity_band}
                                            </span>
                                        </td>
                                    </tr>
                                </table>
                                
                                <!-- CTA Button -->
                                <table width="100%" cellpadding="0" cellspacing="0">
                                    <tr>
                                        <td align="center">
                                            <a href="{report_url}" style="display: inline-block; background: #f97316; color: white; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 16px;">
                                                View Full Report
                                            </a>
                                        </td>
                                    </tr>
                                </table>
                            </td>
                        </tr>
                    </table>
                    
                    <!-- Footer -->
                    <table width="100%" cellpadding="0" cellspacing="0" style="background: #f9fafb; border-radius: 0 0 12px 12px; padding: 24px; border: 1px solid #e5e7eb; border-top: none;">
                        <tr>
                            <td align="center">
                                <p style="color: #9ca3af; margin: 0; font-size: 12px;">
                                    This is an automated notification from Biz Ascend RAD™.
                                    <br>© 2025 Biz Ascend. All rights reserved.
                                </p>
                            </td>
                        </tr>
                    </table>
                </td>
            </tr>
        </table>
    </body>
    </html>
    '''

def get_password_reset_email_html(reset_url):
    """Generate HTML for password reset email"""
    return f'''
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f9fafb;">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
            <tr>
                <td>
                    <!-- Header -->
                    <table width="100%" cellpadding="0" cellspacing="0" style="background: #000; border-radius: 12px 12px 0 0; padding: 24px;">
                        <tr>
                            <td align="center">
                                <div style="width: 48px; height: 48px; background: #f97316; border-radius: 12px; display: inline-block; text-align: center; line-height: 48px;">
                                    <span style="color: white; font-size: 24px;">⚡</span>
                                </div>
                                <h1 style="color: white; margin: 16px 0 0; font-size: 24px;">Biz Ascend RAD™</h1>
                            </td>
                        </tr>
                    </table>
                    
                    <!-- Content -->
                    <table width="100%" cellpadding="0" cellspacing="0" style="background: white; padding: 32px; border-left: 1px solid #e5e7eb; border-right: 1px solid #e5e7eb;">
                        <tr>
                            <td>
                                <h2 style="color: #1f2937; margin: 0 0 16px; font-size: 20px;">Reset Your Password</h2>
                                <p style="color: #6b7280; margin: 0 0 24px; line-height: 1.6;">
                                    We received a request to reset your password. Click the button below to create a new password. This link will expire in 1 hour.
                                </p>
                                
                                <!-- CTA Button -->
                                <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 24px;">
                                    <tr>
                                        <td align="center">
                                            <a href="{reset_url}" style="display: inline-block; background: #f97316; color: white; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 16px;">
                                                Reset Password
                                            </a>
                                        </td>
                                    </tr>
                                </table>
                                
                                <p style="color: #9ca3af; margin: 0; font-size: 13px; line-height: 1.6;">
                                    If you didn't request this password reset, you can safely ignore this email. Your password will remain unchanged.
                                </p>
                            </td>
                        </tr>
                    </table>
                    
                    <!-- Footer -->
                    <table width="100%" cellpadding="0" cellspacing="0" style="background: #f9fafb; border-radius: 0 0 12px 12px; padding: 24px; border: 1px solid #e5e7eb; border-top: none;">
                        <tr>
                            <td align="center">
                                <p style="color: #9ca3af; margin: 0; font-size: 12px;">
                                    This is an automated notification from Biz Ascend RAD™.
                                    <br>© 2025 Biz Ascend. All rights reserved.
                                </p>
                            </td>
                        </tr>
                    </table>
                </td>
            </tr>
        </table>
    </body>
    </html>
    '''

async def send_email_async(to_email, subject, html_content):
    """Send email asynchronously"""
    if not RESEND_API_KEY:
        return {'success': False, 'error': 'RESEND_API_KEY not configured'}
    
    params = {
        "from": SENDER_EMAIL,
        "to": [to_email],
        "subject": subject,
        "html": html_content
    }
    
    try:
        # Run sync SDK in thread to keep non-blocking
        email = await asyncio.to_thread(resend.Emails.send, params)
        return {'success': True, 'email_id': email.get('id')}
    except Exception as e:
        return {'success': False, 'error': str(e)}

def send_report_notification(to_email, company_name, rad_score, maturity_band, report_url):
    """Send report completion notification"""
    html = get_report_email_html(company_name, rad_score, maturity_band, report_url)
    return asyncio.run(send_email_async(
        to_email,
        f"Your RAD Report for {company_name} is Ready",
        html
    ))

def send_password_reset(to_email, reset_url):
    """Send password reset email"""
    html = get_password_reset_email_html(reset_url)
    return asyncio.run(send_email_async(
        to_email,
        "Reset Your Biz Ascend RAD™ Password",
        html
    ))

def get_pdf_report_email_html(company_name, rad_score, maturity_band, consultant_name, message):
    """Generate HTML for email with PDF attachment"""
    band_color = '#22c55e' if 'Strong' in maturity_band else '#f59e0b' if 'Developing' in maturity_band else '#f97316'
    custom_message = f'<div style="background: #f0fdf4; padding: 16px; border-radius: 8px; margin: 16px 0; border-left: 4px solid #22c55e;"><p style="margin: 0; color: #166534; font-style: italic;">"{message}"</p><p style="margin: 8px 0 0; color: #6b7280; font-size: 13px;">— {consultant_name}</p></div>' if message else ''
    
    return f'''
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f9fafb;">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
            <tr>
                <td>
                    <!-- Header -->
                    <table width="100%" cellpadding="0" cellspacing="0" style="background: #000; border-radius: 12px 12px 0 0; padding: 24px;">
                        <tr>
                            <td align="center">
                                <div style="width: 48px; height: 48px; background: #f97316; border-radius: 12px; display: inline-block; text-align: center; line-height: 48px;">
                                    <span style="color: white; font-size: 24px;">⚡</span>
                                </div>
                                <h1 style="color: white; margin: 16px 0 0; font-size: 24px;">Biz Ascend RAD™</h1>
                                <p style="color: #9ca3af; margin: 8px 0 0; font-size: 14px;">Revenue Acceleration Diagnostic Report</p>
                            </td>
                        </tr>
                    </table>
                    
                    <!-- Content -->
                    <table width="100%" cellpadding="0" cellspacing="0" style="background: white; padding: 32px; border-left: 1px solid #e5e7eb; border-right: 1px solid #e5e7eb;">
                        <tr>
                            <td>
                                <h2 style="color: #1f2937; margin: 0 0 16px; font-size: 20px;">Your Diagnostic Report for {company_name}</h2>
                                <p style="color: #6b7280; margin: 0 0 24px; line-height: 1.6;">
                                    Please find attached your comprehensive Revenue Acceleration Diagnostic report. This AI-powered analysis provides insights into your growth systems and actionable recommendations.
                                </p>
                                
                                {custom_message}
                                
                                <!-- Score Card -->
                                <table width="100%" cellpadding="0" cellspacing="0" style="background: #fff7ed; border-radius: 12px; padding: 24px; margin-bottom: 24px; border-top: 4px solid {band_color};">
                                    <tr>
                                        <td align="center">
                                            <p style="color: #6b7280; margin: 0; font-size: 14px;">RAD Growth System Score</p>
                                            <p style="color: #f97316; margin: 8px 0; font-size: 48px; font-weight: 700;">{rad_score}</p>
                                            <span style="background: {band_color}; color: white; padding: 8px 20px; border-radius: 20px; font-size: 14px; font-weight: 600;">
                                                {maturity_band}
                                            </span>
                                        </td>
                                    </tr>
                                </table>
                                
                                <p style="color: #6b7280; margin: 0; font-size: 14px; line-height: 1.6;">
                                    <strong>What's in your report:</strong>
                                </p>
                                <ul style="color: #6b7280; font-size: 14px; margin: 12px 0 24px; padding-left: 20px; line-height: 1.8;">
                                    <li>Executive Summary with key findings</li>
                                    <li>Pillar-by-pillar diagnostic analysis</li>
                                    <li>Revenue Achievement Probability (RAPS) assessment</li>
                                    <li>30-60-90 day action plan</li>
                                    <li>Market opportunity analysis</li>
                                </ul>
                                
                                <p style="color: #9ca3af; font-size: 13px; margin: 24px 0 0; padding-top: 16px; border-top: 1px solid #e5e7eb;">
                                    📎 The PDF report is attached to this email.
                                </p>
                            </td>
                        </tr>
                    </table>
                    
                    <!-- Footer -->
                    <table width="100%" cellpadding="0" cellspacing="0" style="background: #f9fafb; border-radius: 0 0 12px 12px; padding: 24px; border: 1px solid #e5e7eb; border-top: none;">
                        <tr>
                            <td align="center">
                                <p style="color: #9ca3af; margin: 0; font-size: 12px;">
                                    This report was sent by {consultant_name} via Biz Ascend RAD™.
                                    <br>© 2025 Biz Ascend. All rights reserved.
                                </p>
                            </td>
                        </tr>
                    </table>
                </td>
            </tr>
        </table>
    </body>
    </html>
    '''

async def send_email_with_attachment_async(to_email, subject, html_content, attachment_name, attachment_content):
    """Send email with PDF attachment"""
    if not RESEND_API_KEY:
        return {'success': False, 'error': 'RESEND_API_KEY not configured'}
    
    import base64
    
    params = {
        "from": SENDER_EMAIL,
        "to": [to_email],
        "subject": subject,
        "html": html_content,
        "attachments": [
            {
                "filename": attachment_name,
                "content": attachment_content  # Already base64 encoded
            }
        ]
    }
    
    try:
        email = await asyncio.to_thread(resend.Emails.send, params)
        return {'success': True, 'email_id': email.get('id')}
    except Exception as e:
        return {'success': False, 'error': str(e)}

def send_pdf_report(to_email, company_name, rad_score, maturity_band, consultant_name, message, pdf_base64, filename):
    """Send PDF report via email"""
    html = get_pdf_report_email_html(company_name, rad_score, maturity_band, consultant_name, message)
    return asyncio.run(send_email_with_attachment_async(
        to_email,
        f"Your RAD Diagnostic Report - {company_name}",
        html,
        filename,
        pdf_base64
    ))

def main():
    """Main function for CLI usage"""
    data = json.load(sys.stdin)
    email_type = data.get('type')
    
    if email_type == 'report_notification':
        result = send_report_notification(
            data['to_email'],
            data['company_name'],
            data['rad_score'],
            data['maturity_band'],
            data['report_url']
        )
    elif email_type == 'password_reset':
        result = send_password_reset(data['to_email'], data['reset_url'])
    elif email_type == 'pdf_report':
        result = send_pdf_report(
            data['to_email'],
            data['company_name'],
            data['rad_score'],
            data['maturity_band'],
            data['consultant_name'],
            data.get('message', ''),
            data['pdf_base64'],
            data['filename']
        )
    else:
        result = {'success': False, 'error': f'Unknown email type: {email_type}'}
    
    print(json.dumps(result))

if __name__ == '__main__':
    main()
