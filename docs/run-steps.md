## Quick run (local dev)

1. Copy `.env.example` to `.env` and fill real keys.
2. Build & start containers:
   docker compose up --build -d

3. Open n8n at: http://localhost:5678 (use basic auth from .env)
4. Import/implement the Telegram → Cloudinary → Supabase workflow in n8n (see n8n/workflows).
5. Start the media-worker is reachable at http://localhost:4000
6. Test flow:
   - Send a small video to your Telegram bot.
   - n8n should pick it up, upload to Cloudinary, and insert row into Supabase videos table.
