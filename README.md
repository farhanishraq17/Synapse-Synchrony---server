# 🔐 Synapse-Synchrony Authentication Server

## 🎯 Overview

Professional-grade MERN stack authentication backend for **Synapse-Synchrony** platform. Implements multiple authentication methods with enterprise-level security features.

## ✨ Features

### Authentication Methods
- ✅ **Email & Password** - Traditional authentication with bcrypt hashing
- ✅ **Google OAuth 2.0** - Seamless social login via Passport.js
- ✅ **Phone Number/OTP** - Time-based OTP verification (6-digit, 5-minute validity)

### Security Features
- 🔒 **JWT Token Management** - Access tokens (15min) + Refresh tokens (7 days)
- 🍪 **HttpOnly Cookies** - XSS-resistant refresh token storage
- 🛡️ **Rate Limiting** - Brute-force attack prevention
- 🔐 **Password Hashing** - bcrypt with salt factor 12
- 📊 **Account Lockout** - Automatic lock after 5 failed login attempts
- ✅ **Input Validation** - express-validator on all endpoints
- 🎭 **RBAC** - Role-Based Access Control (user, admin, moderator, farmer, partner)
- 🔒 **Helmet.js** - Security headers configuration
- 🌐 **CORS** - Proper cross-origin configuration

## 📁 Project Structure

```
Synapse-Synchrony---server/
├── config/
│   ├── db.js                 # MongoDB connection
│   └── passport.js           # Google OAuth configuration
├── controllers/
│   └── authController.js     # Authentication logic
├── middleware/
│   ├── auth.js              # JWT authentication
│   ├── rateLimiter.js       # Rate limiting configs
│   └── validation.js        # Request validation
├── models/
│   └── User.js              # User schema & methods
├── routes/
│   └── authRoutes.js        # Auth route definitions
├── .env.example             # Environment variables template
├── .gitignore
├── package.json
├── server.js                # Application entry point
└── README.md
```

## 🚀 Quick Start

### Prerequisites
- Node.js (v18+ recommended)
- MongoDB (local or Atlas)
- Google OAuth credentials (optional)

### Installation

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Configure environment variables**
   ```bash
   cp .env.example .env
   ```
   Edit `.env` and fill in your values:
   - `MONGODB_URI` - Your MongoDB connection string
   - `JWT_ACCESS_SECRET` - Random secret for access tokens
   - `JWT_REFRESH_SECRET` - Random secret for refresh tokens
   - `GOOGLE_CLIENT_ID` - From Google Cloud Console
   - `GOOGLE_CLIENT_SECRET` - From Google Cloud Console
   - `CLIENT_URL` - Your frontend URL (default: http://localhost:5173)

3. **Generate JWT secrets** (recommended)
   ```bash
   node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
   ```

4. **Start the server**
   ```bash
   # Development (with auto-reload)
   npm run dev

   # Production
   npm start
   ```

Server will start on `http://localhost:5000`

## 📡 API Endpoints

### Public Routes

#### Register with Email/Password
```http
POST /api/auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "SecurePass123",
  "name": "John Doe",
  "phoneNumber": "+1234567890" // optional
}
```

#### Login with Email/Password
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "SecurePass123"
}
```

#### Google OAuth Login
```http
GET /api/auth/google
```
Redirects to Google login. Callback URL: `/api/auth/google/callback`

#### Send OTP
```http
POST /api/auth/otp/send
Content-Type: application/json

{
  "phoneNumber": "+1234567890"
}
```

#### Verify OTP
```http
POST /api/auth/otp/verify
Content-Type: application/json

{
  "phoneNumber": "+1234567890",
  "otp": "123456"
}
```

#### Refresh Access Token
```http
POST /api/auth/refresh
Cookie: refreshToken=<token>
```

#### Logout
```http
POST /api/auth/logout
Cookie: refreshToken=<token>
```

### Protected Routes

#### Get Current User
```http
GET /api/auth/me
Authorization: Bearer <access_token>
```

## 🔑 Authentication Flow

### 1. Login/Register
Client sends credentials → Server validates → Returns access token + sets refresh token cookie

### 2. Accessing Protected Routes
Client includes access token in Authorization header:
```
Authorization: Bearer <access_token>
```

### 3. Token Refresh
When access token expires (15min), client calls `/api/auth/refresh` with refresh token cookie to get new access token

### 4. Logout
Client calls `/api/auth/logout` to invalidate refresh token and clear cookie

## 🔒 Security Best Practices

- ✅ All passwords hashed with bcrypt (salt factor 12)
- ✅ Refresh tokens stored as HttpOnly cookies (XSS protection)
- ✅ Access tokens short-lived (15 minutes)
- ✅ Rate limiting on all auth endpoints
- ✅ Account lockout after 5 failed attempts (2 hours)
- ✅ Input validation on all requests
- ✅ CORS properly configured
- ✅ Security headers via Helmet.js
- ✅ Sensitive fields excluded from queries (password, OTP)
- ✅ Proper error handling (no sensitive data leaks)

## 📊 User Model Fields

```javascript
{
  email: String,           // Required, unique
  password: String,        // Hashed with bcrypt
  googleId: String,        // For Google OAuth
  phoneNumber: String,     // For OTP login
  otpSecret: String,       // Temporary OTP storage
  otpExpires: Date,        // OTP expiration time
  name: String,
  avatar: String,
  isVerified: Boolean,     // Email/phone verified
  isActive: Boolean,
  roles: [String],         // RBAC
  refreshToken: String,
  lastLogin: Date,
  loginAttempts: Number,
  lockUntil: Date,
  createdAt: Date,
  updatedAt: Date
}
```

## 🔧 Environment Variables

| Variable | Description | Required | Default |
|----------|-------------|----------|---------|
| `NODE_ENV` | Environment (development/production) | No | development |
| `PORT` | Server port | No | 5000 |
| `MONGODB_URI` | MongoDB connection string | Yes | - |
| `JWT_ACCESS_SECRET` | Access token secret | Yes | - |
| `JWT_REFRESH_SECRET` | Refresh token secret | Yes | - |
| `GOOGLE_CLIENT_ID` | Google OAuth client ID | No* | - |
| `GOOGLE_CLIENT_SECRET` | Google OAuth secret | No* | - |
| `GOOGLE_CALLBACK_URL` | OAuth callback URL | No | /api/auth/google/callback |
| `CLIENT_URL` | Frontend URL for CORS | No | http://localhost:5173 |

*Required only if using Google OAuth

## 🧪 Testing

### Health Check
```bash
curl http://localhost:5000/health
```

### Test Registration
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Test123456","name":"Test User"}'
```

## 📝 Rate Limits

- **General API**: 100 requests per 15 minutes
- **Auth routes** (login/register): 10 requests per 15 minutes
- **OTP send**: 3 requests per 5 minutes
- **Critical operations**: 3 requests per hour

## 🛠️ Development Tools

```json
{
  "dependencies": {
    "express": "^4.18.2",
    "mongoose": "^8.0.3",
    "bcrypt": "^5.1.1",
    "jsonwebtoken": "^9.0.2",
    "passport": "^0.7.0",
    "passport-google-oauth20": "^2.0.0",
    "express-rate-limit": "^7.1.5",
    "express-validator": "^7.0.1",
    "helmet": "^7.1.0",
    "cors": "^2.8.5",
    "speakeasy": "^2.0.0"
  }
}
```

## 🚨 Error Handling

All errors return consistent JSON format:
```json
{
  "success": false,
  "message": "Error description",
  "errors": [] // Validation errors if applicable
}
```

HTTP Status Codes:
- `200` - Success
- `201` - Created
- `400` - Bad Request (validation error)
- `401` - Unauthorized (invalid credentials/token)
- `403` - Forbidden (insufficient permissions)
- `409` - Conflict (duplicate user)
- `423` - Locked (account locked)
- `429` - Too Many Requests (rate limit)
- `500` - Internal Server Error

## 📄 License

ISC

## 👥 Author

Synapse-Synchrony Team

---

**Note**: This is a production-ready authentication system. Always use HTTPS in production and keep your secrets secure!
