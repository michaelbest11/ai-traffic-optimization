// src/components/LiveFeed.js
import React, { useEffect, useRef, useState } from "react";
import Hls from "hls.js";
import PropTypes from "prop-types";
import axios from "axios";

/*
Props:
 - selectedCity: string
 - cameras: array of camera objects
 - selectedCamera: camera object (optional)
 - onSelectCamera: function(camera)
*/
export default function LiveFeed({ selectedCity, cameras = [], selectedCamera, onSelectCamera }) {
  const [activeCam, setActiveCam] = useState(selectedCamera || (cameras && cameras[0]) || null);
  const videoRef = useRef(null);
  const iframeRef = useRef(null);
  const [error, setError] = useState(null);
  const [clipStart, setClipStart] = useState("00:00:00");
  const [clipDuration, setClipDuration] = useState(10); // seconds
  const [clips, setClips] = useState([]); // scheduled/created clips (from server)
  const [loadingClip, setLoadingClip] = useState(false);

  // sync external selectedCamera from map/App
  useEffect(() => {
    if (selectedCamera) setActiveCam(selectedCamera);
  }, [selectedCamera]);

  useEffect(() => {
    if (!activeCam && cameras && cameras.length) setActiveCam(cameras[0]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cameras]);

  useEffect(() => {
    setError(null);
    let hls;
    const videoEl = videoRef.current;

    if (!activeCam) return;

    // YouTube
    if (activeCam.type === "youtube") {
      if (iframeRef.current) iframeRef.current.src = activeCam.url;
      if (videoEl) { videoEl.pause(); videoEl.src = ""; }
      return () => { if (iframeRef.current) iframeRef.current.src = ""; };
    }

    // MP4 or local file
    if (activeCam.type === "mp4") {
      if (videoEl) {
        videoEl.src = activeCam.url;
        videoEl.play().catch(() => {});
      }
      return () => { if (videoEl) { videoEl.pause(); videoEl.src = ""; } };
    }

    // HLS (.m3u8)
    if (activeCam.type === "hls") {
      if (!videoEl) return;
      const url = activeCam.url;
      if (videoEl.canPlayType("application/vnd.apple.mpegurl")) {
        videoEl.src = url;
        videoEl.play().catch(() => {});
      } else if (Hls.isSupported()) {
        hls = new Hls();
        hls.loadSource(url);
        hls.attachMedia(videoEl);
        hls.on(Hls.Events.MANIFEST_PARSED, () => {
          videoEl.play().catch(() => {});
        });
        hls.on(Hls.Events.ERROR, (event, data) => {
          console.error("HLS error", data);
          setError("Stream error");
        });
      } else {
        setError("HLS not supported");
      }
    }

    return () => {
      if (hls) hls.destroy();
      if (videoEl) { videoEl.pause(); videoEl.src = ""; }
    };
  }, [activeCam]);

  // fetch clip list from server
  const loadClips = async () => {
    try {
      const resp = await axios.get("/clips"); // server should expose list
      setClips(resp.data || []);
    } catch (err) {
      // ignore
    }
  };

  useEffect(() => {
    loadClips();
  }, []);

  const requestClip = async () => {
    if (!activeCam) return alert("Select a camera first.");
    // Send request to server to create clip. Server will use ffmpeg to cut the clip
    // examples of payload: { source: activeCam.source_rtsp || activeCam.url, start: "00:00:10", duration: 30 }
    try {
      setLoadingClip(true);
      const payload = {
        source: activeCam.source_rtsp || activeCam.url, // server accepts rtsp or file URL
        start: clipStart,
        duration: parseInt(clipDuration, 10),
        camId: activeCam.id,
      };
      const resp = await axios.post("/clip", payload, { responseType: "json" });
      if (resp.data && resp.data.filename) {
        alert("Clip created: " + resp.data.filename);
        loadClips();
      } else {
        alert("Clip request queued (check server).");
      }
    } catch (err) {
      console.error(err);
      alert("Failed to create clip. Check server logs.");
    } finally {
      setLoadingClip(false);
    }
  };

  const downloadClip = (filename) => {
    window.open(`/download/${filename}`, "_blank");
  };

  return (
    <div>
      <div className="grid md:grid-cols-3 gap-4">
        <div className="md:col-span-2">
          <div className="bg-black rounded overflow-hidden" style={{ height: 360 }}>
            {activeCam && activeCam.type === "youtube" ? (
              <iframe ref={iframeRef} title="youtube-live" src={activeCam.url} width="100%" height="100%" allow="autoplay; encrypted-media" frameBorder="0" />
            ) : (
              <video ref={videoRef} width="100%" height="100%" controls muted autoPlay playsInline style={{ objectFit: "cover", backgroundColor: "#000" }} />
            )}
          </div>

          {error && <div className="mt-2 text-red-600">{error}</div>}

          <div className="mt-3">
            <div className="text-sm font-medium">{activeCam ? activeCam.title : "Select feed"}</div>
            <div className="text-xs text-gray-600">{activeCam ? `${activeCam.type.toUpperCase()} • ${activeCam.url}` : ""}</div>
          </div>
        </div>

        <aside>
          <div className="bg-white p-3 rounded shadow mb-3">
            <div className="text-sm font-semibold mb-2">Cameras — {selectedCity}</div>
            <div className="space-y-2 max-h-60 overflow-auto">
              {cameras.map((c) => (
                <button key={c.id} onClick={() => { setActiveCam(c); if (onSelectCamera) onSelectCamera(c); }} className={`w-full text-left p-2 border rounded ${activeCam && activeCam.id === c.id ? "bg-blue-50 border-blue-200" : "bg-white"}`}>
                  <div className="font-medium">{c.title}</div>
                  <div className="text-xs text-gray-600">{c.type.toUpperCase()}</div>
                </button>
              ))}
            </div>
          </div>

          <div className="bg-white p-3 rounded shadow">
            <div className="text-sm font-semibold mb-2">Create Clip</div>
            <div className="text-xs text-gray-600 mb-2">Start (HH:MM:SS)</div>
            <input value={clipStart} onChange={(e) => setClipStart(e.target.value)} className="w-full px-2 py-1 border rounded mb-2" />
            <div className="text-xs text-gray-600 mb-2">Duration (sec)</div>
            <input type="number" value={clipDuration} onChange={(e) => setClipDuration(e.target.value)} className="w-full px-2 py-1 border rounded mb-3" />
            <button onClick={requestClip} className="px-3 py-1 bg-blue-600 text-white rounded" disabled={loadingClip}>{loadingClip ? "Creating..." : "Create Clip"}</button>
            <div className="mt-3 text-xs text-gray-500">Clips are stored server-side and can be downloaded.</div>
          </div>
        </aside>
      </div>

      <div className="mt-4 bg-white p-3 rounded shadow">
        <div className="flex justify-between items-center mb-2">
          <div className="font-semibold">Stored Clips</div>
          <button onClick={loadClips} className="px-2 py-1 bg-gray-200 rounded text-sm">Refresh</button>
        </div>
        <div className="space-y-2">
          {clips.length === 0 && <div className="text-sm text-gray-600">No clips yet.</div>}
          {clips.map((cl) => (
            <div key={cl.filename} className="flex items-center justify-between border-b py-2">
              <div className="text-sm">
                <div className="font-medium">{cl.filename}</div>
                <div className="text-xs text-gray-500">{cl.created_at}</div>
              </div>
              <div className="flex gap-2">
                <button onClick={() => downloadClip(cl.filename)} className="px-2 py-1 bg-blue-600 text-white rounded text-sm">Download</button>
                <button onClick={() => window.open(`/download/${cl.filename}`, "_blank")} className="px-2 py-1 bg-gray-200 rounded text-sm">Open</button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

LiveFeed.propTypes = {
  selectedCity: PropTypes.string,
  cameras: PropTypes.array,
  selectedCamera: PropTypes.object,
  onSelectCamera: PropTypes.func,
};
