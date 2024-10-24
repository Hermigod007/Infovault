import React, { useEffect, useState, useRef } from "react";
import "./App.css"; // For styling
import Navbar from "./Components/Navbar";
import {
  fetchStackOverflowResults,
  fetchRedditResults,
} from "./Components/Api"; // Import your API functions

function App() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [typedText, setTypedText] = useState(""); // State for typed text

  // New state variables for filtering and sorting
  const [sortCriteria, setSortCriteria] = useState("relevance");
  const [filter, setFilter] = useState("");
  const [email, setEmail] = useState(""); // To store the user's email input
  const [emailSent, setEmailSent] = useState(false); // To indicate if the email was sent

  const typingTimeoutRef = useRef(null); // Ref to store the timeout

  // Typing effect function
  const typeText = (text, index) => {
    if (index < text.length) {
      setTypedText((prev) => prev + text.charAt(index));
      typingTimeoutRef.current = setTimeout(
        () => typeText(text, index + 1),
        100
      ); // Store timeout in ref
    }
  };

  useEffect(() => {
    // Start typing effect when component mounts
    setTypedText(""); // Reset typedText before starting the animation

    typeText("Search and Get Answers to your every question !!", 0);

    // Clear the timeout if the component unmounts
    return () => {
      clearTimeout(typingTimeoutRef.current);
    };
  }, []);

  const handleSearch = async (e) => {
    e.preventDefault();
    console.log("Search for:", query);
    setLoading(true);
    setError(null);

    try {
      const stackOverflowResults = await fetchStackOverflowResults(query);
      const redditResults = await fetchRedditResults(query);

      const combinedResults = [
        ...stackOverflowResults.map((item) => ({
          title: item.title,
          summary: item.body,
          link: item.link,
          upvotes: item.score || 0, // Example field for sorting
          date: item.creation_date, // Example field for sorting
        })),
        ...redditResults.map((item) => ({
          title: item.title,
          summary: item.selftext || "No summary available",
          link: `https://www.reddit.com${item.permalink}`,
          upvotes: item.ups || 0, // Example field for sorting
          date: item.created_utc * 1000, // Convert to milliseconds for sorting
        })),
      ];

      setResults(combinedResults);
    } catch (error) {
      console.error("Error fetching results:", error);
      setError("An error occurred while fetching results.");
    } finally {
      setLoading(false);
    }
  };

  const sortedResults = () => {
    return [...results]
      .sort((a, b) => {
        if (sortCriteria === "date") {
          return b.date - a.date;
        }
        if (sortCriteria === "upvotes") {
          return b.upvotes - a.upvotes;
        }
        return 0;
      })
      .filter(
        (result) =>
          result.title.toLowerCase().includes(filter.toLowerCase()) ||
          result.summary.toLowerCase().includes(filter.toLowerCase()) // Filter by title or summary
      );
  };

  // Function to generate email content
  const generateEmailContent = () => {
    let emailContent = "Here are the search results:\n\n";
    sortedResults().forEach((result, index) => {
      emailContent += `${index + 1}. ${result.title}\n${result.summary}\n${
        result.link
      }\n\n`;
    });
    return emailContent;
  };

  // Function to send email
  const handleSendEmail = () => {
    const subject = encodeURIComponent("Your Search Results");
    const body = encodeURIComponent(generateEmailContent());
    const mailtoLink = `mailto:${email}?subject=${subject}&body=${body}`;

    // Open mail client with pre-filled email
    window.location.href = mailtoLink;

    setEmailSent(true);
  };

  return (
    <div className="App">
      <Navbar />
      <h1 className="typing">
        <br />
        <br />
        <span>
          <b>
            <i>{typedText}</i>
          </b>
        </span>
      </h1>
      <form onSubmit={handleSearch}>
        <input
          className="inputbox"
          type="text"
          placeholder="Enter a search query..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          aria-label="Search query input"
        />
        <button
          className="submitButton"
          type="submit"
          aria-label="Search button"
        >
          {loading ? "Searching..." : "Search"}
        </button>
      </form>

      {/* Filter and Sort Options */}
      <div className="filter-sort">
        <input
          type="text"
          placeholder="Filter results..."
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          aria-label="Filter results"
        />
        <select
          value={sortCriteria}
          onChange={(e) => setSortCriteria(e.target.value)}
          aria-label="Sort results"
        >
          <option value="relevance">Latest</option>
          <option value="date">Date</option>
          <option value="upvotes">Upvotes</option>
        </select>
      </div>

      <div className="results">
        {loading ? (
          <p className="Mids">Loading results...</p>
        ) : error ? (
          <p style={{ color: "red" }}>{error}</p>
        ) : sortedResults().length > 0 ? (
          sortedResults().map((result, index) => (
            <div key={index} className="result">
              <h3>{result.title}</h3>
              <p>{result.summary}</p>
              <a href={result.link} target="_blank" rel="noopener noreferrer">
                Read more
              </a>
            </div>
          ))
        ) : (
          <p>
            <b>
              <i>Let's get started. Try Searching?</i>
            </b>
          </p>
        )}
      </div>

      {/* Email Section */}
      <div className="email-section">
        <h2>
          <b>
            <i>Send Results via Email</i>
          </b>
        </h2>
        <input
          type="email"
          placeholder="Enter recipient's email..."
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          aria-label="Email input"
        />
        <button
          className="submitButton"
          onClick={handleSendEmail}
          disabled={!sortedResults().length || !email}
        >
          Send Email
        </button>
        {emailSent && <p>Email has been sent successfully!</p>}
      </div>
    </div>
  );
}

export default App;
