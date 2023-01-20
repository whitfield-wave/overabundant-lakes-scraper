# overabundant-lakes-scraper

I built this tool to consolidate all of the location data of lakes deemed "over-abundant" by the  Washington Department of Fish and Wildlife (WDFW). I used [cheerio](https://www.npmjs.com/package/cheerio/v/1.0.0-rc.3) to parse the HTML and axios to make the fetch requests. 

Because some counties have enough lakes to paginate, after scraping the first set of results, the HTML is parsed to see if a paging element is included. If so, a loop is entered to get the data from each page. 