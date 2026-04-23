# SoundSphere

Production-style music player workspace with:

- `frontend/`: React + Vite custom player UI
- `backend/`: Express proxy for YouTube Data API v3

## Run locally

1. Add `YOUTUBE_API_KEY` to `backend/.env`
2. From the project root run `npm install`
3. Run `npm --prefix backend install`
4. Run `npm --prefix frontend install`
5. Start both apps with `npm run dev`

## Scripts

- `npm run dev`: start frontend and backend together
- `npm run build`: build the frontend
- `npm run lint`: lint the frontend
