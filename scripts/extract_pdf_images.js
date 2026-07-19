const fs = require("fs");
const pdf = require("pdf-parse");
const path = require("path");

const pdfPath = "C:\\Users\\Admin\\Downloads\\TỔNG HỢP ĐỀ THI IELTS WRITING THẬT 2025.pdf";

async function run() {
  const dataBuffer = fs.readFileSync(pdfPath);
  console.log("Loading PDF...");
  const parser = new pdf.PDFParse({ data: dataBuffer });
  
  console.log("Extracting images from pages 1-5...");
  const imgResult = await parser.getImage({
    partial: [1, 2, 3, 4, 5],
    imageThreshold: 150 // threshold to ignore small logos
  });
  
  console.log(`Extracted total ${imgResult.total} large images.`);
  
  if (!fs.existsSync("scratch")) {
    fs.mkdirSync("scratch");
  }
  
  imgResult.pages.forEach(p => {
    if (p.images && p.images.length > 0) {
      p.images.forEach((img, idx) => {
        const outPath = `scratch/page_${p.pageNumber}_img_${idx}.png`;
        fs.writeFileSync(outPath, img.data);
        console.log(`Saved: ${outPath} (${img.width}x${img.height})`);
      });
    }
  });
}

run().catch(console.error);
