# 🔐 Synapse-Synchrony Authentication Server

Professional Express/MongoDB auth backend for the Synapse-Synchrony platform. Provides email/password signup, login, verification, welcome email, password reset scaffolding, and JWT cookie-based sessions.

---

## 🎯 Overview
- **Purpose:** Backend for client authentication and account lifecycle (signup → verify → login → logout → reset).
- **Status:** Core flows implemented; password reset email sending is scaffolded but not wired; Mailtrap helpers exist but controllers use Brevo.
- **Security posture:** HttpOnly + same-site cookies, bcrypt hashing, JWT signed with secret, CORS pinned to localhost client.

---

## ✨ Features
- Email/password signup with bcrypt hashing.
- 6-digit verification code emailed; marks account verified and triggers welcome email.
- Login issues 7-day JWT in HttpOnly cookie; logout clears cookie.
- Auth check endpoint guarded by JWT middleware.
- Password reset token generation and reset handler (email send currently commented).
- Consistent JSON response helper.

---

## 📁 Project Structure
```
Synapse-Synchrony---server/
├── server.js                 # Express app bootstrap + CORS/cookies + routes
├── src/
│   ├── config/db.js          # Mongoose connection
│   ├── controllers/authController.js
│   ├── routes/authRoutes.js  # /api/auth routes
│   ├── middlewares/VeriyToken.js
│   ├── models/User.js        # User schema (email, password, name, tokens, timestamps)
│   ├── utils/
│   │   ├── HttpResponse.js
│   │   └── utils.js          # JWT + verification code helpers
│   ├── mailtrap/             # Mailtrap client + templates (unused by controllers)
│   └── Brevo/                # Brevo config + verification/welcome senders
└── package.json
```

---

## 🚀 Quick Start
```bash
npm install

# Development (nodemon)
npm run dev

# Production
npm start
```

Default port: `5000`. CORS is set to `http://localhost:5173`; adjust in `server.js` for other clients.

---

## 🔑 Environment Variables
Create a `.env` file in the project root:
```
PORT=5000
MONGODB_URI=mongodb+srv://<user>:<pass>@cluster/db
JWT_SECRET=replace_me_with_a_strong_secret
NODE_ENV=development

# Email providers
BREVO_API_KEY=your_brevo_key
MAILTRAP_TOKEN=your_mailtrap_token

# Optional, for building reset links if you enable Mailtrap sender
CLIENT_URL=http://localhost:5173
```

Generate a secret (optional):
```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

---

## 📡 API (base: `/api/auth`)
- `POST /signup` — Body `{ email, password, name }`; creates user, sets JWT cookie, sends verification email.
- `POST /verify-email` — Body `{ code }`; validates token + expiry, marks verified, sends welcome email.
- `POST /login` — Body `{ email, password }`; validates credentials, sets JWT cookie, updates `lastLogin`.
- `POST /logout` — Clears auth cookie.
- `POST /forgot-password` — Body `{ email }`; generates reset token + expiry, saves to user; email send is commented.
- `POST /reset-password/:token` — Body `{ password }`; validates token + expiry, hashes and stores new password.
- `GET /check-auth` — Protected; requires valid JWT cookie; returns user sans password.

### Request/Response shape
Responses use:
```json
{ "error": false, "message": "...", "data": { ... } }
```
Errors set `"error": true` with relevant status codes (400/401/404/409/500).

---

## 🔒 Auth & Tokens
- JWT signed with `JWT_SECRET`, expires in 7 days.
- Cookie flags: `httpOnly`, `sameSite: 'strict'`, `secure` when `NODE_ENV === 'production'`.
- Middleware `VerifyToken` reads `req.cookies.token`, verifies, and attaches `req.userId`.
- Passwords hashed with bcrypt (salt rounds = 10).

---

## 📬 Email Sending
- **In-use:** Brevo sender (`src/Brevo/Brevoemail.js`) for verification and welcome emails.
- **Mailtrap (optional):** `src/mailtrap/emails.js` + HTML templates; not currently called from controllers. Wire `sendPasswordResetEmail` in `ForgotPassword` to enable reset emails.
- Sender details are hardcoded; update names/emails for your domain before production.

---

## 🧪 Testing Status
- No automated tests yet (`npm test` is a placeholder). Add unit/e2e (e.g., Jest + Supertest) before production.

---

## 🚧 Known Gaps / Hardening To-Do
- Add input validation (celebrate/zod), rate limiting, and helmet security headers.
- Implement password reset email delivery (Mailtrap or Brevo) and reset-success notification.
- Consider short-lived access + refresh token pattern; add token revocation/rotation.
- Add logging/metrics and structured error handling.
- Externalize CORS origins and sender identities per environment.



