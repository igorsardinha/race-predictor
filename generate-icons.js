const fs = require('fs');
const path = require('path');

// Simple valid 1x1 transparent PNG expanded or base64 icon
const base64Png = "iVBORw0KGgoAAAANSUhEUgAAAMAAAADACAYAAABS3GwHAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwAADsMAAA7DAcdvqGQAAABTSURBVHhe7cExAQAAAMKg9U9tCy8gAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAD4M2cAAAYK0W44AAAAASUVORK5CYII=";
const buffer = Buffer.from(base64Png, 'base64');

const pubDir = path.join(__dirname, 'public');
if (!fs.existsSync(pubDir)) {
  fs.mkdirSync(pubDir, { recursive: true });
}

fs.writeFileSync(path.join(pubDir, 'icon-192.png'), buffer);
fs.writeFileSync(path.join(pubDir, 'icon-512.png'), buffer);
console.log('Icons generated successfully');
