import { useState } from "react";
import axios from "axios";

export default function SearchBar({ onResults }) {
  const [q, setQ] = useState("");

  const handleSearch = async () => {
    const res = await axios.get(`http://localhost:5001/api/messages/search?q=${q}`);
    onResults(res.data);
  };

  return (
    <div className="flex gap-2">
      <input value={q} onChange={e => setQ(e.target.value)} placeholder="Search..." />
      <button onClick={handleSearch}>Search</button>
    </div>
  );
}