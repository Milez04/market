# CardForge 3D Architecture

CardForge 3D is a production-shaped SaaS for card design, 3D proofing, print checks, exports, ordering, and administration.

## Core Areas

- Next.js App Router powers landing, auth, dashboard, designer, admin, and API routes.
- React Three Fiber renders real-time 3D card previews with PBR materials, thickness, lighting, rounded corners, foil, emboss, and spot UV styling.
- Fabric.js powers the 2D Canva-like editing surface.
- Zustand synchronizes design state between layers, controls, print checks, and the 3D renderer.
- Supabase stores users, profiles, projects, templates, assets, and order history.
- Stripe powers checkout and webhooks.
- Cloudinary signs uploads for user photos, logos, templates, and asset library items.

## Environment Variables

```bash
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
```

## Deployment Notes

Run `supabase/schema.sql`, configure Google OAuth in Supabase, add Stripe webhook forwarding to `/api/webhooks/stripe`, and create a Cloudinary unsigned upload preset or use the included signed upload route.
