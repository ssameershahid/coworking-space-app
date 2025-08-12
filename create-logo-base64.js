import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Read the logo file and convert to base64
const logoPath = path.join(__dirname, 'attached_assets', 'calmkaaj logo_1755026957463.png');
const logoBuffer = fs.readFileSync(logoPath);
const logoBase64 = logoBuffer.toString('base64');

console.log('data:image/png;base64,' + logoBase64);