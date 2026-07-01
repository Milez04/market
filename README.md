# CardForge 3D

Premium SaaS card designer built with Next.js 15, React 19, TypeScript, TailwindCSS, Framer Motion, Three.js, React Three Fiber, Drei, Zustand, Fabric.js, Supabase, Stripe, and Cloudinary.

## Run

```bash
npm install
npm run dev
```

## Product Surfaces

- Landing page with animated 3D card, templates, features, reviews-style proof sections, pricing, FAQ, and CTA.
- PHP/MySQL login and registration for XAMPP.
- User dashboard with saved card projects and WhatsApp order history.
- Canva-like designer with Fabric.js canvas, layers, hotkeys, zoom, print checks, exports, and live 3D preview.
- Admin panel for templates, assets, users, orders, analytics, and revenue tracking.
- API routes for Stripe checkout, Stripe webhooks, Cloudinary upload signatures, and AI card generation.

## XAMPP PHP + MySQL

1. Copy the `php-api` folder into your XAMPP `htdocs` folder and rename it to `cardforge-api`.
2. Open phpMyAdmin and import `php-api/schema.sql`.
3. Start Apache and MySQL in XAMPP.
4. The default API URL is:

```text
http://localhost/cardforge-api
```

If you use another folder name, add this to `.env.local`:

```bash
NEXT_PUBLIC_PHP_API_URL=http://localhost/your-folder-name
```

The PHP API handles:

- Register/login
- Saved projects
- Dashboard project list
- WhatsApp order history

## WhatsApp Orders

The editor `Order via WhatsApp` button downloads the card PNG and opens WhatsApp with a prepared order message for:

```text
+77022648901
```

Browsers cannot attach an image file to WhatsApp automatically. After WhatsApp opens, attach the downloaded `cardforge-whatsapp-order.png` file to the chat.

## Database

For the XAMPP flow, use `php-api/schema.sql`. Supabase files may remain in the project, but the current login/dashboard/order flow uses PHP + MySQL.

## Environment

Copy `.env.example` to `.env.local` and fill in Supabase, Stripe, and Cloudinary values.
