import React from "react";

export default function GameBoard({ matchId, onLeave }) {
  return (
    <div>
      <h2>Game</h2>
      <p>Match ID: {matchId}</p>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 80px)", gap: 8 }}>
        {Array.from({ length: 9 }).map((_, i) => (
          <div key={i} style={{ width: 80, height: 80, border: "1px solid #ccc", display: "flex", alignItems: "center", justifyContent: "center" }}>
            {/* cell placeholder */}
          </div>
        ))}
      </div>
      <button onClick={onLeave} style={{ marginTop: 12 }}>Leave</button>
    </div>
  );
}