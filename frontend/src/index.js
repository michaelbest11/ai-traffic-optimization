// src/index.js
import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css"; // Tailwind + Leaflet styles
import App from "./App";

/**
 * Dynamically load Google Maps API
 */
function loadGoogleMaps(apiKey) {
  return new Promise((resolve, reject) => {
    // Avoid loading twice
    if (window.google && window.google.maps) {
      resolve(window.google.maps);
      return;
    }

    const script = document.createElement("script");
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`;
    script.async = true;
    script.defer = true;

    script.onload = () => resolve(window.google.maps);
    script.onerror = (err) => reject(err);

    document.body.appendChild(script);
  });
}

// Load Google Maps BEFORE React renders
loadGoogleMaps(process.env.REACT_APP_GOOGLE_MAPS_API_KEY)
  .then(() => {
    console.log("Google Maps loaded successfully");

    const root = ReactDOM.createRoot(document.getElementById("root"));
    root.render(
      <React.StrictMode>
        <App />
      </React.StrictMode>
    );
  })
  .catch((err) => {
    console.error("Failed to load Google Maps API", err);

    const root = ReactDOM.createRoot(document.getElementById("root"));
    root.render(
      <React.StrictMode>
        <div style={{ padding: 20, color: "red" }}>
          Failed to load Google Maps API.  
          Check your API key or billing settings.
        </div>
      </React.StrictMode>
    );
  });
