document.addEventListener('DOMContentLoaded', () => {
    // Game state
    const gameState = {
        board: Array(14).fill(4), //0-5: Player 1 pits, 6: Player 1 mancala, 7-12: Player 2 pits, 13: Player 2 mancala
        currentPlayer: 1, // 1 (human) or 2 (AI)
        gameOver: false,
        aiPlayer: null,
        isAIThinking: false,
        difficulty: 'medium',
        theme: 'classic',
        stonePositions: Array(14).fill().map(() => [])
    }
    // Initialize players' mancalas to be empty + AI player
    gameState.board[6] = 0;
    gameState.board[13] = 0;
    gameState.aiPlayer = new MancalaAI();

    // DOM elements
    const pits = document.querySelectorAll('.pit');
    const mancalaP1 = document.getElementById('player1-mancala');
    const mancalaP2 = document.getElementById('player2-mancala');
    const currentPlayerText = document.getElementById('current-player');
    const restartBtn = document.getElementById('restart');
    const difficultySelect = document.getElementById('difficulty');
    const themeSelect = document.getElementById('theme');
    const helpBtn = document.getElementById('help-btn');
    const helpModal = document.getElementById('help-modal');
    const closeBtn = document.querySelector('.close-btn');

    // Add tooltips to all pits and mancalas (for displaying stone counts)
    function addToolTips() {
        // Pit tooltips
        pits.forEach(pit => {
            const tooltip = document.createElement('div');
            tooltip.className = 'tooltip';
            pit.appendChild(tooltip);
        });
        
        // Mancala tooltips
        const mancalaTooltip1 = document.createElement('div');
        mancalaTooltip1.className = 'tooltip';
        mancalaP1.appendChild(mancalaTooltip1);
        
        const mancalaTooltip2 = document.createElement('div');
        mancalaTooltip2.className = 'tooltip';
        mancalaP2.appendChild(mancalaTooltip2);
    }

    addToolTips();

    // Update tooltips with current stone counts
    function updateTooltips() {
        pits.forEach(pit => {
            const index = parseInt(pit.getAttribute('data-index'));
            const tooltip = pit.querySelector('.tooltip');
            tooltip.textContent = `${gameState.board[index]} stones`;
        });
        
        mancalaP1.querySelector('.tooltip').textContent = `${gameState.board[6]} stones`;
        mancalaP2.querySelector('.tooltip').textContent = `${gameState.board[13]} stones`;
    }

    // Generates random position for stone within a pit / mancala
    function generateStonePosition(container) {
        const angle = Math.random() * Math.PI * 2;
        
        // Different distance calculations for pits vs mancalas
        let distanceX, distanceY;
        
        if (container.classList.contains('mancala')) {
            distanceX = Math.random() * 30;
            distanceY = Math.random() * 70;
        } else {
            distanceX = Math.random() * 20;
            distanceY = Math.random() * 20;
        }
        
        const x = Math.cos(angle) * distanceX;
        const y = Math.sin(angle) * distanceY;
        
        return { x, y };
    }

    function initializeStonePositions() {
        // Clear existing positions
        gameState.stonePositions = Array(14).fill().map(() => []);
        
        // Generate positions for each pit and mancala based on current stone counts
        for (let i = 0; i < 14; i++) {
            const stoneCount = gameState.board[i];
            for (let j = 0; j < stoneCount; j++) {
                let container;
                if (i === 6) {
                    container = mancalaP1;
                } else if (i === 13) {
                    container = mancalaP2;
                } else {
                    container = document.querySelector(`[data-index="${i}"]`);
                }
                
                if (container) {
                    gameState.stonePositions[i].push(generateStonePosition(container));
                }
            }
        }
    }

    // Renders stones in pits and mancalas
    function renderStones() {
        // Clears existing stone elements
        document.querySelectorAll('.stone').forEach(stone => stone.remove());

        // Render stones for each pit
        pits.forEach(pit => {
            const index = parseInt(pit.getAttribute('data-index'));
            const stoneCount = gameState.board[index];
            const stonesContainer = pit.querySelector('.stones');
            stonesContainer.querySelector('.stone-count').textContent = stoneCount;

            // Show visual stones for counts <= 10 for performance
            if (stoneCount <= 10) {
                stonesContainer.querySelector('.stone-count').style.opacity = '0';

                // Makes sure there's enough positions
                while(gameState.stonePositions[index].length < stoneCount) {
                    gameState.stonePositions[index].push(generateStonePosition(pit));
                }

                for (let i = 0; i < stoneCount; i++) {
                    const stone = document.createElement('div');
                    stone.className = 'stone';

                    const { x, y } = gameState.stonePositions[index][i];
                    stone.style.transform = `translate(${x}px, ${y}px)`;
                    stonesContainer.appendChild(stone);
                }
            } else {
                // Show count text for larger numbers
                stonesContainer.querySelector('.stone-count').style.opacity = '1';
            }
        });
        // Render stones for both mancalas
        renderMancalaStones(mancalaP1, 6, gameState.board[6]);
        renderMancalaStones(mancalaP2, 13, gameState.board[13]);
        updateTooltips();
    }

    function renderMancalaStones(mancalaElement, index, stoneCount) {
        // Update stone count text
        mancalaElement.querySelector('.stone-count').textContent = stoneCount;

        // Show visual stones for counts <= 20 for performance
        if (stoneCount <= 20) {
            mancalaElement.querySelector('.stone-count').style.opacity = '0';

            // Makes sure there's enough positions
            while(gameState.stonePositions[index].length < stoneCount) {
                gameState.stonePositions[index].push(generateStonePosition(mancalaElement));
            }

            for (let i = 0; i < stoneCount; i++) {
                const stone = document.createElement('div');
                stone.className = 'stone';

                const { x, y } = gameState.stonePositions[index][i];
                stone.style.transform = `translate(${x}px, ${y}px)`;
                mancalaElement.appendChild(stone);
            }
        } else {
            // Show count text for larger numbers
            mancalaElement.querySelector('.stone-count').style.opacity = '1';
        }

    }

    // Updates visual board based on game state
    function updateBoard() {
        // Update all pits
        pits.forEach(pit => {
            const index = parseInt(pit.getAttribute('data-index'));
            pit.querySelector('.stone-count').textContent = gameState.board[index];
        });

        // Update all pit and mancala stones
        mancalaP1.querySelector('.stone-count').textContent = gameState.board[6];
        mancalaP2.querySelector('.stone-count').textContent = gameState.board[13];
        renderStones();

        // Update current player display
        if (gameState.currentPlayer == 1) {
            currentPlayerText.innerHTML = '<i class="fas fa-user-circle"></i> Current player: Player 1';
        } else {
            currentPlayerText.innerHTML = '<i class="fas fa-robot"></i> Current player: Player 2 (AI)';
        }

        highlightActivePits();
    }

    function highlightActivePits() {
        // Remove all active highlights
        pits.forEach(pit => pit.classList.remove('active'));

        // Add highlights to current player's pits
        if (!gameState.gameOver) {
            const activePlayerPits = gameState.currentPlayer == 1 ?
                document.querySelectorAll('.player1 .pit') :
                document.querySelectorAll('.player2 .pit');
            
            activePlayerPits.forEach(pit => {
                const index = parseInt(pit.getAttribute('data-index'));
                if(gameState.board[index] > 0) {
                    pit.classList.add('active');
                }
            });
        }
    }

    function executeAIMove() {
        if (!gameState.aiPlayer) return;
        gameState.isAIThinking = true;
        currentPlayerText.innerHTML = '<i class="fas fa-cog fa-spin"></i> AI is thinking...';

        // Lets UI update before AI computation
        setTimeout(() => {
            const bestMove = gameState.aiPlayer.findBestMove(gameState.board, 1);
            if(bestMove != null) {
                // Visual feedback for AI move
                const aiPit = document.querySelector(`[data-index="${bestMove}"]`);
                aiPit.classList.add('ai-selected');
                
                setTimeout(() => {
                    aiPit.classList.remove('ai-selected');
                    executeMove(bestMove);
                }, 500);
            } else{
                showNotification("ERROR: AI couldn't find a valid move!");
            }
            gameState.isAIThinking = false;
        }, 800); // 800ms delay for visual feedback
    }

    // Shows notifcations for capturing stones
    function showNotification(message) {
        const notification = document.createElement('div');
        notification.className = 'notification';
        notification.textContent = message;
        document.body.appendChild(notification);
        
        // Auto-remove after 3 seconds
        setTimeout(() => {
            notification.classList.add('fade-out');
            setTimeout(() => {
                notification.remove();
            }, 500);
        }, 3000);
    }

    // Performs game functionality of executing move for a player
    function executeMove(pitIndex) {
        const isPlayer1 = gameState.currentPlayer == 1;

        // Picks up stones from selected pit
        gameState.stonePositions[pitIndex] = [];
        let stones = gameState.board[pitIndex];
        gameState.board[pitIndex] = 0;

        // Distributes stones counter-clockwise
        let currPit = pitIndex;
        while (stones > 0) {
            currPit = ++currPit % 14;

            // Stones won't go into other player's mancala
            if ((isPlayer1 && currPit == 13) || (!isPlayer1 && currPit == 6)) {
                continue;
            }

            gameState.board[currPit]++;
            stones--;

            // Generate new position for added stone
            let container; 
            if(currPit == 6) {
                container = mancalaP1;
            } else if(currPit == 13) {
                container = mancalaP2;
            } else {
                container = document.querySelector(`[data-index="${currPit}"]`);
            }

            if(container) {
                gameState.stonePositions[currPit].push(generateStonePosition(container));
            }
        }
        
        // Checks for special case: if last stone landing in your empty pit,
        // capture stones from the opposite pit too (unless it's empty)
        const landedInOwnPit = (isPlayer1 && currPit >= 0 && currPit <= 5) || (!isPlayer1 && currPit >= 7 && currPit <= 12);
        
        // Calculate opposite pit index correctly
        // For a valid pit index between 0-12 (excluding mancalas), opposite is (12 - index)
        oppPit = landedInOwnPit ? 12-currPit : -1;

        console.log(`Last stone landed in pit ${currPit}`);
        console.log(`Opposite pit calculated as ${oppPit}`);
        console.log(`Stones in landed pit: ${gameState.board[currPit]}`);
        console.log(`Stones in opposite pit: ${gameState.board[oppPit]}`);
        console.log(`*********************************`);

        if (landedInOwnPit && gameState.board[currPit] == 1 && oppPit >= 0 && gameState.board[oppPit] > 0) {
            // Reset stone positions for captured pits
            gameState.stonePositions[currPit] = [];
            gameState.stonePositions[oppPit] = [];
            
            // Calculate stones captured and which mancala it's going to
            let capturedStones = gameState.board[currPit] + gameState.board[oppPit];
            let dest = isPlayer1 ? 6 : 13;

            // Updates game board
            gameState.board[dest] += capturedStones;
            gameState.board[currPit] = 0;
            gameState.board[oppPit] = 0;

            // Generate new positions for the captured stones in the mancala
            const mancala = dest == 6 ? mancalaP1 : mancalaP2;
            for(let i=0; i < capturedStones; i++){
                gameState.stonePositions[dest].push(generateStonePosition(mancala));
            }

            showNotification(`Captured ${capturedStones} stones!`);
        }

        // Checking for game over conditions
        let row1 = gameState.board.slice(0, 6);
        let row2 = gameState.board.slice(7, 13);
        let sum1 = 0;
        let sum2 = 0;
        row1.forEach(pit => sum1 += pit);
        row2.forEach(pit => sum2 += pit);

        if (sum1 == 0 || sum2 == 0) {
            gameState.gameOver = true;

            // Reset stone positions for pits (all now cleared)
            for(let i=0; i < 13; i++){
                if(i==6) continue;
                gameState.stonePositions[i] = [];
            }

            // Generate new positions for transferred stones in mancalas
            const mancala1 = mancalaP1;
            const mancala2 = mancalaP2;
            for(let i=0; i < sum1; i++){
                gameState.stonePositions[6].push(generateStonePosition(mancala1));
            }
            for(let i=0; i < sum2; i++){
                gameState.stonePositions[13].push(generateStonePosition(mancala2));
            }

            // Move remaining stones to respective mancalas
            gameState.board[6] += sum1;
            gameState.board[13] += sum2;
            for (let i = 0; i < 13; i++) {
                if (i == 6) {
                    continue;
                }
                gameState.board[i] = 0;
            }
            updateBoard();
            announceWinner();
            return;
        }

        // Switches players (if needed)
        // If last stone lands in your mancala, you get an extra turn
        // Else, it's the other player's turn 
        if (isPlayer1 && currPit != 6) {
            gameState.currentPlayer = 2;
        }
        else if (!isPlayer1 && currPit != 13) {
            gameState.currentPlayer = 1;
        }

        updateBoard();

        if (!gameState.gameOver && gameState.currentPlayer == 2) {
            executeAIMove();
        }
    }

    function announceWinner() {
        let winner;
        if (gameState.board[6] > gameState.board[13]) {
            currentPlayerText.innerHTML = `<i class="fas fa-trophy"></i> Game Over! Player 1 wins with ${gameState.board[6]} stones!`;
        } else if (gameState.board[6] < gameState.board[13]) {
            currentPlayerText.innerHTML = `<i class="fas fa-trophy"></i> Game Over! Player 2 (AI) wins with ${gameState.board[13]} stones!`;
        } else {
            currentPlayerText.innerHTML = '<i class="fas fa-handshake"></i> It\'s a tie!';
        }
    }

    function handlePitClick(event) {
        if (gameState.gameOver || gameState.currentPlayer != 1 || gameState.isAIThinking) return;

        const clickedPit = event.target.closest('.pit');
        if(!clickedPit) return; 
        const pitIndex = parseInt(clickedPit.getAttribute('data-index'));

        // Check if clicked pits belongs to the current player
        const isPlayer1 = gameState.currentPlayer == 1;
        const isPlayer1Pit = pitIndex >= 0 && pitIndex <= 5;

        // Must be player's own pit
        if (isPlayer1 && isPlayer1Pit) {
            // Can't play from an empty pit
            if (gameState.board[pitIndex] > 0) {
                // Visual feedback
                clickedPit.classList.add('clicked');
                setTimeout(() => {
                    clickedPit.classList.remove('clicked');
                    executeMove(pitIndex);
                }, 200);
            } else {
                // Visual feedback for invalid move
                clickedPit.classList.add('invalid');
                setTimeout(() => {
                    clickedPit.classList.remove('invalid');
                }, 300);
            }
        }
    }

    difficultySelect.addEventListener('change', () => {
        gameState.difficulty = difficultySelect.value;
        gameState.aiPlayer.setDifficulty(gameState.difficulty);
        showNotification(`AI difficulty set to ${gameState.difficulty}`);
    });

    themeSelect.addEventListener('change', () => {
        gameState.theme = themeSelect.value;
        document.body.className = '';
        document.body.classList.add(`theme-${gameState.theme}`);
        showNotification(`Theme changed to ${gameState.theme}`);
    });

    // Help modal control
    helpBtn.addEventListener('click', () => {
        helpModal.style.display = 'block';
    });
    
    closeBtn.addEventListener('click', () => {
        helpModal.style.display = 'none';
    });
    
    window.addEventListener('click', (event) => {
        if (event.target == helpModal) {
            helpModal.style.display = 'none';
        }
    });

    // Add click event listeners for all pits
    document.querySelector('.pits').addEventListener('click', handlePitClick);

    // Restart game (state)
    restartBtn.addEventListener('click', () => {
        gameState.board = Array(14).fill(4);
        gameState.board[6] = 0;
        gameState.board[13] = 0;
        gameState.currentPlayer = 1;
        gameState.gameOver = false;
        gameState.isAIThinking = false;
        initializeStonePositions();

        updateBoard();
        showNotification("Game restarted!");
    });

    // Add additional CSS styles for notifications
    const style = document.createElement('style');
    style.textContent = `
        .notification {
            position: fixed;
            top: 20px;
            left: 50%;
            transform: translateX(-50%);
            background-color: var(--button-bg);
            color: white;
            padding: 12px 24px;
            border-radius: 5px;
            box-shadow: 0 4px 8px rgba(0,0,0,0.2);
            z-index: 1000;
            opacity: 1;
            transition: opacity 0.5s;
            font-weight: bold;
        }
        
        .notification.fade-out {
            opacity: 0;
        }
        
        .pit.clicked {
            animation: click-pulse 0.2s ease;
        }
        
        .pit.invalid {
            animation: invalid-shake 0.3s ease;
        }
        
        .pit.ai-selected {
            background-color: rgba(255, 255, 100, 0.5);
        }
        
        @keyframes click-pulse {
            0% { transform: scale(1); }
            50% { transform: scale(1.1); }
            100% { transform: scale(1); }
        }
        
        @keyframes invalid-shake {
            0% { transform: translateX(0); }
            25% { transform: translateX(-5px); }
            50% { transform: translateX(5px); }
            75% { transform: translateX(-5px); }
            100% { transform: translateX(0); }
        }
    `;
    document.head.appendChild(style);

    // Initialize stone positions and board display
    initializeStonePositions();
    updateBoard();
    
    // Add CSS class for stones in mancalas
    const mancalaStoneStyle = document.createElement('style');
    mancalaStoneStyle.textContent = `
        .mancala .stone {
            width: 16px;
            height: 16px;
            box-shadow: 0 2px 4px var(--stone-shadow);
        }
    `;
    document.head.appendChild(mancalaStoneStyle);
});