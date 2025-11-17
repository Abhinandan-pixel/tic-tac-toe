import React, { useEffect, useRef, useState } from "react";
import {
  updateUsername,
  connectSocket,
  findOrCreateMatch,
  socket,
} from "../api/nakamaClient";
import styles from "@styles/Lobby.module.css";

const hasSavedUsername = () => !!localStorage.getItem("username");

export default function Lobby({ session, onSessionUpdate, onJoinMatch }) {
  const initial = localStorage.getItem("username") || "";
  const [username, setUsername] = useState(initial);
  const [phase, setPhase] = useState(() =>
    hasSavedUsername() ? "finding" : "ask"
  );
  const [working, setWorking] = useState(false);
  const [canceling, setCanceling] = useState(false);
  const [timeElapsed, setTimeElapsed] = useState(0);
  const matchMakingTicket = useRef(null);

  useEffect(() => {
    if (phase !== "finding") return;
    let mounted = true;
    setTimeElapsed(0);
    const interval = setInterval(() => {
      setTimeElapsed((s) => s + 1);
    }, 1000);

    console.log(matchMakingTicket.current);
    (async () => {
      try {
        setWorking(true);
        await connectSocket(session);
        matchMakingTicket.current = await findOrCreateMatch();
      } catch (err) {
        console.error("Matchmaking start failed", err);
        if (mounted) setPhase("ask");
      } finally {
        if (mounted) setWorking(false);
      }
    })();

    socket.onmatchmakermatched = (matched) => {
      console.log("Match found (listener):", matched);
      if (matched && matched.match_id) {
        onJoinMatch(matched.match_id);
      }
      clearInterval(interval);
    };

    return () => {
      mounted = false;
      socket.onmatchmakermatched = null;
      clearInterval(interval);
    };
  }, [phase, session, onJoinMatch]);

  useEffect(() => {
    if (timeElapsed > 60) {
      handleCancel();
    }
  }, [timeElapsed]);

  const handleSetUsername = async () => {
    const name = (username || "").trim();
    if (!name) return alert("Please enter a username");
    try {
      setWorking(true);
      const newSession = await updateUsername(session, name);
      onSessionUpdate(newSession);
      setPhase("finding");
    } catch (e) {
      console.error("Username set failed", e);
      alert("Failed to set username. Try a different name.");
      setPhase("ask");
    } finally {
      setWorking(false);
    }
  };

  const handleCancel = async () => {
    setCanceling(true);
    if (!matchMakingTicket.current) return;
    try {
      await socket.removeMatchmaker(matchMakingTicket.current);
    } catch (e) {
      console.log("failed to cancel match making:", e);
    } finally {
      setCanceling(false);
      setPhase("ask");
    }
  };

  return (
    <div className={styles.container}>
      {phase === "ask" ? (
        <div className={styles.card}>
          <div className={styles.topBar}>
            <h3 className={styles.title}>Who are you?</h3>
          </div>

          <input
            className={styles.input}
            placeholder="Nickname"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            disabled={working}
          />

          <button
            className={`${styles.continueBtn} ${
              username.trim() ? styles.activeBtn : styles.disabledBtn
            }`}
            disabled={!username.trim()}
            onClick={handleSetUsername}
          >
            Continue
          </button>
        </div>
      ) : (
        <div className={styles.card}>
          <h2 className={styles.findTitle}>Finding a random player…</h2>
          <p className={styles.subtitle}>
            {timeElapsed < 60000
              ? `Searching... Time Elapsed ${timeElapsed} seconds`
              : "Taking too long. Disconnecting..."}
          </p>
          <button
            className={styles.cancelBtn}
            onClick={handleCancel}
            disabled={canceling}
            aria-busy={canceling}
          >
            {canceling ? "Cancelling…" : "Cancel"}
          </button>
        </div>
      )}
    </div>
  );
}
