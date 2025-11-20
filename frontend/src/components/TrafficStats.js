import React from "react";

export default function TrafficStats({ trafficData }) {
  if (!trafficData) return null;
  const summary = trafficData.summary || {};
  return (
    <div className="stats-card">
      <h3>Traffic Summary</h3>
      <div className="stats-grid">
        <div className="stat">
          <div className="stat-value">{summary.total_intersections ?? "—"}</div>
          <div className="stat-label">Monitored Intersections</div>
        </div>
        <div className="stat">
          <div className="stat-value">{summary.high_congestion ?? "—"}</div>
          <div className="stat-label">High Congestion</div>
        </div>
        <div className="stat">
          <div className="stat-value">{(summary.average_speed ?? 0).toFixed(1)} km/h</div>
          <div className="stat-label">Avg Speed</div>
        </div>
        <div className="stat">
          <div className="stat-value">{new Date(trafficData.timestamp || Date.now()).toLocaleString()}</div>
          <div className="stat-label">Updated</div>
        </div>
      </div>
    </div>
  );
}
