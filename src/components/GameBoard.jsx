import React, { useEffect, useState } from "react";
import { socket } from "../api/nakamaClient";
import { OP_MOVE } from "./constants";
import styles from "@styles/Gameboard.module.css";

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
          setState((s) => ({
            ...s,
            winner: payload.winner,
            board: payload.board,
          }));
        }
      } catch (err) {
        console.warn("Failed to parse match message", err);
      }
    };

    socket.onmatchdata = handler;

    return () => {
      socket.onmatchdata = null;
    };
  }, [matchId]);

  const mySymbol = state?.players?.[session.user_id]?.symbol ?? null;

  const renderCell = (i) => {
    const cellUserId = state?.board?.[i] ?? "";
    if (!cellUserId) return null;
    const p = state.players?.[cellUserId];
    if (!p) return null;
    return p.symbol === "X" ? (
      <div className={styles.x}>X</div>
    ) : (
      <div className={styles.o} />
    );
  };

  const sendMove = (index) => {
    if (!state) return;
    if (state.winner) return;
    if (state.nextTurn !== session.user_id) return;
    const move = { type: "move", index };
    const bytes = new TextEncoder().encode(JSON.stringify(move));
    socket.sendMatchState(matchId, OP_MOVE, bytes);
  };

  const myName = session?.username || "You";
  const opponent = (() => {
    if (!state?.players) return null;
    const ids = Object.keys(state.players).filter(
      (id) => id !== session.user_id
    );
    return ids.length ? state.players[ids[0]] : null;
  })();

  const handleLeave = async () => {
    if (matchId) {
      try {
        await socket.leaveMatch(matchId);
      } catch (err) {
        console.log("Unable to leave the match:", err);
      }
    }
    onLeave();
  };

  const hasMatchEnded = () => {
    const hasEnded = state && !state.winner;
    return hasEnded;
  };

  const handleMatchWinner = () => {
    if (state && state.winner === session.user_id) {
      return "You won";
    } else if (state && state.winner === "draw") {
      return "Draw";
    } else if (state && state.winner !== session.user_id) {
      return "You lost";
    }
  };

  return (
    <div className={styles.wrapper}>
      <div className={styles.card}>
        <div className={styles.players}>
          <div>
            {myName}{" "}
            <span style={{ fontWeight: 400 }}>({mySymbol || "-"})</span>
          </div>
          <div>{opponent?.username || "Waiting"}</div>
        </div>

        {hasMatchEnded() && (
          <div className={styles.turn}>
            {state?.nextTurn &&
              (state.players[state.nextTurn]?.symbol === "X" ? (
                <div
                  className="Xturn"
                  style={{
                    width: 26,
                    height: 55,
                    fontSize: 35,
                  }}
                >
                  X
                </div>
              ) : (
                <div
                  className="dot"
                  style={{
                    width: 26,
                    height: 26,
                    borderRadius: "50%",
                    border: "6px solid rgba(0,0,0,0.1)",
                  }}
                />
              ))}
            <div>Turn</div>
          </div>
        )}
        {!hasMatchEnded() && (
          <div className={styles.turn}>{handleMatchWinner()}</div>
        )}

        <div className={styles.board}>
          {Array.from({ length: 9 }).map((_, i) => {
            const isClickable =
              state &&
              !state.winner &&
              state.nextTurn === session.user_id &&
              state.board?.[i] === "";
            return (
              <div
                key={i}
                className={`${styles.cell} ${
                  isClickable ? "" : styles.disabled
                }`}
                onClick={() => isClickable && sendMove(i)}
                role="button"
                aria-label={`cell-${i}`}
              >
                {renderCell(i)}
              </div>
            );
          })}
        </div>

        <div className={styles.controls}>
          <button className={styles.leaveBtn} onClick={handleLeave}>
            {hasMatchEnded() ? "Leave" : "Play Again"}
          </button>
        </div>
      </div>
    </div>
  );
}
