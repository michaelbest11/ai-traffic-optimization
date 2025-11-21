import React, { useState } from "react";
import { accraIntersections, accraRoutes } from "./dataset/accraIntersections";
import { kumasiIntersections, kumasiRoutes } from "./dataset/kumasiIntersections";

import MapView from "./components/MapView";
import LiveFeed from "./components/LiveFeed";
import RouteList from "./components/RouteList";
import TrafficStats from "./components/TrafficStats";

// ------------------------------------
// MAIN APP
// ------------------------------------
const App = () => {
const [city, setCity] = useState("accra");
const [selectedRoute, setSelectedRoute] = useState(null);

const cityData = city === "accra"
? { intersections: accraIntersections, routes: accraRoutes, feedPath: "/feed/accra/" }
: { intersections: kumasiIntersections, routes: kumasiRoutes, feedPath: "/feed/kumasi/" };

return ( <div className="p-4 space-y-6">
{/* City selector */} <div className="flex gap-2">
<button
className={`px-4 py-2 rounded ${city === "accra" ? "bg-blue-600 text-white" : "bg-gray-200"}`}
onClick={() => setCity("accra")}
>
Accra </button>
<button
className={`px-4 py-2 rounded ${city === "kumasi" ? "bg-blue-600 text-white" : "bg-gray-200"}`}
onClick={() => setCity("kumasi")}
>
Kumasi </button> </div>

```
  {/* Map */}
  <div className="h-[500px] w-full rounded shadow overflow-hidden">
    <MapView
      intersections={cityData.intersections}
      routes={cityData.routes}
      selectedRoute={selectedRoute}
    />
  </div>

  {/* Live feed */}
  <LiveFeed feedPath={cityData.feedPath} />

  {/* Route list */}
  <RouteList
    routes={cityData.routes}
    onSelectRoute={(route) => setSelectedRoute(route)}
  />

  {/* Traffic stats */}
  <TrafficStats routes={cityData.routes} />
</div>

);
};

export default App;
