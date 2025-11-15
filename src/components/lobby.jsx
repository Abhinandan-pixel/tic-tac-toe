import React from "react";

export default function Lobby({ onJoinMatch = () => {} }) {
  return (
    <div>
      <h2>Lobby</h2>
      <p>Buttons below will create/join matches (wired to Nakama in later steps)</p>
      <button onClick={() => onJoinMatch("mock-match-id")}>Create / Find Match</button>
    </div>
  );
}
