# Web Builder Backend Integration

## What Changed

The MockAuth web builder now integrates with the **actual MockAuth backend API** instead of using localStorage. This provides a realistic authentication flow and makes the web builder a proper reference implementation.

## Architecture

```
┌─────────────────────────────────────────┐
│  Web Builder UI (Port 3000)             │
│  - HTML Pages (login, signup, etc.)     │
│  - JavaScript (API calls)                │
└─────────────────┬───────────────────────┘
                  │
                  │ Proxy
                  ▼
┌─────────────────────────────────────────┐
│  MockAuth API Server (Port 3001)        │
│  - /api/auth/* endpoints                 │
│  - JWT token generation                  │
│  - User storage in mock-data/users.json │
└─────────────────────────────────────────┘
```

## How It Works

### 1. **Signup Flow** (`signup.js`)
- User fills signup form
- **POST** `/api/auth/register` with email, password, username
- Backend creates user in `mock-data/users.json`
- Returns JWT access & refresh tokens
- Tokens stored in localStorage
- Redirects to dashboard

### 2. **Login Flow** (`login.js`)
- User enters credentials
- **POST** `/api/auth/login` with email, password
- Backend validates against `mock-data/users.json`
- Returns JWT tokens
- Tokens stored in localStorage
- Redirects to dashboard

### 3. **Protected Pages** (`dashboard.js`, `builder.js`)
- Check for JWT token in localStorage
- **GET** `/api/auth/me` with Bearer token
- Backend verifies token and returns user data
- If invalid, redirect to login

### 4. **Logout Flow**
- **POST** `/api/auth/logout` with Bearer token
- Backend invalidates session
- Clear localStorage
- Redirect to login

## Storage Strategy

### localStorage Keys:
- `mockauth-access-token` - JWT access token
- `mockauth-refresh-token` - JWT refresh token (if available)
- `mockauth-user` - Cached user info (for display only)

### Backend Storage:
- `mock-data/users.json` - All registered users (persistent)

## Running the Integrated System

### 1. Install Dependencies
```bash
npm install
```

### 2. Build the Project
```bash
npm run build
```

### 3. Start Web Builder (starts both servers)
```bash
npm run builder
```

This starts:
- Web Builder UI on `http://localhost:3000`
- MockAuth API on `http://localhost:3001` (proxied)

### 4. Access
- Open `http://localhost:3000`
- You'll be redirected to login
- Create an account via signup
- Your account is now stored in `mock-data/users.json`

## Benefits

✅ **Single Source of Truth** - All users in backend JSON file  
✅ **Real JWT Flow** - Industry-standard token-based auth  
✅ **Reference Implementation** - Shows developers how to integrate  
✅ **Persistent Data** - Users survive browser refresh  
✅ **API-First** - Web UI is just one client of the API  
✅ **Proper Security** - Password hashing via backend  

## Files Modified

- `src/web-builder/signup.js` - Calls `/api/auth/register`
- `src/web-builder/login.js` - Calls `/api/auth/login`
- `src/web-builder/dashboard.js` - JWT token authentication
- `src/web-builder/builder.js` - JWT token authentication
- `src/web-builder/server.js` - Proxy setup + MockAuth server
- `package.json` - Added `http-proxy-middleware`

## API Endpoints Used

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/auth/register` | POST | Create new user |
| `/api/auth/login` | POST | Authenticate user |
| `/api/auth/logout` | POST | End session |
| `/api/auth/me` | GET | Get current user |
| `/api/auth/verify` | POST | Verify JWT token |

## Backward Compatibility

Old localStorage-based users are **not** migrated automatically. Users need to:
1. Clear browser data (or wait for auto-redirect to login)
2. Create a new account via signup
3. New account stored in backend

## Testing

Try these scenarios:

1. **Signup → Dashboard** - Create account and verify redirect
2. **Logout → Login** - Verify tokens cleared and login works
3. **Refresh Page** - User stays logged in (token persists)
4. **Invalid Token** - Manually corrupt token, verify redirect to login
5. **Server Restart** - Stop and start server, user data persists
