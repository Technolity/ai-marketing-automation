import { NextResponse } from 'next/server';
import { Resend } from 'resend';
import { supabase as supabaseAdmin } from '@/lib/supabaseServiceRole';

const TYPE_LABELS = { bug: 'Bug Report', feedback: 'Feedback', feature: 'Feature Request' };
const TYPE_COLORS = { bug: '#EF4444', feedback: '#00E5FF', feature: '#A78BFA' };

export async function POST(req) {
  try {
    const body = await req.json();
    const { email, type, description, images = [] } = body;

    // Validate
    if (!email || !type || !description) {
      return NextResponse.json({ error: 'Email, type, and description are required.' }, { status: 400 });
    }
    if (!['bug', 'feedback', 'feature'].includes(type)) {
      return NextResponse.json({ error: 'Invalid type.' }, { status: 400 });
    }
    if (description.length < 10) {
      return NextResponse.json({ error: 'Description too short.' }, { status: 400 });
    }
    if (images.length > 3) {
      return NextResponse.json({ error: 'Maximum 3 images allowed.' }, { status: 400 });
    }

    // Upload images to Supabase Storage
    const imageUrls = [];
    const reportId = crypto.randomUUID();

    for (let i = 0; i < images.length; i++) {
      const { name, data, mimeType } = images[i];
      try {
        const base64 = data.replace(/^data:[^;]+;base64,/, '');
        const buffer = Buffer.from(base64, 'base64');
        const ext = name.split('.').pop()?.toLowerCase() || 'jpg';
        const path = `${reportId}/${i + 1}.${ext}`;

        const { error: uploadError } = await supabaseAdmin.storage
          .from('feedback-images')
          .upload(path, buffer, { contentType: mimeType || 'image/jpeg', upsert: false });

        if (!uploadError) {
          const { data: urlData } = supabaseAdmin.storage
            .from('feedback-images')
            .getPublicUrl(path);
          imageUrls.push(urlData.publicUrl);
        }
      } catch (imgErr) {
        console.error('[Feedback] Image upload error:', imgErr);
      }
    }

    // Insert feedback record
    const { error: dbError } = await supabaseAdmin
      .from('feedback_reports')
      .insert({
        id: reportId,
        email: email.trim().toLowerCase(),
        type,
        description: description.trim(),
        image_urls: imageUrls,
        status: 'new',
      });

    if (dbError) {
      console.error('[Feedback] DB insert error:', dbError);
      return NextResponse.json({ error: 'Failed to save feedback.' }, { status: 500 });
    }

    // Notify all admins via email
    try {
      if (process.env.RESEND_API_KEY) {
        const { data: adminProfiles } = await supabaseAdmin
          .from('user_profiles')
          .select('email, full_name')
          .eq('is_admin', true);

        if (adminProfiles?.length > 0) {
          const resend = new Resend(process.env.RESEND_API_KEY);
          const adminEmails = adminProfiles.map((a) => a.email).filter(Boolean);

          await resend.emails.send({
            from: 'TedOS Feedback <noreply@tedos.ai>',
            to: adminEmails,
            subject: `[TedOS] New ${TYPE_LABELS[type]} from ${email}`,
            html: buildAdminEmailHTML({ email, type, description, imageUrls, reportId }),
          });
        }
      }
    } catch (emailErr) {
      console.error('[Feedback] Admin email error:', emailErr);
      // Don't fail the request if email fails
    }

    return NextResponse.json({ success: true, id: reportId });
  } catch (err) {
    console.error('[Feedback] Error:', err);
    return NextResponse.json({ error: 'Something went wrong.' }, { status: 500 });
  }
}

function buildAdminEmailHTML({ email, type, description, imageUrls, reportId }) {
  const typeLabel = TYPE_LABELS[type];
  const typeColor = TYPE_COLORS[type];
  const imagesSection = imageUrls.length > 0
    ? `<div style="margin: 24px 0;">
        <p style="margin: 0 0 12px; color: #A0A0A5; font-size: 13px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em;">
          ATTACHMENTS (${imageUrls.length})
        </p>
        <div style="display: flex; gap: 12px; flex-wrap: wrap;">
          ${imageUrls.map((url) => `
            <a href="${url}" target="_blank" style="display: block; border-radius: 8px; overflow: hidden; border: 1px solid #2D2D30;">
              <img src="${url}" alt="attachment" style="width: 120px; height: 80px; object-fit: cover; display: block;" />
            </a>
          `).join('')}
        </div>
      </div>`
    : '';

  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;background:#0a0a0b;">
  <table role="presentation" style="width:100%;border-collapse:collapse;">
    <tr>
      <td align="center" style="padding:40px 0;">
        <table role="presentation" style="width:600px;max-width:100%;border-collapse:collapse;background:#131316;border-radius:16px;overflow:hidden;border:1px solid #2D2D30;">
          <tr>
            <td style="padding:32px 40px 24px;background:linear-gradient(135deg,rgba(0,229,255,0.08) 0%,transparent 100%);">
              <div style="display:flex;align-items:center;gap:12px;margin-bottom:8px;">
                <div style="width:10px;height:10px;border-radius:50%;background:${typeColor};box-shadow:0 0 8px ${typeColor};"></div>
                <span style="color:${typeColor};font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:0.1em;">${typeLabel}</span>
              </div>
              <h1 style="margin:0;color:#F4F7FF;font-size:22px;font-weight:600;">New ${typeLabel} Submitted</h1>
            </td>
          </tr>
          <tr>
            <td style="padding:24px 40px 32px;">
              <div style="background:#0e0e0f;border:1px solid #2D2D30;border-radius:8px;padding:16px;margin-bottom:24px;">
                <p style="margin:0 0 4px;color:#6B7280;font-size:11px;text-transform:uppercase;letter-spacing:0.05em;">From</p>
                <p style="margin:0;color:#F4F7FF;font-size:15px;font-weight:500;">${email}</p>
              </div>
              <div style="margin-bottom:24px;">
                <p style="margin:0 0 10px;color:#A0A0A5;font-size:13px;font-weight:600;text-transform:uppercase;letter-spacing:0.05em;">Description</p>
                <div style="background:#0e0e0f;border:1px solid #2D2D30;border-radius:8px;padding:16px;">
                  <p style="margin:0;color:#E2E8F0;font-size:14px;line-height:1.7;white-space:pre-wrap;">${description.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</p>
                </div>
              </div>
              ${imagesSection}
              <div style="text-align:center;margin-top:32px;">
                <a href="https://tedos.ai/admin/feedback" style="display:inline-block;background:#00E5FF;color:#00031C;text-decoration:none;padding:12px 28px;border-radius:8px;font-weight:700;font-size:14px;">
                  View in Admin Panel →
                </a>
              </div>
              <p style="margin:24px 0 0;color:#4B5563;font-size:12px;text-align:center;">Report ID: ${reportId}</p>
            </td>
          </tr>
          <tr>
            <td style="padding:20px 40px;text-align:center;border-top:1px solid #2D2D30;">
              <p style="margin:0;color:#4B5563;font-size:11px;">© ${new Date().getFullYear()} TedOS. Admin notification — do not reply.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}
