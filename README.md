# Mr.Slink's Product

Static one-page website for **Mr.Slink's Product**, a private app development studio.

## Project Type

This is a static HTML/CSS/JavaScript website.

- Entry file: `index.html`
- Styles: `styles.css`
- Scripts: `script.js`
- Backend: none
- Paid hosting required: no
- Recommended host: Cloudflare Pages free plan

The site uses CDN-hosted frontend animation libraries:

- GSAP
- ScrollTrigger
- Lenis
- SplitType

These are loaded in `index.html` with normal `<script>` and `<link>` tags. There is no build step.

## Local Preview

Open `index.html` directly in a browser, or run a simple local server:

```bash
python3 -m http.server 8080
```

Then visit:

```text
http://localhost:8080
```

## Deploy to Cloudflare Pages

Use these Cloudflare Pages settings:

- Framework preset: `None`
- Build command: leave empty, or use `exit 0`
- Build output directory: `/`
- Root directory: `/`
- Production branch: `main`

Cloudflare Pages will serve the root-level `index.html`.

Important: do **not** use `npx wrangler deploy` for this project. That deploys to Cloudflare Workers, not the intended free Cloudflare Pages URL.

If Cloudflare shows a live URL like this:

```text
https://mrslinks-product.<account>.workers.dev
```

then the project was deployed as a Worker by mistake. Create a new **Pages** project using **Connect to Git** instead.

## GitHub Setup

Create a new GitHub repository, then push this project:

```bash
git init
git add .
git commit -m "Initial static website"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/mrslinks-product.git
git push -u origin main
```

Replace `YOUR_USERNAME` with your GitHub username.

## Cloudflare Pages Steps

1. Log in to Cloudflare.
2. Go to **Workers & Pages**.
3. Select **Create application**.
4. Choose **Pages**.
5. Select **Connect to Git**.
6. Connect your GitHub account if Cloudflare asks.
7. Choose the `mrslinks-product` repository.
8. Configure the project:
   - Project name: `mrslinks-product`
   - Production branch: `main`
   - Framework preset: `None`
   - Build command: leave empty, or use `exit 0`
   - Build output directory: `/`
9. Click **Save and Deploy**.

Your free Cloudflare Pages URL should look like:

```text
https://mrslinks-product.pages.dev
```

If the exact project name is already taken, Cloudflare will ask for another project name and the URL will use that name instead.
