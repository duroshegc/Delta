# Delta Admin Dashboard

Internal Next.js dashboard for moderation, analytics, user management, live session review, media review, trust and safety, wallet support, audit logs, admin management, and operational visibility.

## Local setup

```bash
cp .env.example .env.local
npm install
npm run dev
```

The app runs on `http://localhost:3001` by default and expects the backend API at `https://backend-teal-one-10.vercel.app`.

## Backend integration

The dashboard calls the deployed backend admin API where endpoints exist:

- `GET /admin/analytics`
- `GET /admin/users`
- `GET /admin/reports`
- `GET /admin/sessions`
- `PATCH /admin/users/:id`
- `POST /admin/admins`

`NEXT_PUBLIC_USE_MOCKS=false` requires live backend responses and is the default for the admin dashboard. Set `NEXT_PUBLIC_USE_MOCKS=true` only for isolated local UI development.

The rest of the completed admin surfaces are ready against typed mock-backed adapters until matching backend endpoints are added:

- Moderation cases and appeals
- Media review and verification review
- Trust score management and policy controls
- Wallet support, revenue analytics, and token economy monitoring
- Audit log export, admin management, and system settings

## Admin session

Visit `/login` and sign in with a backend admin account. The dashboard stores the returned access token in `localStorage` as `delta_admin_token`, sets an 8-hour dashboard session cookie, and sends the token as a bearer token for admin requests. A manual access-token field remains available for operational handoff and debugging.

## Master admin bootstrap

Create the first `super_admin` from the backend with:

```bash
MASTER_ADMIN_EMAIL=owner@example.com MASTER_ADMIN_PASSWORD='StrongPassw0rd!' bun run admin:create-master
```

After signing in as that master admin, use Admin management → Create admin to create additional admin accounts.
