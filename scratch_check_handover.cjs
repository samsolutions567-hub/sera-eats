const fs = require('fs');

const html = fs.readFileSync('index.html', 'utf8');

const match = html.match(/<script type="framer\/handover" id="__framer__handoverData">([\s\S]*?)<\/script>/);
if (match) {
  const data = match[1];
  console.log('Handover data length:', data.length);
  console.log('Includes Saladify:', data.includes('Saladify'));
  console.log('Includes saladify:', data.includes('saladify'));
  console.log('Includes Sera Eats:', data.includes('Sera Eats'));
  console.log('Includes Order From:', data.includes('Order From'));
  console.log('Includes changed the way:', data.includes('changed the way'));
} else {
  console.log('No handover data found');
}
