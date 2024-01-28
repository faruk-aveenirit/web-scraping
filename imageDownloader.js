const request = require('request');
const fs = require('fs');

function downloadImage(url, destination) {
  request(url)
    .pipe(fs.createWriteStream(destination))
    .on('close', () => {
      console.log('Image downloaded successfully!');
    })
    .on('error', (err) => {
      console.error('Error downloading the image:', err);
    });
}

module.exports = downloadImage;