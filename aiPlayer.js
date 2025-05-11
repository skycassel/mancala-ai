class MancalaAI {
    constructor(difficulty = 'medium') {
        this.setDifficulty(difficulty);
    }

    // Sets max depth based on difficulty level
    setDifficulty(difficulty) {
        this.difficulty = difficulty;

        switch (difficulty) {
            case 'easy':
                this.maxDepth = 2;
                // Only cares about current score
                this.evaluateBoard = this.easyEvaluate;
                break;
            case 'medium':
                this.maxDepth = 5;
                this.evaluateBoard = this.mediumEvaluate;
                break;
            case 'hard':
                this.maxDepth = 8;
                this.evaluateBoard = this.hardEvaluate;
                break;
            case 'expert':
                this.maxDepth = 10;
                this.evaluateBoard = this.expertEvaluate;
                break;
            default:
                this.maxDepth = 5; // Medium = default
                this.evaluateBoard = this.mediumEvaluate;
        }
    }

    /*********** HELPER EVALUATION FUNCTIONS *************/

    // EASY = just considers the scores
    easyEvaluate(board, player) {
        return player == 0 ? board[6] : board[13];
    }
    
    // MEDIUM = balance of score and stones in players' pits
    mediumEvaluate(board, player) {
        const playerScore = player == 0 ? board[6] : board[13];
        const oppScore = player == 0 ? board[13] : board[6];

        // Count stones in players' pits
        let r1 = 0;
        let r2 = 0;
        for (let i = 0; i <= 12; i++) {
            if (i <= 5) {
                r1 += board[i];
            } else if (i > 6 && i <= 12) {
                r2 += board[i];
            }
        }
        let playerPitStones = player == 0 ? r1 : r2;
        let oppPitStones = player == 0 ? r2 : r1;

        // Evaluation function: prefer more stones in mancala most but also in own pits
        return (playerScore - oppScore) + (playerPitStones - oppPitStones) * 0.5;
    }

    // HARD = medium + considers extra turns and capture potential
    hardEvaluate(board, player) {
        const playerScore = player == 0 ? board[6] : board[13];
        const oppScore = player == 0 ? board[13] : board[6];
        const scoreDiff = playerScore - oppScore;

        // Count stones in players' pits
        let r1 = 0;
        let r2 = 0;
        for (let i = 0; i <= 12; i++) {
            if (i <= 5) {
                r1 += board[i];
            } else if (i > 6 && i <= 12) {
                r2 += board[i];
            }
        }
        let pitStones = player == 0 ? r1 : r2;

        // Value extra turns and captures
        const extraTurnPotential = this.countPotentialExtraTurns(board, player) * 2;
        const capturePotential = this.countPotentialCaptures(board, player) * 2.5;

        // Evaluation function: prefer more stones in mancala most but also in own pits
        return scoreDiff + extraTurnPotential + capturePotential + (pitStones * 0.3);
    }

    // EXPERT = uses game stage awareness + popular expert strategies
    expertEvaluate(board, player) {
        const playerScore = player == 0 ? board[6] : board[13];
        const oppScore = player == 0 ? board[13] : board[6];
        const gameStage = this.determineGameStage(board);

        // Evaluation score starts off as player score difference
        let score = playerScore - oppScore;

        // Count stones in players' pits
        let r1 = 0;
        let r2 = 0;
        for (let i = 0; i <= 12; i++) {
            if (i <= 5) {
                r1 += board[i];
            } else if (i > 6 && i <= 12) {
                r2 += board[i];
            }
        }
        let playerPitStones = player == 0 ? r1 : r2;
        let oppPitStones = player == 0 ? r2 : r1;

        // Value extra turns and captures highly
        const extraTurnPotential = this.countPotentialExtraTurns(board, player) * 3;
        const capturePotential = this.countPotentialCaptures(board, player) * 4;

        // Early game = prioritize keeping stones in your own pits
        if (gameStage == "early") {
            score += playerPitStones * 0.5 - oppPitStones * 0.3;
            score += extraTurnPotential * 1.5;
        }
        // Mid game = prioritize captures and free turns
        else if (gameStage == "mid") {
            score += playerPitStones * 0.2 - oppPitStones * 0.2;
            score += extraTurnPotential * 2;
            score += capturePotential * 3;
        }
        // Late game = prioritize getting / keeping stones
        else {
            score += playerPitStones < oppPitStones ? 5 : -5;
            score += capturePotential * 2;

            // Stones closer to mancala = higher value
            const start = player == 0 ? 0 : 7;
            for (let i = 0; i < 6; i++) {
                const weight = (i + 1) / 6;
                score += board[start + i] * weight;
            }
        }

        // Evaluation function: prefer more stones in mancala most but also in own pits
        return score;
    }

    countPotentialExtraTurns(board, player) {
        let count = 0;
        const start = player == 0 ? 0 : 7;
        const end = start + 5;
        const mancala = player == 0 ? 6 : 13;

        for (let pitIndex = start; pitIndex <= end; pitIndex++) {
            const stones = board[pitIndex];
            if (stones > 0) {
                // Check if last stone would land in player's mancala
                const mancalaDist = (mancala - pitIndex + 14) % 14;

                if (stones == mancalaDist) {
                    count++;
                }
            }
        }
        return count;
    }

    countPotentialCaptures(board, player) {
        let count = 0;
        const start = player == 0 ? 0 : 7;
        const end = start + 5;

        for (let pitIndex = start; pitIndex <= end; pitIndex++) {
            const stones = board[pitIndex];
            if (stones > 0) {
                // Check where last stone lands
                let lastStoneIndex = (pitIndex + stones) % 14;

                const oppMancala = player == 0 ? 13 : 6;
                // Skip opponent's mancala in calculation
                if (lastStoneIndex == oppMancala) {
                    lastStoneIndex = (lastStoneIndex + 1) % 14;
                }

                // Check if landing in an empty pit on own side
                const isOwnPit = (player == 0 && lastStoneIndex >= 0 && lastStoneIndex <= 5) ||
                    (player == 1 && lastStoneIndex >= 7 && lastStoneIndex <= 12);
                if (isOwnPit && board[lastStoneIndex] == 0) {
                    const oppIndex = 12 - lastStoneIndex;

                    // Check if opposite pit has stones
                    if ((oppIndex >= 0 && oppIndex <= 12) &&
                        oppIndex != 6 && board[oppIndex] > 0) {
                        count += (board[oppIndex] + 1); // Value is proportional to stones captured
                    }
                }
            }
        }
        return count;
    }

    // Figures out if we're in early, mid, or late game stage
    determineGameStage(board) {
        // Calculate total stones in the game
        let totalStones = 0;
        for(let i=0; i<14; i++) {
            totalStones += board[i];
        }

        // More stones in mancalas = closer to end of game
        const stonesInMancalas = board[6] + board[13];
        const portionInMancalas = stonesInMancalas / totalStones;

        if(portionInMancalas < 0.3) return "early";
        if(portionInMancalas < 0.7) return "mid";
        return "late";
    }

    /*********** END OF HELPER FUNCTIONS **************/

    findBestMove(board, currPlayer) {
        const moves = this.getLegalMoves(board, currPlayer);
        let bestScore = -Infinity;
        let bestMove = null;

        for (let move of moves) {
            const boardCopy = [...board];
            const capturedStones = this.simulateMove(boardCopy, currPlayer, move);
            const extraTurn = capturedStones.extraTurn;

            const score = this.minimax(boardCopy, 0, -Infinity, Infinity, !extraTurn, currPlayer);

            if (score > bestScore) {
                bestScore = score;
                bestMove = move;
            }
        }

        return bestMove;
    }

    minimax(board, depth, alpha, beta, isMaxPlayer, currPlayer) {
        if (depth >= this.maxDepth || this.isGameOver(board)) {
            return this.evaluateBoard(board, currPlayer);
        }

        const nextPlayer = isMaxPlayer ? currPlayer : this.getOpponent(currPlayer);
        const moves = this.getLegalMoves(board, nextPlayer);

        // Perform minimax search
        if (isMaxPlayer) {
            return this.calculateMax(board, depth, alpha, beta, isMaxPlayer, currPlayer, moves, nextPlayer);
        } else {
            return this.calculateMin(board, depth, alpha, beta, isMaxPlayer, currPlayer, moves, nextPlayer);
        }
    }

    calculateMax(board, depth, alpha, beta, isMaxPlayer, currPlayer, moves, nextPlayer) {
        let bestValue = -Infinity
        for (let move of moves) {
            const boardCopy = [...board];
            const capturedStones = this.simulateMove(boardCopy, nextPlayer, move);
            const extraTurn = capturedStones.extraTurn;

            // If move grants an extra turn, keep the same player
            const nextIsMax = !extraTurn ? false : true;
            const value = this.minimax(boardCopy, depth + 1, alpha, beta, nextIsMax, currPlayer);
            bestValue = Math.max(bestValue, value);

            // Prune irrelevant branches
            if (bestValue > beta) {
                break;
            }
            alpha = Math.max(alpha, bestValue);
        }
        return bestValue;
    }

    calculateMin(board, depth, alpha, beta, isMaxPlayer, currPlayer, moves, nextPlayer) {
        let bestValue = Infinity
        for (let move of moves) {
            const boardCopy = [...board];
            const capturedStones = this.simulateMove(boardCopy, nextPlayer, move);
            const extraTurn = capturedStones.extraTurn;

            // If move grants an extra turn, keep the same player
            const nextIsMax = !extraTurn ? true : false;
            const value = this.minimax(boardCopy, depth + 1, alpha, beta, nextIsMax, currPlayer);
            bestValue = Math.min(bestValue, value);

            // Prune irrelevant branches
            if (bestValue < alpha) {
                break;
            }
            beta = Math.min(beta, bestValue);
        }
        return bestValue;
    }

    getLegalMoves(board, player) {
        const moves = [];
        const start = player == 0 ? 0 : 7;
        const end = start + 5;

        for (let i = start; i <= end; i++) {
            if (board[i] > 0) {
                moves.push(i);
            }
        }
        return moves;
    }

    simulateMove(board, player, pitIndex) {
        let stones = board[pitIndex];
        board[pitIndex] = 0;
        let capturedStones = 0;
        let extraTurn = false;

        const playerMancala = player == 0 ? 6 : 13;
        const opponentMancala = player == 0 ? 13 : 6;
        let currentPitIndex = pitIndex;

        while (stones > 0) {
            currentPitIndex = (currentPitIndex + 1) % 14;

            // Skip opponent's mancala
            if (currentPitIndex == opponentMancala) {
                continue;
            }

            // Distribute stones around board
            board[currentPitIndex]++;
            stones--;

            // Check for extra turn
            if (stones == 0 && currentPitIndex == playerMancala) {
                extraTurn = true;
            }

            // Check for capture - only on last stone and only if landing in own empty pit
            if (stones == 0 && board[currentPitIndex] == 1) {
                const isOwnPit = (player == 0 && currentPitIndex >= 0 && currentPitIndex <= 5) ||
                    (player == 1 && currentPitIndex >= 7 && currentPitIndex <= 12);

                if (isOwnPit) {
                    // Calculate opposite pit correctly
                    let oppositeIndex = 12 - currentPitIndex;

                    // Make sure opposite index is valid and has stones
                    if ((oppositeIndex >= 0 && oppositeIndex <= 12) && oppositeIndex != 6 && oppositeIndex != 13 && board[oppositeIndex] > 0) {
                        capturedStones = board[oppositeIndex] + 1;
                        board[playerMancala] += capturedStones;
                        board[currentPitIndex] = 0;
                        board[oppositeIndex] = 0;
                    }
                }
            }
        }

        return { extraTurn, capturedStones };
    }

    isGameOver(board) {
        let p0empty = true;
        let p1empty = true;

        // Check if player 1's pits are empty
        for (let i = 0; i <= 5; i++) {
            if (board[i] > 0) {
                p0empty = false;
                break;
            }
        }

        // Check if player 2's pits are empty
        for (let i = 7; i <= 12; i++) {
            if (board[i] > 0) {
                p1empty = false;
                break;
            }
        }

        return p0empty || p1empty;
    }

    getOpponent(player) {
        return player == 0 ? 1 : 0;
    }
}

// Export class for use in main file
if (typeof module !== 'undefined' && module.exports) {
    module.exports = MancalaAI;
} else {
    window.MancalaAI = MancalaAI;
}