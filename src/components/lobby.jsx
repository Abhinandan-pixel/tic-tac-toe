import React, { useEffect, useState } from "react";
import {
  updateUsername,
  connectSocket,
  findOrCreateMatch,
  socket,
} from "../api/nakamaClient";

const hasSavedUsername = () => !!localStorage.getItem("username");

export default function Lobby({ session, onSessionUpdate, onJoinMatch }) {
  const initial = localStorage.getItem("username") || "";
  const [username, setUsername] = useState(initial);
  const [phase, setPhase] = useState(() =>
    hasSavedUsername() ? "finding" : "ask"
  );
  const [working, setWorking] = useState(false);

  useEffect(() => {
    if (phase !== "finding") return;
    let mounted = true;

    (async () => {
      try {
        setWorking(true);
        await connectSocket(session);
        await findOrCreateMatch();
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
    };

    return () => {
      mounted = false;
      socket.onmatchmakermatched = null;
    };
  }, [phase, session, onJoinMatch]);

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

  const handleCancel = () => {
    try {
      socket.removeMatchmaker();
    } catch (_) {}
    setPhase("ask");
  };

  return (
    <div style={{ maxWidth: 480, margin: "0 auto", padding: 16 }}>
      {phase === "ask" ? (
        <div>
          <h2>Who are you?</h2>
          <input
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Enter username"
            disabled={working}
            style={{ padding: 8, width: "100%", boxSizing: "border-box" }}
          />
          <button
            onClick={handleSetUsername}
            disabled={working || !username.trim()}
            style={{ marginTop: 8 }}
          >
            Continue
          </button>
        </div>
      ) : (
        <div>
          <h2>Finding a random player…</h2>
          <p>Searching for an opponent. Please wait...</p>
          <p style={{ color: "#888" }}>
            Logged in as: {localStorage.getItem("username") || session.username}
          </p>
          <button onClick={handleCancel} style={{ marginTop: 12 }}>
            Cancel
          </button>
        </div>
      )}
    </div>
  );
}
