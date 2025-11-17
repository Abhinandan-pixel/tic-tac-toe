const OP_MOVE = 2;
interface TicTacToeState extends nkruntime.MatchState {
    board: string[];
    players: Record<string, nkruntime.Presence>;
    order: string[];
    nextTurn: string;
    winner: string;
}

const matchInit: nkruntime.MatchInitFunction = (ctx, logger, nk, params) => {
    const state: TicTacToeState = {
        board: new Array(9).fill(""),
        players: {},
        order: [],
        nextTurn: "",
        winner: "",
    };
    return { state, tickRate: 1, label: JSON.stringify({ game: "tictactoe" }) };
}

const matchJoinAttempt: nkruntime.MatchJoinAttemptFunction = (ctx, logger, nk, dispatcher, tick, state, presence) => {
    return { state, accept: Object.keys(state.players).length < 2 };
};

const matchJoin: nkruntime.MatchJoinFunction = (ctx, logger, nk, dispatcher, tick, state, presences) => {
    presences.forEach((p: nkruntime.Presence) => {
        if (!state.players[p.userId]) {
            state.players[p.userId] = { symbol: "X", username: p.username || "" };
            state.order.push(p.userId);
        }
    });

    if (state.order.length === 2 && !state.nextTurn) {
        const [first, second] = state.order;
        state.players[first].symbol = "X";
        state.players[second].symbol = "O";
        state.nextTurn = first;
    }
    dispatcher.broadcastMessage(1, JSON.stringify({ type: "state", state }));

    return { state };
};

const matchLeave: nkruntime.MatchLeaveFunction = (ctx, logger, nk, dispatcher, tick, state, presences) => {
    presences.forEach((p: nkruntime.Presence) => {
        state.order = state.order.filter((id: string) => id !== p.userId);
    });

    if (state.order.length === 1) {
        if (state.winner === "")
            state.winner = state.order[0];
        state.nextTurn = "";
    };

    dispatcher.broadcastMessage(1, JSON.stringify({ type: "state", state }));

    return { state };
};

const matchLoop: nkruntime.MatchLoopFunction = (ctx, logger, nk, dispatcher, tick, state, messages) => {

    for (const msg of messages) {

        if (msg.opCode !== OP_MOVE) continue;

        const sender = msg.sender.userId;
        if (!msg.data) continue;

        let data: { action: string; index: number };
        const jsonString = nk.binaryToString(msg.data);

        try { data = JSON.parse(jsonString); } catch { continue; }
        logger.info("Received message: " + data);
        //if (data.action !== "move") continue;

        if (sender !== state.nextTurn) continue;

        const cell = data.index;
        if (cell < 0 || cell > 8 || state.board[cell] !== "") continue;

        state.board[cell] = sender;

        const winningCombinations = [
            [0, 1, 2], [3, 4, 5], [6, 7, 8],
            [0, 3, 6], [1, 4, 7], [2, 5, 8],
            [0, 4, 8], [2, 4, 6]
        ];

        let hasWinner = false;

        for (const [a, b, c] of winningCombinations) {
            if (state.board[a] && state.board[a] === state.board[b] && state.board[a] === state.board[c]) {
                state.winner = state.board[a];
                state.nextTurn = "";
                hasWinner = true;
                break;
            }
        }

        if (hasWinner) {
            dispatcher.broadcastMessage(1, JSON.stringify({
                type: "game_over",
                winner: state.winner,
                board: state.board
            }));
            continue;
        }

        const allFilled = state.board.every((cell: string) => cell !== "");
        if (allFilled) {
            state.winner = "draw";
            dispatcher.broadcastMessage(1, JSON.stringify({
                type: "game_over",
                winner: "draw",
                board: state.board
            }));
            continue;
        }

        const playerOrder = state.order;
        const next = (sender === playerOrder[0]) ? playerOrder[1] : playerOrder[0];
        state.nextTurn = next;

        dispatcher.broadcastMessage(1, JSON.stringify({ type: "state", state }));

    }

    return { state };
}

const matchTerminate: nkruntime.MatchTerminateFunction =
    (ctx, logger, nk, dispatcher, tick, state, graceSeconds) => {
        logger.info("Match terminated");
        return { state };
    };

const matchSignal: nkruntime.MatchSignalFunction =
    (ctx, logger, nk, dispatcher, tick, state, data) => {
        logger.info("Match signal received");
        return { state };
    };

const onMatchmakerMatched: nkruntime.MatchmakerMatchedFunction = (ctx, logger, nk, matches) => {
    const players = matches.map(m => m.presence);

    const matchId = nk.matchCreate("tictactoe", {
        invited: players.map(p => ({
            userId: p.userId,
            sessionId: p.sessionId,
            username: p.username
        }))
    });
    logger.info("Matchmaker matched, created match: " + matchId);
    return matchId;
}

const InitModule: nkruntime.InitModule = (ctx, logger, nk, initializer) => {
    initializer.registerMatch("tictactoe", {
        matchInit,
        matchJoinAttempt,
        matchJoin,
        matchLeave,
        matchLoop,
        matchTerminate: matchTerminate,
        matchSignal: matchSignal
    });
    initializer.registerMatchmakerMatched(onMatchmakerMatched);

    logger.info("TicTacToe authoritative match registered");
};
