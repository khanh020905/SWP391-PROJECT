const fs = require('fs');
const path = require('path');
const https = require('https');

const fontsDir = path.join(__dirname, '../public/assets/fonts');

if (!fs.existsSync(fontsDir)) {
  fs.mkdirSync(fontsDir, { recursive: true });
}

const regularUrls = [
  'https://raw.githubusercontent.com/googlefonts/nunito/master/fonts/ttf/Nunito-Regular.ttf',
  'https://raw.githubusercontent.com/googlefonts/nunito/main/fonts/ttf/Nunito-Regular.ttf',
  'https://raw.githubusercontent.com/google/fonts/main/ofl/nunito/static/Nunito-Regular.ttf',
  'https://raw.githubusercontent.com/google/fonts/main/ofl/nunito/Nunito%5Bwght%5D.ttf' // variable fallback
];

const boldUrls = [
  'https://raw.githubusercontent.com/googlefonts/nunito/master/fonts/ttf/Nunito-Bold.ttf',
  'https://raw.githubusercontent.com/googlefonts/nunito/main/fonts/ttf/Nunito-Bold.ttf',
  'https://raw.githubusercontent.com/google/fonts/main/ofl/nunito/static/Nunito-Bold.ttf',
  'https://raw.githubusercontent.com/google/fonts/main/ofl/nunito/Nunito%5Bwght%5D.ttf' // fallback to same variable font
];

function download(url, dest) {
  return new Promise((resolve, reject) => {
    https.get(url, (response) => {
      if (response.statusCode >= 300 && response.statusCode < 400 && response.headers.location) {
        download(response.headers.location, dest).then(resolve).catch(reject);
        return;
      }
      
      if (response.statusCode !== 200) {
        reject(new Error(`Status code ${response.statusCode}`));
        return;
      }
      
      const file = fs.createWriteStream(dest);
      response.pipe(file);
      file.on('finish', () => {
        file.close(() => resolve());
      });
    }).on('error', (err) => {
      fs.unlink(dest, () => {});
      reject(err);
    });
  });
}

async function downloadBest(urls, name) {
  const dest = path.join(fontsDir, name);
  for (const url of urls) {
    console.log(`Trying to download ${name} from ${url}...`);
    try {
      await download(url, dest);
      console.log(`✓ Successfully downloaded ${name} from ${url}`);
      return true;
    } catch (err) {
      console.log(`✗ Failed: ${err.message}`);
    }
  }
  return false;
}

async function main() {
  console.log('Downloading fonts to:', fontsDir);
  
  const regOk = await downloadBest(regularUrls, 'Nunito-Regular.ttf');
  const boldOk = await downloadBest(boldUrls, 'Nunito-Bold.ttf');
  
  if (!regOk || !boldOk) {
    console.error('Failed to download regular or bold fonts from all sources.');
    process.exit(1);
  }
  
  console.log('Fonts downloaded successfully!');
}

main();
