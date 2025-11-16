import React, { useEffect, useState } from "react";
import { socket } from "../api/nakamaClient";
import { OP_MOVE } from "./constants";

export default function GameBoard({ matchId, session, onLeave }) {
  const [state, setState] = useState(null);

  useEffect(() => {
    (async () => {
      console.log("Joining match", matchId);
      await socket.joinMatch(matchId);
    })();

    const handler = (msg) => {
      try {
        const jsonString = new TextDecoder().decode(msg.data);
        const payload = JSON.parse(jsonString);
        if (payload.type === "state") {
          setState(payload.state);
        }

        if (payload.type === "game_over") {
          setState((s) => ({ ...s, winner: payload.winner }));
        }
      } catch (e) {
        console.warn("Failed to parse match message", e);
      }
    };

    socket.onmatchdata = handler;

    return () => {
      socket.onmatchdata = null;
    };
  }, [matchId]);

  useEffect(() => {
    console.log(state);
  }, [state]);

  const mySymbol = state?.players?.[session.user_id]?.symbol ?? null;

  const renderCell = (i) => {
    const cellUserId = state?.board?.[i] ?? "";
    if (!cellUserId) return "";
    const p = state.players?.[cellUserId];
    return p ? p.symbol : "?";
  };

  const sendMove = (index) => {
    if (!state) return;
    if (state.winner) return;
    if (state.nextTurn !== session.user_id) return;
    const move = { type: "move", index };
    const bytes = new TextEncoder().encode(JSON.stringify(move));
    socket.sendMatchState(matchId, OP_MOVE, bytes);
  };

  return (
    <div style={{ maxWidth: 480, margin: "0 auto", padding: 16 }}>
      <h2>Game</h2>
      <p>Match ID: {matchId}</p>
      <p>
        You: {session.username || "You"} {mySymbol ? `(${mySymbol})` : ""}
      </p>
      <p>
        Next Turn:{" "}
        {state?.nextTurn
          ? state.players?.[state.nextTurn]?.username || state.nextTurn
          : "—"}
      </p>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, 96px)",
          gap: 8,
          marginTop: 12,
        }}
      >
        {Array.from({ length: 9 }).map((_, i) => (
          <div
            key={i}
            onClick={() => sendMove(i)}
            style={{
              width: 96,
              height: 96,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 32,
              background: "#f5f5f5",
              borderRadius: 8,
              cursor:
                state?.nextTurn === session.user_id &&
                state?.board?.[i] === "" &&
                !state.winner
                  ? "pointer"
                  : "not-allowed",
              userSelect: "none",
            }}
          >
            {renderCell(i)}
          </div>
        ))}
      </div>

      <div style={{ marginTop: 12 }}>
        <div style={{ marginTop: 8 }}>
          <button onClick={onLeave}>Leave</button>
        </div>
      </div>
    </div>
  );
}
