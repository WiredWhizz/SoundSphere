# Vercel Deployment Guide for SoundSphere

SoundSphere has two separate components that need to be deployed on Vercel:
1. **Frontend** (React + Vite)
2. **Backend** (Express API)

## Prerequisites

- Vercel account
- YouTube Data API key (from Google Cloud Console)
- Git repository (GitHub, GitLab, or Bitbucket)

## Step 1: Deploy Backend to Vercel

### 1.1 Create a `backend/vercel.json`

Create a file `backend/vercel.json` to configure Vercel for the backend:

```json
{
  "version": 2,
  "builds": [
    {
      "src": "src/server.js",
      "use": "@vercel/node"
    }
  ],
  "routes": [
    {
      "src": "/(.*)",
      "dest": "src/server.js"
    }
  ],
  "env": {
    "YOUTUBE_API_KEY": "@youtube_api_key",
    "SESSION_SECRET": "@session_secret",
    "CORS_ORIGIN": "@cors_origin",
    "VERCEL_FRONTEND_URL": "@vercel_frontend_url"
  }
}
```

### 1.2 Deploy Backend

1. Push your code to GitHub
2. Go to [vercel.com](https://vercel.com) and sign in
3. Click "New Project"
4. Import your GitHub repository
5. Select the `backend` directory as the root directory in "Root Directory"
6. Go to "Environment Variables" and add:
   - `YOUTUBE_API_KEY`: Your YouTube API key
   - `SESSION_SECRET`: A long random string
   - `CORS_ORIGIN`: Leave empty initially
   - `VERCEL_FRONTEND_URL`: Leave empty (update after frontend is deployed)
7. Click "Deploy"
8. Once deployed, copy the backend URL (e.g., `https://soundsphere-backend.vercel.app`)

### 1.3 Update Backend Environment Variables

After the backend is deployed:
1. Go to the Vercel project settings
2. Update `VERCEL_FRONTEND_URL` with your frontend URL (will do after frontend deployment)

## Step 2: Deploy Frontend to Vercel

### 2.1 Create a `frontend/vercel.json`

Create a file `frontend/vercel.json` for frontend configuration:

```json
{
  "version": 2,
  "builds": [
    {
      "src": "package.json",
      "use": "@vercel/static-build",
      "config": {
        "distDir": "dist"
      }
    }
  ],
  "routes": [
    {
      "src": "/(.*)",
      "dest": "/index.html"
    }
  ],
  "env": {
    "VITE_API_BASE_URL": "@api_base_url"
  }
}
```

### 2.2 Update Frontend Build Configuration

Edit `frontend/package.json` and make sure the build script is:
```json
"build": "vite build"
```

### 2.3 Deploy Frontend

1. Go to [vercel.com](https://vercel.com) and click "New Project"
2. Import your GitHub repository again
3. Select the `frontend` directory as the root directory
4. Go to "Environment Variables" and add:
   - `VITE_API_BASE_URL`: Set this to your backend URL (e.g., `https://soundsphere-backend.vercel.app`)
5. Click "Deploy"
6. Once deployed, copy the frontend URL (e.g., `https://soundsphere-frontend.vercel.app`)

## Step 3: Update Backend CORS Configuration

After both are deployed:

1. Go to your backend Vercel project
2. Go to "Settings" → "Environment Variables"
3. Update `VERCEL_FRONTEND_URL` with your frontend URL

The backend will automatically allow requests from this URL.

## Troubleshooting

### Search requests failing with 401 error
- This usually means CORS is blocking the request
- Check that `VERCEL_FRONTEND_URL` in the backend matches your actual frontend URL

### Search requests failing with other errors
- Check the browser console for the actual error message
- Go to your backend Vercel logs and check for API errors
- Ensure `YOUTUBE_API_KEY` is correctly set in the backend environment

### API requests getting blocked
- Verify `VITE_API_BASE_URL` on the frontend points to the correct backend URL
- Check that the backend's CORS configuration includes the frontend origin

## Environment Variables Summary

### Backend Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `YOUTUBE_API_KEY` | Yes | YouTube Data API v3 key |
| `SESSION_SECRET` | Yes | Secret for JWT token signing |
| `CORS_ORIGIN` | No | Comma-separated CORS origins (for additional origins) |
| `VERCEL_FRONTEND_URL` | No | Your Vercel frontend URL (for automatic CORS) |
| `FRONTEND_ORIGIN` | No | Development frontend URL |
| `PORT` | No | Server port (Vercel sets this automatically) |

### Frontend Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `VITE_API_BASE_URL` | Yes | Backend API base URL |

## Local Development with Vercel Deployment

For local development, the proxy in `frontend/vite.config.js` handles API calls:
```javascript
server: {
  proxy: {
    '/api': {
      target: 'http://localhost:3001',
      changeOrigin: true,
    },
  },
}
```

No need to set `VITE_API_BASE_URL` for local development.

## Support

For issues with:
- **Vercel deployment**: Check [Vercel Docs](https://vercel.com/docs)
- **YouTube API**: Check [YouTube Data API Docs](https://developers.google.com/youtube/v3)
- **CORS issues**: Ensure origins are correctly configured in backend environment variables
