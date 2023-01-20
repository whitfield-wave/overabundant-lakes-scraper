const cheerio = require('cheerio');
const axios = require('axios');
const fs = require('fs');


const COUNTY_IDS = [59, 37, 63, 60, 38, 132, 69, 72, 43, 67, 68, 40, 76, 42, 62];

// findLakes takes a countyID and retrieves the corresponding county's page html.
// Then scrapeLakes is called and the formatted lake data is returned.
async function findLakes(countyID) {
  let req = await axios.get(`https://wdfw.wa.gov/fishing/locations/high-lakes/overabundant?name=&county=${countyID}&species=`);

  // fetches page HTML
  let html = req.data;
  const $ = cheerio.load(html);

  // Scrapes first page of data
  let lakes = scrapeLakes(html);

  // Pager element on inital request for a given county will have n + 1 li elements, n being the number of data pages.
  // Here we test if the Pager element exists, and if so make requests for all of the pages. 
  let pages = $('.pager').find('li').length - 1;
  if (pages > 0) {
    for (let i = 1; i <= pages; i++) {
      let nextPageReqHTML = await axios.get(`https://wdfw.wa.gov/fishing/locations/high-lakes/overabundant?name=&county=${countyID}&species=&page=${i}`);
      lakes.push(...scrapeLakes(nextPageReqHTML.data));
    }
  }
  return lakes;
}


// main loops through the list of Washington counties and calls findLakes, adds each formated list of lakes to an array. 
// That array is written into a .csv file. 
async function main() {
  let arr = [];
  for (let i = 0; i < COUNTY_IDS.length; i++) {
    let lakes = await findLakes(COUNTY_IDS[i]);
    arr.push(...lakes);
  }

  let data = arr.join('');

  fs.writeFile('./overabundant-lakes.csv', data, (err) => {
    if (err) console.log(err);
    console.log('file created');
  })
}

// scrapeLakes parses the WDFW page, searching for .view-content, which contains the table of results. The loop iterates
// through the table, cleans the data, formats the data into .csv ready strings, and store them in an array. 
function scrapeLakes(html) {
  const $ = cheerio.load(html);

  let lakes = [];

  $('.view-content tr').each((_, ele) => {
    let data = $(ele).children().get();

    let dataText = data.map(ele => $(ele).text().trim());

    const name = dataText[0];
    const county = dataText[3];

    // matches alpha characters
    let regex = /[a-z]/ig;

    const size = dataText[1].replace(regex, '').trim();
    const elevation = dataText[2].replace(regex, '').trim();

    const latitude = dataText[4].split(', ')[0];
    const longitude = dataText[4].split(', ')[1];

    let line = `${name},${county},${size},${elevation},${latitude},${longitude}\n`;
    if (name !== 'Name') lakes.push(line);

  });
  return lakes;
}

main();