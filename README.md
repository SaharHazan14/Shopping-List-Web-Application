# Shopping List Web App (Frontend)

React + TypeScript + Vite frontend for the Shopping List application.

## Prerequisites

- Node.js 20+
- npm 10+

## Environment variables

Create a `.env` file from `.env.example` and fill values for your environment.

Required variables:

- `VITE_API_URL`: Backend base URL (example: `https://api.example.com`)
- `VITE_COGNITO_DOMAIN`: Cognito hosted UI domain
- `VITE_COGNITO_CLIENT_ID`: Cognito app client id
- `VITE_COGNITO_REDIRECT_URI`: Must match deployed callback URL (example: `https://app.example.com/auth/callback`)
- `VITE_COGNITO_SCOPE`: OAuth scopes (example: `email openid phone`)

## Local development

```bash
npm install
npm run dev
```

## Production build

```bash
npm ci
npm run build
npm run preview
```

Build output is generated in `dist/`.

## Deploy (SPA routing requirement)

This app uses client-side routing. Configure your host to rewrite all non-file routes to `index.html`.

Examples:

- Netlify `_redirects`: `/* /index.html 200`
- Vercel rewrite: source `/(.*)` to destination `/index.html`
- Nginx: `try_files $uri /index.html;`

Without this rewrite, direct navigation to routes like `/dashboard` or `/auth/callback` will fail.

## Deploy to Netlify

This repository includes `netlify.toml` configured with:

- Build command: `npm run build`
- Publish directory: `dist`
- SPA fallback redirect: `/* -> /index.html`

### Netlify UI steps

1. Push this repo to GitHub.
2. In Netlify, click **Add new site** → **Import an existing project**.
3. Select this repository and branch.
4. Confirm settings:
	- Build command: `npm run build`
	- Publish directory: `dist`
5. Add required environment variables in **Site settings** → **Environment variables**:
	- `VITE_API_URL`
	- `VITE_COGNITO_DOMAIN`
	- `VITE_COGNITO_CLIENT_ID`
	- `VITE_COGNITO_REDIRECT_URI`
	- `VITE_COGNITO_SCOPE`
6. Deploy the site.

After first deploy, update Cognito callback/logout URLs to include your Netlify domain (for example `https://<your-site>.netlify.app/auth/callback`).

### Netlify CLI (optional)

```bash
npm install -g netlify-cli
netlify login
netlify init
netlify deploy --build
netlify deploy --prod --build
```

## Production checklist

- Set production values for all `VITE_*` variables.
- Verify Cognito callback/logout URLs include production domain.
- Verify backend CORS allows the frontend origin.
- Deploy static files from `dist/`.
- Smoke test login flow, callback, dashboard, and API-protected pages.
