import React from "react";

/*
  Expects intersections = [{id,name,lat,lng,feed}]
  Tries local public feed path first, falls back to remote placeimg
  Local path example: `${process.env.PUBLIC_URL}/feed/accra/accra_cam1.jpg`
*/

function chooseLocalOrRemote(intersection) {
  // If feed string contains 'placeimg' or 'http' use as-is
  if (!intersection.feed) return null;
  if (/^https?:\/\//i.test(intersection.feed)) return intersection.feed;
  // treat feed as a local filename under PUBLIC_URL
  return `${process.env.PUBLIC_URL}${intersection.feed}`;
}

export default function LiveFeed({ intersections = [] }) {
  return (
    <div className="livefeed-card">
      <h3>Live Feeds</h3>
      <div className="feed-grid">
        {intersections.map((i) => {
          const src = chooseLocalOrRemote(i);
          if (!src) return null;
          const isVideo = src.toLowerCase().endsWith(".mp4");
          return (
            <div key={i.id} className="feed-item">
              <div className="feed-title">{i.name}</div>
              {isVideo ? (
                <video src={src} width="260" height="160" controls muted playsInline>
                  Your browser does not support the video tag.
                </video>
              ) : (
                <img src={src} alt={i.name} width="260" height="160" />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
