
// Importing the necessary libraries
const express = require("express"); 
const cors = require("cors"); 
const puppeteer = require("puppeteer"); 

// Initiating the express 
const app = express();
const port = process.env.PORT || 3000; 

// Set up middleware to handle the cross-origin requests and to handle JSON data
app.use(cors()); 
app.use(express.json());

// Default route 
app.get("/", (req, res) => {
  res.send("Welcome to the Medium Scraper API!");
});

// When a POST request is made to the /scrape route, the server scrapes articles
app.post("/scrape", async (req, res) => { 

  const { topic } = req.body; 
  

  if (!topic || topic.trim() === '') { 
    return res.status(400).send({ error: "Search term is required." }); 
  }

  // Try to scrape the articles
  try {
    const articles = await scrapeArticles(topic);
    
    // If no articles were found, send an error message
    if (articles.length === 0) {
      return res.status(404).send({ error: "No articles found." });
    }

    res.status(200).send(articles); 

  } catch (err) {
    // Log the error and send an error response if something goes wrong during the scraping 
    console.error(err);
    res.status(500).send({ error: "Failed to scrape articles" });
  }
});


async function scrapeArticles(topic) {

  const browser = await puppeteer.launch({ args: ["--no-sandbox", "--disable-setuid-sandbox"] });
  const page = await browser.newPage();

  // Go to the Medium search page for the provided topic
  await page.goto(`https://medium.com/search?q=${encodeURIComponent(topic)}`, { waitUntil: "networkidle2" });

  // Evaluate JavaScript within the page to scrape the articles
  const articles = await page.evaluate(() => {


    // Initialize the array of scraped articles
    const scrapedArticles = [];

    // Select all the article elements and create an array
    const articleNodes = Array.from(document.querySelectorAll("article")).slice(0, 5);

    // For each article, extract the data and add it to the array
    articleNodes.forEach((article) => {
      const title = article.querySelector("h2") ? article.querySelector("h2").innerText : "No title";
      const author = article.querySelector('p') ? article.querySelector('p').innerText : "No author";
      const date = article.querySelector("span") ? article.querySelector("span").innerText : "No date";
      const url = article.querySelector("a") ? article.querySelector("a").href : "No URL";

      scrapedArticles.push({ title, author, date, url });
    });

    return scrapedArticles; // Return the array of scraped articles
  });

  await browser.close();
  
  // Return the array of scraped articles
  return articles;
}

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
