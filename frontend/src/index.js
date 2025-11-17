
// src/index.js
import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css"; // Tailwind + Leaflet styles
import App from "./App";

// React 18+ root
const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
