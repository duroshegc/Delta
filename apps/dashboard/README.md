# Delta Admin Dashboard

Internal Next.js dashboard for moderation, analytics, user management, live session review, media review, trust and safety, wallet support, audit logs, admin management, and operational visibility.

## Local setup

```bash
cp .env.example .env.local
npm install
npm run dev
```

The app runs on `http://localhost:3001` by default and expects the backend API at `http://localhost:3000`.

## Backend integration

The dashboard calls the current backend admin API where endpoints exist:

- `GET /admin/analytics`
- `GET /admin/users`
- `GET /admin/reports`
- `GET /admin/sessions`
- `PATCH /admin/users/:id`

Set `NEXT_PUBLIC_USE_MOCKS=false` to require live backend responses. With the default mock mode, the dashboard tries the backend first and falls back to local sample data when the API is not running or the admin token is missing.

The rest of the completed admin surfaces are ready against typed mock-backed adapters until matching backend endpoints are added:

- Moderation cases and appeals
- Media review and verification review
- Trust score management and policy controls
- Wallet support, revenue analytics, and token economy monitoring
- Audit log export, admin management, and system settings

## Admin session

Visit `/login`, paste an admin JWT from the backend, and enter an MFA code. The dashboard stores the token in `localStorage` as `delta_admin_token`, sets an 8-hour dashboard session cookie, and sends the token as a bearer token for admin requests.
