#  Synapse-Synchrony Backend Server

##  Overview
This is the **backend authentication server** for the Synapse-Synchrony platform. It provides complete MERN stack authentication with Email/Password, Google OAuth, and Phone/OTP support.

##  Tech Stack
- **Runtime**: Node.js
- **Framework**: Express.js 4.18.2
- **Database**: MongoDB Atlas (Cloud)
- **ODM**: Mongoose 8.0.3
- **Authentication**: 
  - JWT (jsonwebtoken 9.0.2)
  - Passport.js 0.7.0 (Google OAuth)
  - bcrypt 5.1.1 (Password hashing)
  - speakeasy 2.0.0 (OTP generation)
- **Security**: 
  - Helmet (HTTP headers)
  - CORS
  - express-rate-limit (Brute-force protection)
  - express-validator (Input validation)

##  Project Structure
```
server/
 config/
    db.js              # MongoDB connection
    passport.js        # Google OAuth configuration
 controllers/
    authController.js  # Authentication logic
 middleware/
    auth.js            # JWT authentication & RBAC
    rateLimiter.js     # Rate limiting
    validation.js      # Input validation
 models/
    User.js            # User schema
 routes/
    authRoutes.js      # API endpoints
 .env                   # Environment variables (DO NOT COMMIT)
 .env.example           # Example environment file
 server.js              # Main entry point
 package.json           # Dependencies
```

##  Setup Instructions

### 1. Install Dependencies
```powershell
cd Synapse-Synchrony---server
npm install
```

### 2. Configure Environment Variables
Create a `.env` file in the root directory:

```env
NODE_ENV=development
PORT=3001

# MongoDB Atlas Connection
MONGODB_URI=mongodb+srv://synapseuser:n7GPBQeLhiWIPhIZ@synapse-cluster.33gdzph.mongodb.net/synapse-synchrony?retryWrites=true&w=majority&appName=synapse-cluster

# JWT Secrets
JWT_ACCESS_SECRET=synapse-access-secret-key-change-in-production-12345678
JWT_REFRESH_SECRET=synapse-refresh-secret-key-change-in-production-87654321

# Google OAuth (Optional)
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GOOGLE_CALLBACK_URL=http://localhost:3001/api/auth/google/callback

# Frontend URL
CLIENT_URL=http://localhost:5176
```

### 3. Start the Server
```powershell
node server.js
```

The server will run on **http://localhost:3001**

##  API Endpoints

### Authentication Routes
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register new user |
| POST | `/api/auth/login` | Login with email/password |
| POST | `/api/auth/logout` | Logout user |
| POST | `/api/auth/refresh` | Refresh access token |
| GET | `/api/auth/me` | Get current user |
| GET | `/api/auth/google` | Google OAuth login |
| GET | `/api/auth/google/callback` | Google OAuth callback |
| POST | `/api/auth/otp/send` | Send OTP to phone |
| POST | `/api/auth/otp/verify` | Verify OTP |

### Health Check
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/health` | Server health status |

##  Registration Example
```javascript
POST /api/auth/register
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "SecurePass123!",
  "phoneNumber": "+1234567890" // Optional
}
```

##  Security Features
- **Password Hashing**: bcrypt with salt rounds of 12
- **JWT Tokens**: 
  - Access Token: 15 minutes expiry
  - Refresh Token: 7 days expiry (HttpOnly cookie)
- **Account Lockout**: 5 failed attempts locks account for 2 hours
- **Rate Limiting**:
  - General API: 100 requests/15 minutes
  - Auth routes: 5 requests/15 minutes
  - OTP: 3 requests/15 minutes
- **RBAC**: Supports user, admin, moderator, farmer, partner roles

##  Database
- **Provider**: MongoDB Atlas (Cloud)
- **Cluster**: synapse-cluster.33gdzph.mongodb.net
- **Database Name**: synapse-synchrony
- **Connection**: Automatic reconnection enabled

##  Changes Made
1.  Complete authentication backend structure
2.  User model with password hashing and account lockout
3.  JWT token generation and refresh logic
4.  Email/Password registration and login
5.  Google OAuth 2.0 integration (conditional)
6.  Phone/OTP authentication backend
7.  Security middleware (Helmet, CORS, rate limiting)
8.  Input validation with express-validator
9.  MongoDB Atlas cloud database connection
10.  CORS configured for frontend on port 5176
11.  Error handling with proper HTTP status codes
12.  Process error handlers (non-terminating for development)

##  Important Notes
- Change JWT secrets in production
- Never commit `.env` file to Git
- Google OAuth is optional (disabled if credentials not provided)
- Server runs on port **3001** by default
- CORS is configured for `http://localhost:5176` (frontend)

##  Dependencies
All dependencies are listed in `package.json` and installed via `npm install`

##  Known Issues
- Mongoose duplicate index warnings (non-critical)
- Google OAuth disabled without credentials

##  RBAC Roles
- `user` - Default role for new registrations
- `admin` - Full system access
- `moderator` - Content moderation
- `farmer` - Farmer-specific features
- `partner` - Partner-specific features

---
**Last Updated**: December 7, 2025
**Port**: 3001
**Database**: MongoDB Atlas Cloud
