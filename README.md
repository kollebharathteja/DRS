# Dynamic Review System

React + Vite + Convex website for owner-created review forms, QR publishing, and live admin review tracking.

## Features

- Owner login/register screen
- Private owner dashboard
- Instant review form builder
- Publish button that creates a public form URL
- QR code mapped to the published review form
- Public student form with name, contact, email, trainer, quality, heart rating, expectation toggle, and checkbox feedback
- Convex tables for owners, sessions, forms, and reviews
- Live review table for the owner
- CSV export
- Form archive status

## First-Time Convex Setup

Install dependencies:

```powershell
npm.cmd install
```

Connect this folder to Convex:

```powershell
npx.cmd convex dev
```

Convex may ask you to log in, choose a team, and create or select a project. After setup it creates:

- `convex/_generated/api`
- `.env.local` with `VITE_CONVEX_URL`
- a Convex dev deployment for the database functions

Keep the Convex command running in one terminal. In another terminal, start the website:

```powershell
npm.cmd run dev
```

Open the local URL Vite prints, usually:

```text
http://127.0.0.1:5173/
```

## Test From Mobile, Laptop, Or Tablet

Do not scan a QR code that starts with `127.0.0.1` or `localhost`. On a phone, `127.0.0.1` means the phone itself, so Chrome will show `ERR_CONNECTION_REFUSED`.

For local Wi-Fi testing:

1. Connect the phone/tablet and laptop to the same Wi-Fi.
2. Find the laptop IPv4 address:

```powershell
ipconfig
```

3. Set `.env.local` to use the laptop IP:

```text
VITE_CONVEX_URL=http://YOUR_LAPTOP_IP:3210
VITE_CONVEX_SITE_URL=http://YOUR_LAPTOP_IP:3211
VITE_PUBLIC_APP_URL=http://YOUR_LAPTOP_IP:5173
```

4. Start Convex:

```powershell
npx.cmd convex dev --typecheck disable
```

5. Start Vite for network access:

```powershell
npm.cmd run dev -- --host 0.0.0.0
```

6. Open this on the phone:

```text
http://YOUR_LAPTOP_IP:5173/
```

If it still does not open, Windows Firewall may be blocking port `5173` or `3210`. Allow Node.js on Private networks.

## Important Notes

The current owner login is a simple Convex-backed starter auth flow using hashed passwords and session IDs. For a production system, replace it with Convex Auth, Clerk, or another full authentication provider before handling real student data.

The build will fail until `npx.cmd convex dev` has generated `convex/_generated/api`. That is expected for a fresh Convex project.

## Deploy To GitHub Pages

This project is hosted under:

```text
https://kollebharathteja.github.io/DRS/
```

Because the site is inside the `/DRS/` path, Vite must build assets with `/DRS/` as the base path. `vite.config.js` already handles this for production builds.

Before deploying, create a production environment file or GitHub Pages build secret with your Convex cloud URL:

```text
VITE_CONVEX_URL=https://your-convex-cloud-deployment.convex.cloud
VITE_PUBLIC_APP_URL=https://kollebharathteja.github.io/DRS
```

Do not use this in production:

```text
VITE_CONVEX_URL=http://192.168.55.104:3210
```

That address only works on your local Wi-Fi.

Build and deploy the `dist` folder:

```powershell
npm.cmd run build
```

Then publish the generated `dist` folder to GitHub Pages.
