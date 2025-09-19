const express = require('express');
const { spawn } = require('child_process');
const axios = require('axios');
const fs = require('fs');
const path = require('path');

const app = express();
app.use(express.json());

const TMP_DIR = process.env.TMP_DIR || '/tmp/media';
if (!fs.existsSync(TMP_DIR)) fs.mkdirSync(TMP_DIR, { recursive: true });

/**
 * POST /assemble
 * body: { video_url, audio_url (optional) }
 * Returns: { output_path }
 */
app.post('/assemble', async (req, res) => {
  try {
    const { video_url, audio_url, output_name } = req.body;
    if (!video_url) return res.status(400).json({ error: 'video_url required' });

    const vidPath = path.join(TMP_DIR, `in_vid_${Date.now()}.mp4`);
    const audPath = audio_url ? path.join(TMP_DIR, `in_aud_${Date.now()}.mp3`) : null;
    const outPath = path.join(TMP_DIR, output_name || `out_${Date.now()}.mp4`);

    // download video
    const vResp = await axios({ url: video_url, responseType: 'stream' });
    await new Promise((resolve, reject) => {
      const w = fs.createWriteStream(vidPath);
      vResp.data.pipe(w);
      w.on('finish', resolve);
      w.on('error', reject);
    });

    if (audio_url) {
      const aResp = await axios({ url: audio_url, responseType: 'stream' });
      await new Promise((resolve, reject) => {
        const w = fs.createWriteStream(audPath);
        aResp.data.pipe(w);
        w.on('finish', resolve);
        w.on('error', reject);
      });
    }

    // Build ffmpeg args: if audio supplied, replace audio stream. Otherwise keep original.
    let args;
    if (audio_url) {
      args = ['-y', '-i', vidPath, '-i', audPath, '-c:v', 'copy', '-map', '0:v:0', '-map', '1:a:0', '-shortest', outPath];
    } else {
      // No audio replacement — copy input to output (re-mux)
      args = ['-y', '-i', vidPath, '-c', 'copy', outPath];
    }

    const ff = spawn('ffmpeg', args);

    ff.stderr.on('data', data => {
      // console.log('ffmpeg:', data.toString());
    });

    ff.on('close', code => {
      if (code !== 0) {
        return res.status(500).json({ error: 'ffmpeg failed', code });
      }
      return res.json({ output_path: outPath });
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

const PORT = process.env.MEDIA_WORKER_PORT || 4000;
app.listen(PORT, () => console.log(`media-worker listening on ${PORT}`));
