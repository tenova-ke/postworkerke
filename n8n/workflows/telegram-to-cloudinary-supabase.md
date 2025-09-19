Workflow name: Telegram → Cloudinary → Supabase

Nodes (in order):

1) Telegram Trigger
   - Trigger: New Message
   - Allowed Update Types: message
   - Filters: message.video OR message.document (mime video/*)
   - Output fields: message

2) HTTP Request (Get File Path)
   - GET https://api.telegram.org/bot{{ $env.TELEGRAM_BOT_TOKEN }}/getFile?file_id={{ $json["message"]["video"]["file_id"] || $json["message"]["document"]["file_id"] }}
   - Save JSON response -> file_path

3) Set (Make file download URL)
   - Set: file_url = https://api.telegram.org/file/bot{{ $env.TELEGRAM_BOT_TOKEN }}/{{ $json["result"]["file_path"] }}

4) HTTP Request (Download file binary)
   - Method: GET
   - URL: {{ $json["file_url"] }}
   - Response format: File (binary)
   - Output: binary data named 'videoFile'

5) HTTP Request (Upload to Cloudinary)
   - Method: POST
   - URL: https://api.cloudinary.com/v1_1/{{ $env.CLOUDINARY_CLOUD_NAME }}/video/upload
   - Auth: Basic (API_KEY:API_SECRET) or send unsigned preset
   - Body: form-data
       - file => Binary data: videoFile
       - upload_preset => (if using unsigned preset) or sign on server
   - Result: JSON with secure_url

6) HTTP Request (Insert into Supabase)
   - Method: POST
   - URL: {{ $env.SUPABASE_URL }}/rest/v1/videos
   - Headers:
       - apikey: {{ $env.SUPABASE_ANON_KEY }} (but better: use service key in n8n credentials)
       - Authorization: Bearer {{ $env.SUPABASE_SERVICE_KEY }}
       - Content-Type: application/json
   - Body (raw JSON):
     {
       "user_id": "{{ $json["message"]["from"]["id"] }}",   // or map telegram_id -> user_id via select
       "file_url": "{{ $json["secure_url"] }}",
       "status": "pending"
     }

7) Return Telegram message (via Telegram node or HTTP)
   - Notify user via /sendMessage: "✅ Video saved, queued for posting."

Important:
- Map Telegram `from.id` to `users.id` in Supabase. You may need a lookup step: SELECT users where telegram_id = from.id.
- When using service key, store it securely in n8n Credentials (do not expose anon key on client).
