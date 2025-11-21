export default function RouteSelector({ onSelectRoute }) {
  return (
    <div className="absolute top-4 left-4 p-3 z-[1000] bg-white shadow-md rounded-md">
      <select
        onChange={(e) => onSelectRoute(e.target.value)}
        className="p-2 border rounded"
      >
        <option value="">Quick select route</option>
        <option value="airport-circle">Kotoka Airport → Circle</option>
        <option value="circle-airport">Circle → Kotoka Airport</option>
      </select>
    </div>
  );
}
