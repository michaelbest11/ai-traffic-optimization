{routes.map((route) => {
  const isSelected = route.id === selectedRouteId;
  const nearbyCams = findNearbyCameras(route);
  return (
    <div key={route.id} className={`border rounded p-2 ${isSelected ? "bg-blue-50" : "bg-white"}`}>
      <div className="flex justify-between items-center">
        <div>
          <div className="font-medium">{route.name || `Route ${route.id}`}</div>
          <div className="text-xs text-gray-500">{route.path?.length ?? 0} points</div>
        </div>
        <button
          className="text-sm px-2 py-1 border rounded bg-blue-600 text-white"
          onClick={() => onSelectRoute(route.id)}
        >
          {isSelected ? "Deselect" : "Select"}
        </button>
      </div>
      {nearbyCams.length > 0 && (
        <div className="flex gap-2 mt-2 overflow-x-auto">
          {nearbyCams.map((cam) => (
            <img
              key={cam.id}
              src={cam.thumbnail}
              alt={cam.title}
              className="w-16 h-16 object-cover border rounded cursor-pointer"
              title={cam.title}
              onClick={() => onCameraSelect && onCameraSelect(cam)}
            />
          ))}
        </div>
      )}
    </div>
  );
})}
