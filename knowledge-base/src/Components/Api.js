// src/api.js

const STACK_OVERFLOW_API_KEY = "rl_pwUJSeo6R2q3mxsVyeTb1grdd"; // Replace with your actual API key

export const fetchStackOverflowResults = async (query) => {
  const response = await fetch(
    `https://api.stackexchange.com/2.3/search?order=desc&sort=activity&intitle=${encodeURIComponent(
      query
    )}&site=stackoverflow&key=${STACK_OVERFLOW_API_KEY}`
  );

  if (!response.ok) {
    throw new Error("Failed to fetch data from Stack Overflow");
  }

  const data = await response.json();
  return data.items;
};

export const fetchRedditResults = async (query) => {
  const response = await fetch(
    `https://www.reddit.com/search.json?q=${encodeURIComponent(query)}`
  );

  if (!response.ok) {
    throw new Error("Failed to fetch data from Reddit");
  }

  const data = await response.json();
  return data.data.children.map((child) => child.data);
};
