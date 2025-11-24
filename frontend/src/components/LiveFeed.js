import React, { useEffect, useRef, useState } from "react";
import Hls from "hls.js";

export default function LiveFeed({ camera }) {
  const videoRef = useRef(null);
  const hls = useRef(null);
  const [loading, setLoading] = useState(true);
  const [errorState, setErrorState] = useState(null);

  useEffect(() => {
    setLoading(true);
    setErrorState(null);

    if (!camera) return;

    // Cleanup old instances when switching cameras
    if (hls.current) {
      hls.current.destroy();
      hls.current = null;
    }

    if (camera.type === "hls") {
      // Browser supports HLS.js
      if (Hls.isSupported()) {
        const instance = new Hls({ enableWorker: true });

        instance.loadSource(camera.url);
        instance.attachMedia(videoRef.current);

        instance.on(Hls.Events.MANIFEST_PARSED, () => {
          setLoading(false);
          videoRef.current.play().catch(() => {});
        });

        instance.on(Hls.Events.ERROR, (evt, data) => {
          console.error("HLS ERROR:", data);

          if (data.fatal) {
            setErrorState("Camera offline or unavailable");

            // Try auto-recover
            if (data.type === Hls.ErrorTypes.NETWORK_ERROR) {
              instance.startLoad();
            } else if (data.type === Hls.ErrorTypes.MEDIA_ERROR) {
              instance.recoverMediaError();
            }
          }
        });

        hls.current = instance;
      } else {
        // Safari (native HLS)
        videoRef.current.src = camera.url;
        videoRef.current.addEventListener("loadedmetadata", () => {
          setLoading(false);
          videoRef.current.play().catch(() => {});
        });
      }
    } else if (camera.type === "mp4") {
      videoRef.current.src = camera.url;
      videoRef.current.onloadeddata = () => {
        setLoading(false);
      };
      videoRef.current.onerror = () => {
        setErrorState("MP4 feed cannot be loaded.");
      };
    }

    return () => {
      if (hls.current) {
        hls.current.destroy();
        hls.current = null;
      }
    };
  }, [camera]);

  if (!camera) return null;

  return (
    <div className="bg-white rounded shadow p-4">
      <h2 className="text-lg font-bold mb-2">
        Live Camera Feed: {camera.title}
      </h2>

      {/* Thumbnail while loading */}
      {loading && (
        <div className="w-full h-64 bg-gray-200 flex items-center justify-center rounded">
          <div className="animate-pulse text-gray-600 text-sm">
            Loading stream…
          </div>
        </div>
      )}

      {/* Error Box */}
      {errorState && (
        <div className="w-full p-3 bg-red-200 text-red-900 rounded mb-2">
          {errorState}
        </div>
      )}

      {/* Video */}
      <video
        ref={videoRef}
        controls
        autoPlay
        muted
        playsInline
        style={{
          width: "100%",
          height: "auto",
          display: loading ? "none" : "block",
          borderRadius: "8px",
        }}
      ></video>

      {/* Thumbnail fallback if stream fails */}
      {errorState && camera.thumbnail && (
        <div className="mt-3">
          <img
            src={camera.thumbnail}
            alt="Camera thumbnail"
            className="rounded border shadow"
          />
        </div>
      )}
    </div>
  );
}
