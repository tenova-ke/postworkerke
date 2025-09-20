import { v2 as cloudinary } from "cloudinary";
import { createClient } from "@supabase/supabase-js";

// Setup Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Setup Supabase
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY // use service key for server-side ops
);

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { file, user_id, platform } = req.body;

    if (!file || !user_id || !platform) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    // Upload file to Cloudinary
    const uploadResponse = await cloudinary.uploader.upload(file, {
      resource_type: "video",
      folder: "user_uploads",
    });

    // Store metadata in Supabase
    const { data, error } = await supabase
      .from("videos")
      .insert([
        {
          user_id,
          platform,
          cloudinary_url: uploadResponse.secure_url,
          public_id: uploadResponse.public_id,
          status: "uploaded",
        },
      ]);

    if (error) throw error;

    res.status(200).json({
      message: "Upload successful",
      video: uploadResponse.secure_url,
      supabase: data,
    });
  } catch (err) {
    console.error("Upload error:", err);
    res.status(500).json({ error: "Upload failed", details: err.message });
  }
}
