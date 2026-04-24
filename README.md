# SoundSphere

Production-style music player workspace with:

- `frontend/`: React + Vite custom player UI
- `backend/`: Express proxy for YouTube Data API v3

## Quick Start

### Local Development

1. Add `YOUTUBE_API_KEY` to `backend/.env`
2. From the project root run `npm install`
3. Run `npm --prefix backend install`
4. Run `npm --prefix frontend install`
5. Start both apps with `npm run dev`

### Production Deployment

For deploying to Vercel, see [VERCEL_DEPLOYMENT.md](./VERCEL_DEPLOYMENT.md)

**Key Requirements for Vercel:**
- Set `VITE_API_BASE_URL` on frontend (point to your backend Vercel URL)
- Set `VERCEL_FRONTEND_URL` on backend (point to your frontend Vercel URL)
- Set `YOUTUBE_API_KEY` on backend

## Scripts

- `npm run dev`: start frontend and backend together
- `npm run build`: build the frontend
- `npm run lint`: lint the frontend
- `npm run dev:backend`: start only backend
- `npm run dev:frontend`: start only frontend

## Troubleshooting Search Failures

If search requests are failing on Vercel:

1. **Check Environment Variables**: Ensure `VITE_API_BASE_URL` on frontend points to your backend URL
2. **Check CORS**: Ensure `VERCEL_FRONTEND_URL` is set on backend to your frontend URL
3. **Check API Key**: Ensure `YOUTUBE_API_KEY` is set on backend
4. **Check Logs**: Review Vercel deployment logs for detailed error messages
