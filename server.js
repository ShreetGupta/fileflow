const express = require("express");
const multer = require("multer");
const sharp = require("sharp");
const ffmpeg = require("fluent-ffmpeg");
const ffmpegPath = require("ffmpeg-static");
const fs = require("fs");
const { PDFDocument } = require("pdf-lib");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.static("public"));
app.use(express.json());

ffmpeg.setFfmpegPath(ffmpegPath);

if (!fs.existsSync("uploads")) fs.mkdirSync("uploads");
if (!fs.existsSync("compressed")) fs.mkdirSync("compressed");

const upload = multer({ dest: "uploads/" });

/* ================= IMAGE ================= */
app.post("/process-image", upload.array("files"), async (req, res) => {
    const { quality, format } = req.body;
    const results = [];

    for (let file of req.files) {
        const outputPath = `compressed/${Date.now()}-${file.originalname}.${format}`;

        await sharp(file.path)
            .toFormat(format, { quality: parseInt(quality) })
            .toFile(outputPath);

        const originalSize = fs.statSync(file.path).size;
        const newSize = fs.statSync(outputPath).size;

        results.push({
            file: outputPath,
            saved: ((originalSize - newSize) / originalSize * 100).toFixed(2)
        });
    }

    res.json(results);
});

/* ================= PDF ================= */
app.post("/compress-pdf", upload.array("files"), async (req, res) => {
    const results = [];

    for (let file of req.files) {
        const input = fs.readFileSync(file.path);
        const pdfDoc = await PDFDocument.load(input);
        const compressedPdf = await pdfDoc.save({ useObjectStreams: true });

        const outputPath = `compressed/${Date.now()}-${file.originalname}`;
        fs.writeFileSync(outputPath, compressedPdf);

        results.push({ file: outputPath });
    }

    res.json(results);
});

/* ================= VIDEO ================= */
app.post("/process-video", upload.array("files"), async (req, res) => {
    const { crf, format } = req.body;
    const results = [];

    for (let file of req.files) {
        const outputPath = `compressed/${Date.now()}-${file.originalname}.${format}`;

        await new Promise((resolve) => {
            ffmpeg(file.path)
                .outputOptions(["-vcodec libx264", `-crf ${crf}`])
                .toFormat(format)
                .on("end", resolve)
                .save(outputPath);
        });

        results.push({ file: outputPath });
    }

    res.json(results);
});

/* AUTO CLEANUP every 1 hour */
setInterval(() => {
    fs.readdir("compressed", (err, files) => {
        if (files) {
            files.forEach(file => {
                fs.unlinkSync(`compressed/${file}`);
            });
        }
    });
}, 60 * 60 * 1000);

app.listen(process.env.PORT, () => {
  console.log("🔥 Server running");
});