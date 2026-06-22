# Spectral Renovation & Design — Website

A static, multi-page marketing site (HTML/CSS/JS) with one Vercel serverless
function that emails consultation requests via Resend.

## Structure

```
spectral-website/
  index.html          Home
  services.html       Services
  portfolio.html      Work
  process.html        Process
  about.html          About
  contact.html        Schedule a consultation (lead form)
  privacy.html        Privacy policy
  assets/
    css/site.css      All styles
    js/site.js        Nav, filters, multi-step form
    images/           Photography, logo, favicon, OG image
  api/
    consultation.js   Serverless function: emails the lead (Resend)
  vercel.json         Clean URLs + asset caching
  package.json        Function dependency (resend)
  sitemap.xml, robots.txt, favicon.ico
```

Pages use clean URLs (`/services`, `/work` is `/portfolio`, etc.) via `vercel.json`.

---

## How the lead form works

`contact.html` posts JSON to `/api/consultation`. The function validates input,
drops bot submissions via a hidden honeypot field, and emails the lead to the
business inbox using Resend. Every submission also appears in your Resend
dashboard as a backup.

### Email setup (Resend) - required for the form to send

1. Create a free account at https://resend.com
2. Create an API key (Dashboard > API Keys).
3. Add your domain (Dashboard > Domains > Add `spectralrenovationdesign.com`) and
   add the DNS records Resend shows you at your registrar. This lets you send
   from your own domain. (You can skip this at first and use the built-in test
   sender; see step 5.)
4. In Vercel, add these Environment Variables (Project > Settings > Environment Variables):
   - `RESEND_API_KEY`  = your Resend API key  (required)
   - `LEAD_TO`         = info@spectralrenovationdesign.com  (optional, this is the default)
   - `LEAD_FROM`       = `Spectral Website <leads@spectralrenovationdesign.com>`  (set this AFTER the domain is verified)
5. Until the domain is verified, leave `LEAD_FROM` unset. The function falls back
   to Resend's test sender (`onboarding@resend.dev`) so you can test immediately.

---

## Phase C - Put it on GitHub

You have a GitHub account, so the fastest path is the web uploader:

1. Go to https://github.com/new
2. Repository name: `spectral-website`. Set it Private. Click **Create repository**.
3. On the new repo page, click **uploading an existing file**.
4. Unzip the delivered folder, then drag ALL of its contents (index.html, the
   assets/ and api/ folders, vercel.json, etc.) into the upload area.
5. Click **Commit changes**.

Prefer the command line? From inside the unzipped folder:

```
git init
git add .
git commit -m "Initial Spectral website"
git branch -M main
git remote add origin https://github.com/<your-username>/spectral-website.git
git push -u origin main
```

---

## Phase D - Push live on Vercel + connect the domain

1. Go to https://vercel.com and sign in with GitHub.
2. **Add New > Project** > import `spectral-website`.
3. Framework preset: **Other**. Leave build command empty and output directory
   as the root. Click **Deploy**. The site goes live on a free
   `spectral-website.vercel.app` URL in under a minute.
4. **Add the email key:** Project > Settings > Environment Variables > add
   `RESEND_API_KEY` (and optionally `LEAD_FROM`/`LEAD_TO`). Then redeploy
   (Deployments > latest > ... > Redeploy) so the function picks them up.
5. **Test the form** on the `.vercel.app` URL. A submission should land at
   info@spectralrenovationdesign.com and in your Resend dashboard.
6. **Connect the domain:** Project > Settings > Domains > add
   `spectralrenovationdesign.com` (and `www.spectralrenovationdesign.com`).
   Vercel shows the exact DNS records. Log in to your domain registrar and:
   - Point the apex domain with the **A record** Vercel gives you (commonly
     `76.76.21.21`), and
   - Point `www` with the **CNAME** Vercel gives you (`cname.vercel-dns.com`).
   - Or, simplest: change the domain's **nameservers** to Vercel's if you want
     Vercel to manage DNS.
   SSL provisions automatically within minutes once DNS resolves.

That's it - the site is live on the domain with the lead form emailing you.

---

## Still pending (intentional placeholders)

- **Kitchen photography:** no kitchen is shown yet. When a photo is available,
  add it to `assets/images/` and re-add a kitchen card/row.
- **Prospect auto-reply:** the function has a commented-out auto-reply block.
  Turn it on after the sending domain is verified in Resend.
- **Project locations:** portfolio cards currently read "Boise, ID" as a
  placeholder; update per real project when confirmed.
- **File uploads:** the optional photo field now works — selected images are
  downsized in the browser and attached to the lead email (up to 5, capped in
  size to stay within the platform request limit).

## Editing later

- Text/photos: edit the relevant `.html` file or swap an image in
  `assets/images/` (keep the same filename to avoid touching the HTML).
- Styles: `assets/css/site.css`. Behavior: `assets/js/site.js`.
- Push the change to GitHub and Vercel redeploys automatically.
