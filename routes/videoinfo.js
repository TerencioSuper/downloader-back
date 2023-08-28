//videoinfo route

const express = require("express");
const ytdl = require("ytdl-core");

const router = express.Router();
const ytsr = require("ytsr");

router.get("/video/:id", (req, res) => {
  const { id } = req.params;

  ytsr(id, { limit: 1, type: "video" })
    .then(async (video) => {
      const info = await ytdl.getInfo(video.items[0].id);

      const formats = new Set();

      info.formats.forEach((format) => {
        if (format.qualityLabel) {
          formats.add(format.qualityLabel);
        }
      });

      const formatList = [...formats];

      const qualities = formatList.sort((a, b) => {
        const aNum = parseInt(a.slice(0, -1));
        const bNum = parseInt(b.slice(0, -1));

        return aNum - bNum;
      });

      const newVideo = {
        ...video.items[0],
        qualities,
      };

      res.json(newVideo);
    })
    .catch((err) => {
      console.log(err);
    });
});

module.exports = router;
