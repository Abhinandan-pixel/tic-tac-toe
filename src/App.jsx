import React, { useState, useEffect } from "react";
import Lobby from "./components/lobby";
import GameBoard from "./components/GameBoard";
import { authenticate } from "./api/nakamaClient";

export default function App() {
  const [session, setSession] = useState(null);
  const [matchId, setMatchId] = useState(null);

  useEffect(() => {
    (async () => {
      const s = await authenticate();
      setSession(s);
    })();
  }, []);

  if (!session) return <div>Loading…</div>;

  return !matchId ? (
    <Lobby
      session={session}
      onSessionUpdate={(s) => setSession(s)}
      onJoinMatch={(id) => setMatchId(id)}
    />
  ) : (
    <GameBoard
      matchId={matchId}
      session={session}
      onLeave={() => setMatchId(null)}
    />
  );
}
