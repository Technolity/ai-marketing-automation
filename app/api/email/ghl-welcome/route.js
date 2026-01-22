/**
 * GHL Welcome Email Template
 * TedOS branded email for new GHL Builder access
 */

import { NextResponse } from 'next/server';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(req) {
    try {
        const { to, firstName } = await req.json();

        if (!to || !firstName) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        console.log('[GHL Welcome Email] Sending to:', to);

        const { data, error } = await resend.emails.send({
            from: 'TedOS <noreply@tedos.ai>',
            to: [to],
            subject: 'Your TedOS Builder Access is Ready! 🚀',
            html: generateEmailHTML(firstName),
        });

        if (error) {
            console.error('[GHL Welcome Email] Error:', error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        console.log('[GHL Welcome Email] Sent successfully:', data.id);
        return NextResponse.json({ success: true, id: data.id });

    } catch (error) {
        console.error('[GHL Welcome Email] Exception:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

function generateEmailHTML(firstName) {
    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Your TedOS Builder Access</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #0a0a0b;">
  <table role="presentation" style="width: 100%; border-collapse: collapse;">
    <tr>
      <td align="center" style="padding: 40px 0;">
        <table role="presentation" style="width: 600px; max-width: 100%; border-collapse: collapse; background: linear-gradient(135deg, #1A1A1C 0%, #0F0F10 100%); border-radius: 16px; overflow: hidden; border: 1px solid #2D2D30;">
          
          <!-- Header -->
          <tr>
            <td style="padding: 40px 40px 20px; text-align: center; background: linear-gradient(135deg, rgba(0, 229, 255, 0.1) 0%, rgba(59, 130, 246, 0.05) 100%);">
              <h1 style="margin: 0; color: #00E5FF; font-size: 32px; font-weight: 700; text-shadow: 0 0 20px rgba(0, 229, 255, 0.3);">
                🚀 Welcome to TedOS Builder!
              </h1>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding: 40px;">
              <p style="margin: 0 0 20px; color: #FFFFFF; font-size: 16px; line-height: 1.6;">
                Hi <strong style="color: #00E5FF;">${firstName}</strong>,
              </p>

              <p style="margin: 0 0 20px; color: #FFFFFF; font-size: 16px; line-height: 1.6;">
                Great news! Your <strong>TedOS Builder account</strong> has been set up successfully.
              </p>

              <div style="background: rgba(0, 229, 255, 0.1); border-left: 4px solid #00E5FF; padding: 20px; margin: 30px 0; border-radius: 8px;">
                <p style="margin: 0 0 15px; color: #FFFFFF; font-size: 15px; font-weight: 600;">
                  📧 You'll receive a separate email to set your password
                </p>
                <p style="margin: 0; color: #A0A0A5; font-size: 14px; line-height: 1.5;">
                  Look for an email with the subject "Set Your Password" - this comes directly from our system. Click the link in that email to create your secure password.
                </p>
              </div>

              <p style="margin: 0 0 20px; color: #FFFFFF; font-size: 16px; line-height: 1.6;">
                Once you've set your password, you can log in at:
              </p>

              <div style="text-align: center; margin: 30px 0;">
                <a href="https://app.tedos.ai" style="display: inline-block; background: linear-gradient(135deg, #00E5FF 0%, #00B8D4 100%); color: #000000; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 700; font-size: 16px; box-shadow: 0 4px 12px rgba(0, 229, 255, 0.3);">
                  Launch TedOS Builder →
                </a>
              </div>

              <div style="background: #1A1A1C; border: 1px solid #2D2D30; border-radius: 8px; padding: 20px; margin: 30px 0;">
                <h3 style="margin: 0 0 15px; color: #00E5FF; font-size: 18px; font-weight: 600;">
                  ✅ What You Can Do:
                </h3>
                <ul style="margin: 0; padding-left: 20px; color: #FFFFFF; font-size: 14px; line-height: 1.8;">
                  <li>Manage your leads & contacts</li>
                  <li>View your calendar & appointments</li>
                  <li>Track your sales pipeline</li>
                  <li>Configure your CRM settings</li>
                  <li>Access all your marketing automation tools</li>
                </ul>
              </div>

              <p style="margin: 0 0 10px; color: #A0A0A5; font-size: 14px; line-height: 1.6;">
                Need help getting started? Our support team is here for you.
              </p>

              <p style="margin: 0; color: #FFFFFF; font-size: 16px; line-height: 1.6;">
                Best,<br>
                <strong style="color: #00E5FF;">The TedOS Team</strong>
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 30px 40px; text-align: center; border-top: 1px solid #2D2D30; background: rgba(0, 0, 0, 0.3);">
              <p style="margin: 0 0 10px; color: #A0A0A5; font-size: 12px;">
                © ${new Date().getFullYear()} TedOS. All rights reserved.
              </p>
              <p style="margin: 0; color: #6B7280; font-size: 11px;">
                This email was sent because a TedOS Builder account was created for you.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;
}
