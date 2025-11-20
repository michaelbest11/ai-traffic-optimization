import React from "react";

/*
  routes = [{start,end,alternatives:[{id,route:[{lat,lng}],color,trafficLevel,liveImage}]}]
*/

export default function RouteList({ routes = [], selectedRoute, onSelectRoute }) {
  return (
    <div className="route-card">
      <h3>Routes & Alternatives</h3>
      <div className="route-list">
        {routes.slice(0, 40).map((r, idx) => (
          <div
            key={`${r.start}_${r.end}_${idx}`}
            className={`route-item ${selectedRoute === r ? "selected" : ""}`}
            onClick={() => onSelectRoute(r)}
          >
            <div className="route-header">
              <strong>
                {r.start} → {r.end}
              </strong>
              <div className="traffic-badge">{r.alternatives[0]?.trafficLevel || "N/A"}</div>
            </div>

            <div className="alt-list">
              {r.alternatives.map((alt, aidx) => (
                <div key={alt.id || aidx} className="alt-item">
                  <div>Alt {aidx + 1} • {alt.trafficLevel}</div>
                  <img
                    src={alt.liveImage || `${process.env.PUBLIC_URL}/feed/placeholder.jpg`}
                    alt={`alt-${aidx}`}
                    width="120"
                    height="80"
                  />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
