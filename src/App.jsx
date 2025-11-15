import React from "react";
import Lobby from "./components/lobby";
import GameBoard from "./components/GameBoard";

export default function App() {
  // simple state to toggle views — we'll wire this to Nakama in later steps
  const [matchId, setMatchId] = React.useState(null);

  return (
    <div style={{ maxWidth: 480, margin: "0 auto", padding: 16 }}>
      {!matchId ? (
        <Lobby onJoinMatch={(id) => setMatchId(id)} />
      ) : (
        <GameBoard matchId={matchId} onLeave={() => setMatchId(null)} />
      )}
    </div>
  );
}