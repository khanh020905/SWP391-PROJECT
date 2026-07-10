const fs = require("fs");
const path = require("path");

const filePath = "C:\\Users\\Admin\\.gemini\\antigravity-ide\\brain\\bc6dfed1-c031-441d-8378-395cc2c08cda\\.system_generated\\steps\\379\\content.md";

function run() {
  const content = fs.readFileSync(filePath, "utf8");
  
  // Let's strip HTML tags to make it readable text
  const cleanText = content.replace(/<[^>]+>/g, " ");
  
  // Write to a temporary text file so we can view it
  fs.writeFileSync("scripts/cleaned_test_page.txt", cleanText, "utf8");
  console.log("Wrote cleaned text to scripts/cleaned_test_page.txt");
}

run();
