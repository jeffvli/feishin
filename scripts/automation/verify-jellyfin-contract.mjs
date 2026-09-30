const serverUrl = process.argv[2] || 'http://127.0.0.1:8096';
const endpoint = new URL('/System/Info/Public', serverUrl);

const response = await fetch(endpoint);
if (!response.ok) {
    throw new Error(`Jellyfin public information returned HTTP ${response.status}`);
}

const body = await response.json();
const requiredStrings = ['Id', 'ProductName', 'ServerName', 'Version'];

for (const property of requiredStrings) {
    if (typeof body[property] !== 'string') {
        throw new Error(`Jellyfin public information is missing string property ${property}`);
    }
}

if (!body.ProductName.toLowerCase().includes('jellyfin')) {
    throw new Error(`Unexpected Jellyfin ProductName: ${body.ProductName}`);
}

console.log(`Validated ${body.ProductName} ${body.Version} contract at ${endpoint}`);
