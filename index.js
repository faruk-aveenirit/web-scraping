const puppeteer = require("puppeteer");

const knex = require('knex')({
  client: 'mysql',
  connection: {
    host: '127.0.0.1',
    port: 3306,
    user: 'root',
    password: '',
    database: 'bangkok_hospital'
  }
});

const downloadImage = require('./imageDownloader');

// const imageUrl = 'https://example.com/image.jpg';
const destination = './doctors';

downloadImage('https://epms.bdms.co.th/media/images/photos/BHQ/25660105_044645.JPG',)
const Doctor = () => knex('doctors')

const Specialty = () => knex('doctors')
const timestamp = Date.now();
// starting Puppeteer
puppeteer
  .launch()
  .then(async (browser) => {
    const page = await browser.newPage();
    await page.goto("https://www.bangkokhospital.com/en/doctor");
    //Wait for the page to be loaded
    await page.waitForSelector(".card-wrapper");

    let allFruits = await page.evaluate(() => {
      const fruitsList = document.body.querySelectorAll(".card-wrapper");

      let fruits = [];

      fruitsList.forEach(async (value) => {
        // const checkSpec = await knex('specialties').select('id').where({ name: 'Tim' });
        // console.log(checkSpec);
        const title = value.querySelector('h6');
        const specialty = value.querySelector('p');
        const subSpecialty = value.querySelector('.-sub-specialty');
        const sub_specialty = subSpecialty ? subSpecialty.innerText : "";
        const img = value.querySelector('.-image-size');
        const style = img.currentStyle || window.getComputedStyle(img, false),
          bi = style.backgroundImage.slice(4, -1).replace(/"/g, "");
          downloadImage(img.getAttribute('data-src'), destination);
        fruits.push({
          title: title.innerText,
          specialty: specialty.innerText,
          subSpecialty: sub_specialty,
          img: img.getAttribute('data-src'),
          created_at: timestamp,
          updated_at: timestamp,
        });
      });
      return fruits;
    });

    const insertedRows = await knex('doctors').insert(fruits);

    // closing the browser
    await browser.close();
  })
  .catch(function (err) {
    console.error(err);
  });
