import { google } from "googleapis"

export function getYouTubeClient() {
  return google.youtube({
    version: "v3",
    auth: process.env.YOUTUBE_API_KEY,
  })
}
