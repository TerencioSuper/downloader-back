const express = require("express");
const router = express.Router();
const ytdl = require("ytdl-core");
const cp = require("child_process");
const ffmpegPath = require("ffmpeg-static");

router.get("/download/:id/:quality", async (req, res) => {
  const { id, quality } = req.params;
  const { formats } = await ytdl.getInfo(id);

  const videoFormat = formats.find(
    (f) => f.qualityLabel === `${quality}` && f.hasVideo === true
  );
  const audioFormat = formats.find(
    (f) =>
      f.audioChannels &&
      f.audioChannels > 0 &&
      f.hasAudio === true &&
      f.hasVideo === false
  );

  if (!videoFormat || !audioFormat) {
    return res.status(400).json({
      message: "Video not found",
      videoFormat,
      audioFormat,
    });
  }

  const videoStream = ytdl(id, {
    format: videoFormat,
  });

  const audioStream = ytdl(id, {
    format: audioFormat,
  });

  //develope the join of video and audio

  let ffmpegProcess = cp.spawn(
    ffmpegPath,
    [
      // supress non-crucial messages
      "-loglevel",
      "8",
      "-hide_banner",
      // input audio and video by pipe
      "-i",
      "pipe:3",
      "-i",
      "pipe:4",
      // map audio and video correspondingly
      "-map",
      "0:a",
      "-map",
      "1:v",
      // no need to change the codec
        "-c:v",
        "copy",
      // output mp4 and pipe
      "-f",
      "matroska",
      "pipe:5",
    ],
    {
      // no popup window for Windows users
      windowsHide: true,
      stdio: [
        // silence stdin/out, forward stderr,
        "inherit",
        "inherit",
        "inherit",
        // and pipe audio, video, output
        "pipe",
        "pipe",
        "pipe",
      ],
    }
  );
  audioStream.pipe(ffmpegProcess.stdio[3]);
  videoStream.pipe(ffmpegProcess.stdio[4]);
  ffmpegProcess.stdio[5].pipe(res);
});

module.exports = router;
