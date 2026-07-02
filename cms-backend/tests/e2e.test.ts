# CMS E2E Test Scenarios

Manual + scripted end-to-end check, sebelum QA pass.

## Backend smoke

```bash
curl -s http://localhost:4001/health
curl -s -X POST http://localhost:4001/api/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"admin@samantha.local","password":"admin12345"}'
# Login harus return {token, admin}
# Test semua route dengan Bearer token: GET /api/posts, POST /api/posts, dsb.
```

## Frontend smoke

```bash
curl -s http://localhost:5174/
# Harus return HTML root dengan <div id="root">
```

## Integration flow

| # | Step | Expected | Status |
|---|------|----------|--------|
| 1 | Login → cookie | 200 JWT | ☐ |
| 2 | Create Post | 201 + ID | ☐ |
| 3 | Reorder sections | 200 + new order | ☐ |
| 4 | Publish Post | status=published | ☐ |
| 5 | Upload Media | URL + DB row | ☐ |
| 6 | Delete Post | 204 | ☐ |
| 7 | Logout | redirect /login | ☐ |

## Security

- [ ] Frontend cannot call backend tanpa CORS (verify reject)
- [ ] Backend tolak missing JWT (401)
- [ ] Backend tolak malformed token (401)
- [ ] Rate limit login 5/min enforced
- [ ] File upload > 5MB rejected
- [ ] File upload forbidden MIME rejected
- [ ] Admin password di-env tidak bocor di error message / logs

## DoD

- [ ] `npm run build` di kedua repo exit 0
- [ ] `npm run typecheck` clean di kedua repo
- [ ] Health check DB OK dengan Supabase URL asli
- [ ] End-to-end login → CRUD → logout sukses via UI
- [ ] Responsive di breakpoint 320 / 768 / 1280 OK
- [ ] A11y: keyboard nav, focus ring, aria-label di icon buttons, skip link
