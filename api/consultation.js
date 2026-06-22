// Vercel serverless function: receives the consultation form and emails the lead.
// Requires env var RESEND_API_KEY. Optional: LEAD_FROM, LEAD_TO.
const { Resend } = require("resend");

module.exports = async (req, res) => {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  const data = req.body && typeof req.body === "object" ? req.body : {};

  // Honeypot: bots fill the hidden "company" field. Pretend success, send nothing.
  if (data.company) {
    res.status(200).json({ ok: true });
    return;
  }

  if (!data.email || !data.firstName) {
    res.status(400).json({ error: "Missing required fields" });
    return;
  }

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    res.status(500).json({ error: "Email is not configured yet (RESEND_API_KEY missing)." });
    return;
  }

  const resend = new Resend(apiKey);
  // Until the domain is verified in Resend, use the test sender below.
  // After verifying spectralrenovationdesign.com, set LEAD_FROM to e.g.
  // "Spectral Website <leads@spectralrenovationdesign.com>".
  const FROM = process.env.LEAD_FROM || "Spectral Website <website@spectralrenovationdesign.com>";
  const TO = process.env.LEAD_TO || "info@spectralrenovationdesign.com";

  const esc = (s) => String(s == null ? "" : s).replace(/[&<>]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" }[c]));
  const row = (label, v) =>
    `<tr><td style="padding:6px 14px 6px 0;color:#6e6a62;font:13px Arial;white-space:nowrap;vertical-align:top">${label}</td>` +
    `<td style="padding:6px 0;font:13px Arial;color:#1a1a1a">${esc(v) || "(none)"}</td></tr>`;

  // Optional photo attachments (base64 from the browser, already downsized).
  var attachments = [];
  if (Array.isArray(data.attachments)) {
    attachments = data.attachments.slice(0, 5).map(function (a, i) {
      return {
        filename: (a && a.filename) ? String(a.filename).slice(0, 80) : "photo-" + (i + 1) + ".jpg",
        content: Buffer.from(String(a && a.content ? a.content : ""), "base64"),
      };
    }).filter(function (a) { return a.content && a.content.length > 0; });
  }

  const name = `${data.firstName || ""} ${data.lastName || ""}`.trim();
  const html = `
    <div style="font-family:Arial,sans-serif;max-width:580px">
      <h2 style="color:#2F4A3F;margin:0 0 4px">New consultation request</h2>
      <p style="color:#6e6a62;font-size:13px;margin:0 0 16px">via spectralrenovationdesign.com</p>
      <table style="border-collapse:collapse;width:100%">
        ${row("Name", name)}
        ${row("Email", data.email)}
        ${row("Phone", data.phone)}
        ${row("Preferred contact", data.contactMethod)}
        ${row("Project address", `${data.address || ""} ${data.city || ""} ${data.zip || ""}`.trim())}
        ${row("In service area", data.serviceArea)}
        ${row("Project type", data.projectType)}
        ${row("Description", data.description)}
        ${row("Design status", data.designStatus)}
        ${row("Budget", data.budget)}
        ${row("Timing", data.timing)}
        ${row("Time-sensitive", data.urgency)}
        ${row("Submitted from", data.source)}
      </table>
    </div>`;

  try {
    const payload = {
      from: FROM,
      to: [TO],
      replyTo: data.email,
      subject: `New consultation request from ${name || "a homeowner"}`,
      html,
    };
    if (attachments.length) payload.attachments = attachments;
    await resend.emails.send(payload);

    // OPTIONAL phase-two: auto-reply to the prospect. Requires a verified
    // sending domain. Uncomment after LEAD_FROM is on a verified domain.
    // await resend.emails.send({
    //   from: FROM,
    //   to: [data.email],
    //   subject: "We received your request — Spectral Renovation & Design",
    //   html: `<p>Thanks ${esc(data.firstName)}, we received your project details and will reply within one business day.</p>`
    // });

    res.status(200).json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: "Send failed" });
  }
};
