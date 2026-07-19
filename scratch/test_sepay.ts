import fs from "fs";
import path from "path";

async function run() {
  let token = "";
  try {
    const envPath = path.join(process.cwd(), ".env");
    if (fs.existsSync(envPath)) {
      const content = fs.readFileSync(envPath, "utf-8");
      const lines = content.split("\n");
      for (const line of lines) {
        if (line.startsWith("SEPAY_API_TOKEN=")) {
          token = line.split("=")[1].replace(/['"\r\n]/g, "").trim();
        }
      }
    }
  } catch (err: any) {
    console.error("Error reading .env:", err.message);
  }

  if (!token) {
    console.error("No SEPAY_API_TOKEN found in .env");
    return;
  }

  console.log("Testing token:", token.substring(0, 10) + "..." + token.substring(token.length - 10));
  
  const urls = [
    "https://userapi.sepay.vn/v2/transactions?limit=5",
    "https://userapi-sandbox.sepay.vn/v2/transactions?limit=5"
  ];

  for (const url of urls) {
    console.log(`\nCalling URL: ${url}`);
    try {
      const res = await fetch(url, {
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        }
      });
      console.log(`Response status: ${res.status} ${res.statusText}`);
      const text = await res.text();
      console.log("Response body:", text);
    } catch (err: any) {
      console.error("Error:", err.message);
    }
  }
}

run();
