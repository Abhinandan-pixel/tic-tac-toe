🎮 Tic-Tac-Toe — Nakama Server-Authoritative Multiplayer

A real-time, server-authoritative multiplayer Tic-Tac-Toe game built using:

- React (Vite)
- Nakama (Matchmaker + Authoritative Match Loop)
- Docker Compose

This project implements username login, matchmaking, real-time board updates, turn assignment, win/draw logic, disconnection handling, and “Play Again” flow — all according to the specifications provided in the assignment document.

🚀 Features

🔐 Authentication
- Device ID–based auth
- Username entry screen with validation
- Username persists across sessions

🎯 Matchmaking

- Auto-match 2 players
- Handles tickets, match_create, and server-authoritative match joining

🧠 Server Authoritative Match
* Server owns and validates:
  - X/O symbol assignment
  - Turn order
  - Illegal move prevention
  - Win/draw detection
  - Disconnect winner logic

⚡ Real-Time Gameplay
- Uses WebSocket match data
- Board updates instantly for both players
- Opponent leaving triggers win state

🔁 Play Again Flow
- After match end → players can play again
- Server resets state properly

🎨 Clean UI
- CSS Modules
- Responsive board

▶️ Running Locally

1️⃣ Start Nakama Server

From Server directory:
```
cd server
docker compose up -d
```

This launches:
- Nakama server
- Postgres
- Auto-loads your compiled server module (server/build)

2️⃣ Start Frontend
```
cd client
npm install
npm run dev
```

Frontend will run at:

http://localhost:5173

🎮 Gameplay Flow (End-to-End)
1. Username Screen

User enters a username → validated → stored.

2. Matchmaking Screen

Nakama matchmaker searches for opponent
(also includes 60-second timeout + cancel flow).

3. Match Found

- Backend creates a server-authoritative match
- Players are assigned X and O
- Client calls joinMatch(matchId)

4. Gameplay (Real-Time)

- Player makes a move → client sends:
```
{ "type": "move", "index": 3 }
```
- Server validates move → updates state → broadcasts
- Board updates instantly for both players

5. End of Match

Win/draw logic fully server-side.

6. Play Again

Players can restart a new session inside the match.

⚙️ Server Authoritative Logic

The authoritative match module includes:

- matchInit — initializes board + player state

- matchJoin — assigns X/O

- matchLoop — processes move opcodes

- matchLeave — opponent auto-win

- Full board/turn validation

- Broadcasts state and game_over messages

All security-sensitive gameplay happens only on the server.

🤝 Disconnect Handling

If a player quits, loses connection, or closes the tab:

- Nakama triggers matchLeave
- Remaining player becomes winner
- Board state remains preserved

🧪 Tested Scenarios

- Valid move (correct turn)
- Invalid move (wrong turn)
- Invalid move (occupied cell)
- Win detection
- Draw detection
- Opponent disconnect
- Game resets with Play Again
- Matchmaking cancel
- Username persists across reloads

🏁 Status

✔ Fully working locally

✔ Server authoritative

✔ UI implemented

✔ Clean architecture