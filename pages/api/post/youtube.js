import { google } from "googleapis"
import { getSupabase } from "@/lib/supabase"

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" })
  }

  try {
    const { videoId } = req.body // our Supabase "videos.id"
    const supabase = getSupabase()

    // 1. Fetch video metadata from Supabase
    const { data: video, error } = await supabase
      .from("videos")
      .select("*")
      .eq("id", videoId)
      .single()

    if (error || !video) {
      return res.status(404).json({ error: "Video not found" })
    }

    // 2. Setup OAuth client
    const oauth2Client = new google.auth.OAuth2(
      process.env.YOUTUBE_CLIENT_ID,
      process.env.YOUTUBE_CLIENT_SECRET,
      "http://localhost:3000/api/auth/youtube/callback" // redirect URI
    )

    // (⚠️ In production, tokens will be stored in Supabase per-user)
    oauth2Client.setCredentials({
      access_token: video.youtube_access_token,
      refresh_token: video.youtube_refresh_token,
    })

    const youtube = google.youtube({ version: "v3", auth: oauth2Client })

    // 3. Upload video to YouTube
    const response = await youtube.videos.insert({
      part: "snippet,status",
      requestBody: {
        snippet: {
          title: "My Uploaded Video",
          description: "Uploaded via our platform 🚀",
          tags: ["automation", "supabase", "cloudinary"],
        },
        status: {
          privacyStatus: "private", // can be "public", "unlisted", or "private"
        },
      },
      media: {
        body: await fetch(video.cloudinary_url).then((r) => r.body), // stream from Cloudinary
      },
    })

    // 4. Update Supabase status
    await supabase
      .from("videos")
      .update({ status: "posted", posted_at: new Date() })
      .eq("id", videoId)

    res.status(200).json({
      message: "Video uploaded to YouTube ✅",
      youtubeVideoId: response.data.id,
    })
  } catch (err) {
    console.error("YouTube upload error:", err)
    res.status(500).json({ error: "Upload failed", details: err.message })
  }
}
