// Vercel Serverless Function — /api/send-email
// This keeps the SendGrid API key server-side and out of the HTML

export default async function handler(req, res) {
  // Only allow POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY;
  if (!SENDGRID_API_KEY) {
    return res.status(500).json({ error: 'SendGrid API key not configured' });
  }

  const { type, data } = req.body;

  // Build email based on type
  let to, toName, subject, html, replyTo;

  const FROM_EMAIL = 'listings@pnwpetfinder.com';
  const FROM_NAME  = 'PNW Pet Finder';
  const SITE_URL   = 'https://pnw-pet-finder.vercel.app';

  const baseStyle = `
    <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#f5efe6;padding:20px">
      <div style="background:#1a2a3a;padding:24px;border-radius:8px 8px 0 0;text-align:center">
        <h1 style="color:#c8a96e;margin:0;font-size:24px">PNW Pet Finder</h1>
        <p style="color:rgba(255,255,255,0.7);margin:6px 0 0;font-size:13px">Pacific Northwest Pet Directory</p>
      </div>
      <div style="background:white;padding:32px;border-radius:0 0 8px 8px">
        BODY
        <hr style="border:none;border-top:1px solid #e0d8cc;margin:24px 0">
        <p style="color:#7a7060;font-size:12px;text-align:center">PNW Pet Finder · Great Escape Web & Business Services LLC · pnwpetfinder.com</p>
      </div>
    </div>`;

  if (type === 'confirmation') {
    // Listing confirmation email
    const { listing, sellerEmail, sellerName } = data;
    const planNames = {
      standard: 'Standard — 2 Weeks',
      extended: 'Extended — 4 Weeks',
      featured: 'Featured — 2 Weeks (Front Page)'
    };
    const planPrices = {
      standard: '$6.99',
      extended: '$11.99',
      featured: '$19.99'
    };
    to = sellerEmail;
    toName = sellerName;
    subject = '🐾 Your listing is live on PNW Pet Finder!';
    html = baseStyle.replace('BODY', `
      <h2 style="color:#1a2a3a;margin-top:0">Your listing is live! 🎉</h2>
      <p style="color:#4a5568">Hi ${sellerName},</p>
      <p style="color:#4a5568">Great news — <strong>${listing.title}</strong> is now live on PNW Pet Finder and visible to buyers across Washington, Idaho, and Oregon.</p>
      <div style="background:#f5efe6;border-radius:8px;padding:20px;margin:20px 0">
        <p style="margin:0 0 10px;color:#1a2a3a;font-weight:bold">Listing Details</p>
        <p style="margin:4px 0;color:#4a5568">📋 <strong>Title:</strong> ${listing.title}</p>
        <p style="margin:4px 0;color:#4a5568">📦 <strong>Plan:</strong> ${planNames[listing.plan] || listing.plan}</p>
        <p style="margin:4px 0;color:#4a5568">💳 <strong>Amount Paid:</strong> ${planPrices[listing.plan] || '—'}</p>
        <p style="margin:4px 0;color:#4a5568">📍 <strong>Location:</strong> ${listing.location}</p>
        <p style="margin:4px 0;color:#4a5568">📅 <strong>Expires:</strong> ${listing.expiryDate}</p>
      </div>
      <div style="text-align:center;margin:24px 0">
        <a href="${SITE_URL}" style="display:inline-block;background:#1a2a3a;color:white;padding:11px 22px;border-radius:6px;text-decoration:none;font-weight:bold;font-size:14px">View &amp; Edit Your Listing →</a>
      </div>
      <p style="color:#4a5568;font-size:14px">You will receive a reminder 7 days and 3 days before your listing expires.</p>
    `);

    // Also send an admin notification copy to Tyler with full listing info
    try {
      await fetch('https://api.sendgrid.com/v3/mail/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${SENDGRID_API_KEY}`
        },
        body: JSON.stringify({
          personalizations: [{ to: [{ email: 'tyler@greatescapewebservices.com', name: 'PNW Pet Finder Admin' }] }],
          from: { email: FROM_EMAIL, name: FROM_NAME },
          reply_to: { email: sellerEmail },
          subject: `🆕 New listing: ${listing.title} (${planPrices[listing.plan] || ''} ${listing.plan})`,
          content: [{ type: 'text/html', value: baseStyle.replace('BODY', `
            <h2 style="color:#1a2a3a;margin-top:0">New listing posted</h2>
            <p style="color:#4a5568">A new listing just went live and needs a quick review:</p>
            <div style="background:#f5efe6;border-radius:8px;padding:20px;margin:16px 0">
              <p style="margin:4px 0;color:#4a5568">📋 <strong>Title:</strong> ${listing.title}</p>
              <p style="margin:4px 0;color:#4a5568">📦 <strong>Plan:</strong> ${planNames[listing.plan] || listing.plan}</p>
              <p style="margin:4px 0;color:#4a5568">💳 <strong>Paid:</strong> ${planPrices[listing.plan] || '—'}</p>
              <p style="margin:4px 0;color:#4a5568">🐕 <strong>Breed:</strong> ${listing.breed || '—'}</p>
              <p style="margin:4px 0;color:#4a5568">🐾 <strong>Category:</strong> ${listing.species || '—'}</p>
              <p style="margin:4px 0;color:#4a5568">📅 <strong>Age:</strong> ${listing.age || '—'}</p>
              <p style="margin:4px 0;color:#4a5568">💰 <strong>Price:</strong> ${listing.price > 0 ? '$' + listing.price : 'Free / Rehoming'}</p>
              <p style="margin:4px 0;color:#4a5568">📍 <strong>Location:</strong> ${listing.location} (${listing.state || ''})</p>
              <p style="margin:4px 0;color:#4a5568">📅 <strong>Expires:</strong> ${listing.expiryDate}</p>
            </div>
            <div style="background:#f5efe6;border-radius:8px;padding:20px;margin:16px 0">
              <p style="margin:0 0 8px;color:#1a2a3a;font-weight:bold">Seller Contact</p>
              <p style="margin:4px 0;color:#4a5568">👤 <strong>Name:</strong> ${sellerName}</p>
              <p style="margin:4px 0;color:#4a5568">✉️ <strong>Email:</strong> ${sellerEmail}</p>
              <p style="margin:4px 0;color:#4a5568">📞 <strong>Phone:</strong> ${listing.contact?.phone || listing.contactPhone || '—'}</p>
            </div>
            <div style="background:white;border:1px solid #e0d8cc;border-radius:8px;padding:16px;margin:16px 0">
              <p style="margin:0 0 6px;color:#1a2a3a;font-weight:bold">Description</p>
              <p style="margin:0;color:#4a5568;white-space:pre-wrap">${listing.desc || listing.description || '—'}</p>
            </div>
            <div style="text-align:center;margin:20px 0">
              <a href="${SITE_URL}" style="display:inline-block;background:#1a2a3a;color:white;padding:11px 22px;border-radius:6px;text-decoration:none;font-weight:bold;font-size:14px">Review in Admin →</a>
            </div>
          `) }]
        })
      });
    } catch (adminErr) {
      console.error('Admin notification failed:', adminErr);
      // Don't fail the whole request if the admin copy fails
    }

  } else if (type === 'inquiry') {
    // Buyer contacting seller — seller gets email, reply-to is buyer
    const { sellerEmail, sellerName, listingTitle, buyerName, buyerEmail, buyerPhone, message } = data;
    to = sellerEmail;
    toName = sellerName;
    replyTo = { email: buyerEmail, name: buyerName };
    subject = `🐾 New inquiry about: ${listingTitle}`;
    html = baseStyle.replace('BODY', `
      <h2 style="color:#1a2a3a;margin-top:0">Someone is interested in your listing!</h2>
      <p style="color:#4a5568">Hi ${sellerName},</p>
      <p style="color:#4a5568">You have a new inquiry for <strong>${listingTitle}</strong>.</p>
      <div style="background:#f5efe6;border-radius:8px;padding:20px;margin:20px 0">
        <p style="margin:0 0 10px;color:#1a2a3a;font-weight:bold">Buyer Information</p>
        <p style="margin:4px 0;color:#4a5568">👤 <strong>Name:</strong> ${buyerName}</p>
        <p style="margin:4px 0;color:#4a5568">✉️ <strong>Email:</strong> <a href="mailto:${buyerEmail}" style="color:#c8a96e">${buyerEmail}</a></p>
        ${buyerPhone ? `<p style="margin:4px 0;color:#4a5568">📞 <strong>Phone:</strong> ${buyerPhone}</p>` : ''}
      </div>
      <div style="background:#fffdf0;border:1px solid #c8a96e;border-radius:8px;padding:20px;margin:20px 0">
        <p style="margin:0 0 8px;color:#1a2a3a;font-weight:bold">Message</p>
        <p style="margin:0;color:#4a5568;line-height:1.7">${message}</p>
      </div>
      <p style="color:#4a5568">Simply reply to this email to respond to ${buyerName} directly.</p>
    `);

  } else if (type === 'expiry-warning') {
    const { sellerEmail, sellerName, listingTitle, daysLeft } = data;
    to = sellerEmail;
    toName = sellerName;
    const urgent = daysLeft <= 3;
    subject = urgent
      ? `⚠️ Your listing expires in ${daysLeft} day${daysLeft !== 1 ? 's' : ''} — act now!`
      : `📅 Your listing expires in ${daysLeft} days`;
    html = baseStyle.replace('BODY', `
      <h2 style="color:${urgent ? '#dc2626' : '#1a2a3a'};margin-top:0">
        ${urgent ? '⚠️' : '📅'} Listing expiry reminder
      </h2>
      <p style="color:#4a5568">Hi ${sellerName},</p>
      <p style="color:#4a5568">Your listing <strong>${listingTitle}</strong> expires in <strong>${daysLeft} day${daysLeft !== 1 ? 's' : ''}</strong>.</p>
      ${urgent ? '<p style="color:#dc2626;font-weight:bold">Relist now to stay visible to buyers!</p>' : ''}
      <div style="text-align:center;margin:28px 0">
        <a href="${SITE_URL}" style="display:inline-block;background:#c8a96e;color:#1a2a3a;padding:11px 22px;border-radius:6px;text-decoration:none;font-weight:bold;font-size:14px">Relist for $6.99 →</a>
      </div>
      <p style="color:#4a5568;font-size:13px;text-align:center">Standard 2-week relist · Goes live instantly after payment</p>
    `);

  } else if (type === 'expiry-relist') {
    const { sellerEmail, sellerName, listingTitle } = data;
    to = sellerEmail;
    toName = sellerName;
    subject = `🐾 Your listing expired — was ${listingTitle} rehomed?`;
    html = baseStyle.replace('BODY', `
      <h2 style="color:#1a2a3a;margin-top:0">Your listing has expired</h2>
      <p style="color:#4a5568">Hi ${sellerName},</p>
      <p style="color:#4a5568">Your listing <strong>${listingTitle}</strong> has expired and is no longer visible on PNW Pet Finder.</p>
      <div style="background:#f0fff4;border:1px solid #9ae6b4;border-radius:8px;padding:24px;margin:20px 0;text-align:center">
        <p style="color:#1a2a3a;font-weight:bold;margin:0 0 6px;font-size:16px">Was your pet successfully rehomed? 🐾</p>
        <p style="color:#4a5568;font-size:13px;margin:0 0 18px">We'd love to know — your feedback helps us improve PNW Pet Finder!</p>
        <div style="display:flex;gap:12px;justify-content:center;flex-wrap:wrap">
          <a href="${SITE_URL}?feedback=yes&listing=${encodeURIComponent(listingTitle)}" style="display:inline-block;background:#16a34a;color:white;padding:10px 20px;border-radius:6px;text-decoration:none;font-weight:bold;font-size:14px">✓ Yes, rehomed!</a>
          <a href="${SITE_URL}?feedback=no&listing=${encodeURIComponent(listingTitle)}" style="display:inline-block;background:#6b7280;color:white;padding:10px 20px;border-radius:6px;text-decoration:none;font-weight:bold;font-size:14px">Not yet</a>
        </div>
      </div>
      <div style="background:#f5efe6;border-radius:8px;padding:24px;margin:20px 0;text-align:center">
        <p style="color:#1a2a3a;font-weight:bold;margin:0 0 6px">Still looking for a home?</p>
        <p style="color:#4a5568;font-size:13px;margin:0 0 16px">Relist and reach buyers across the Pacific Northwest again.</p>
        <a href="${SITE_URL}" style="display:inline-block;background:#c8a96e;color:#1a2a3a;padding:11px 22px;border-radius:6px;text-decoration:none;font-weight:bold;font-size:14px">Relist for $6.99 →</a>
      </div>
      <p style="color:#4a5568;font-size:13px">How was your experience with PNW Pet Finder? Reply to this email and let us know — we read every response.</p>
    `);

  } else if (type === 'contact') {
    const { name, email, subject: subj, message } = data;
    to = 'tyler@greatescapewebservices.com';
    toName = 'PNW Pet Finder Admin';
    replyTo = email;
    subject = `📬 Contact form: ${subj}`;
    html = baseStyle.replace('BODY', `
      <h2 style="color:#1a2a3a;margin-top:0">New contact form message</h2>
      <p style="color:#4a5568">You've received a new message through the PNW Pet Finder contact page:</p>
      <div style="background:#f5efe6;border-radius:8px;padding:20px;margin:16px 0">
        <p style="color:#1a2a3a;margin:0 0 8px"><strong>From:</strong> ${name}</p>
        <p style="color:#1a2a3a;margin:0 0 8px"><strong>Email:</strong> ${email}</p>
        <p style="color:#1a2a3a;margin:0 0 8px"><strong>Subject:</strong> ${subj}</p>
        <p style="color:#1a2a3a;margin:12px 0 4px"><strong>Message:</strong></p>
        <p style="color:#4a5568;white-space:pre-wrap;margin:0">${message}</p>
      </div>
      <p style="color:#4a5568;font-size:13px">Reply directly to this email to respond to ${name}.</p>
    `);

  } else {
    return res.status(400).json({ error: 'Unknown email type' });
  }

  // Send via SendGrid
  try {
    const body = {
      personalizations: [{ to: [{ email: to, name: toName }] }],
      from: { email: FROM_EMAIL, name: FROM_NAME },
      subject,
      content: [{ type: 'text/html', value: html }]
    };
    if (replyTo) body.reply_to = replyTo;

    const sgRes = await fetch('https://api.sendgrid.com/v3/mail/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + SENDGRID_API_KEY
      },
      body: JSON.stringify(body)
    });

    if (sgRes.ok) {
      return res.status(200).json({ ok: true });
    } else {
      const err = await sgRes.text();
      console.error('SendGrid error:', err);
      return res.status(500).json({ error: 'SendGrid failed', detail: err });
    }
  } catch(e) {
    console.error('Send email exception:', e);
    return res.status(500).json({ error: e.message });
  }
}
