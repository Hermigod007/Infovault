const express = require("express");
const redis = require("redis");
const axios = require("axios");

// Create Redis client
const redisClient = redis.createClient();

redisClient.on("error", (err) => {
  console.error("Redis error:", err);
});

const app = express();
const PORT = process.env.PORT || 5000;

app.use(express.json());
Y;

const fetchStackOverflowResults = async (query) => {
  const response = await axios.get(`https://api.stackoverflow.com/2.2/search`, {
    params: {
      intitle: query,
      site: "stackoverflow",
    },
  });
  return response.data.items;
};

const fetchRedditResults = async (query) => {
  const response = await axios.get(`https://www.reddit.com/search.json`, {
    params: { q: query },
  });
  return response.data.data.children.map((child) => child.data);
};

// Function to get cached data or fetch new data
const getSearchResults = async (query) => {
  const cachedResults = await redisClient.getAsync(query);
  if (cachedResults) {
    console.log("Returning cached results");
    return JSON.parse(cachedResults);
  }

  console.log("Fetching new data from APIs");
  const stackOverflowResults = await fetchStackOverflowResults(query);
  const redditResults = await fetchRedditResults(query);

  const combinedResults = [
    ...stackOverflowResults.map((item) => ({
      title: item.title,
      summary: item.body,
      link: item.link,
      upvotes: item.score || 0,
      date: item.creation_date,
    })),
    ...redditResults.map((item) => ({
      title: item.title,
      summary: item.selftext || "No summary available",
      link: `https://www.reddit.com${item.permalink}`,
      upvotes: item.ups || 0,
      date: item.created_utc * 1000,
    })),
  ];

  // Cache the results in Redis for 1 hour (3600 seconds)
  redisClient.setex(query, 3600, JSON.stringify(combinedResults));

  return combinedResults;
};

// Route to handle search queries
app.get("/search", async (req, res) => {
  const { query } = req.query;
  if (!query) {
    return res.status(400).json({ error: "Query parameter is required" });
  }

  try {
    const results = await getSearchResults(query);
    res.json(results);
  } catch (error) {
    console.error("Error fetching results:", error);
    res.status(500).json({ error: "An error occurred while fetching results" });
  }
});

// Start the server
app.listen(8001, () => {
  console.log(`Server running on port ${8001}`);
});
