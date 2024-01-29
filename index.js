const axios = require('axios');
const cheerio = require('cheerio');
const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

// URL of the website to scrape
const url = 'https://www.bangkokhospital.com/en/doctor';

async function scrapeWithPuppeteer(url, totalPages = 1) {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();

  const backgroundImageUrls = [];

  for (let currentPage = 1; currentPage <= totalPages; currentPage++) {
    const pageUrl = `${url}?page=${currentPage}`;

    await page.goto(pageUrl, { waitUntil: 'domcontentloaded' });
    // Wait for all background images to be loaded
    await page.waitForSelector('.card-wrapper', { visible: true });

    // Scroll to load more images
    await autoScroll(page);
    // Introduce a 5-second delay
    await page.waitForTimeout(20000);
    // await page.waitForFunction(() => {
    //   const images = document.querySelectorAll('.card-wrapper .-image-size');
    //   return Array.from(images).every(img => img.complete);
    // });
    // Extract background images using Puppeteer
    const pageBackgroundImageUrls = await page.evaluate(() => {
      const doctorCards = document.querySelectorAll('.card-wrapper');
      const backgroundImages = [];

      doctorCards.forEach(card => {
        const title = card.querySelector('h6');
        const specialty = card.querySelector('p');
        const subSpecialty = card.querySelector('.-sub-specialty');
        const sub_specialty = subSpecialty ? subSpecialty.innerText : "";
        const img = card.querySelector('.-image-size');
        const style = img.currentStyle || window.getComputedStyle(img, false),
          bi = style.backgroundImage.slice(4, -1).replace(/"/g, "");
        const backgroundImage = window.getComputedStyle(img).getPropertyValue('background-image');
        backgroundImages.push(bi);
        // return bi;
      });
      return backgroundImages;
    });
    backgroundImageUrls.push(...pageBackgroundImageUrls);
  }

  await browser.close();
  return backgroundImageUrls;
}

// Function to download an image
async function downloadImage(url, destination) {
  const response = await axios.get(url, { responseType: 'arraybuffer' });
  fs.writeFileSync(destination, response.data);
  console.log(`Image downloaded to: ${destination}`);
}

// Make a GET request to the website to get the doctor list
axios.get(url)
  .then(async response => {
    const html = response.data;
    const $ = cheerio.load(html);

    // Select the elements containing doctor cards
    const doctorCards = $('.doctor-card');

    // Create a directory to store downloaded images
    // const downloadDir = path.join(__dirname, 'downloaded_images');
    // if (!fs.existsSync(downloadDir)) {
    //   fs.mkdirSync(downloadDir);
    // }

    // Iterate over the doctor cards, extract background image URLs, and download them
    const backgroundImageUrls = await scrapeWithPuppeteer(url);
    backgroundImageUrls.forEach(async (backgroundImage, index) => {
      const downloadDir = path.join(__dirname, `downloaded_images/${index + 1}`);
      if (!fs.existsSync(downloadDir)) {
        fs.mkdirSync(downloadDir);
      }
      // Extract the URL from the style attribute
      // const imageUrl = backgroundImage.match(/url\("(.+)"\)/)[1];
      const destination = path.join(downloadDir, `doctor_${index + 1}.jpg`);

      // Download the image
      await downloadImage(backgroundImage, destination);
    });
  })
  .catch(error => {
    console.error(`Error fetching the page: ${error.message}`);
  });

async function autoScroll(page) {
  await page.evaluate(async () => {
    await new Promise((resolve, reject) => {
      let totalHeight = 0;
      const distance = 100;
      const maxScrollAttempts = 10;
      let scrollAttempts = 0;

      const scrollInterval = setInterval(() => {
        const scrollHeight = document.body.scrollHeight;
        window.scrollBy(0, distance);
        totalHeight += distance;

        if (totalHeight >= scrollHeight || scrollAttempts >= maxScrollAttempts) {
          clearInterval(scrollInterval);
          resolve();
        }
        scrollAttempts++;
      }, 1000); // Adjust the interval as needed
    });
  });
}