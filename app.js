// Main application controller
let selectedGames = [];
let currentResults = null;

// Initialize app on page load
document.addEventListener('DOMContentLoaded', () => {
    console.log('App initialized');
    loadTodaysGames();
    
    // Event listeners
    document.getElementById('refreshBtn').addEventListener('click', loadTodaysGames);
    document.getElementById('runSimBtn').addEventListener('click', runSimulation);
    document.getElementById('exportBtn').addEventListener('click', exportResults);
});

// Load today's NBA games
async function loadTodaysGames() {
    console.log('Loading today\'s NBA games...');
    
    const loadingDiv = document.getElementById('loadingGames');
    const gamesContainer = document.getElementById('gamesContainer');
    
    loadingDiv.style.display = 'block';
    gamesContainer.innerHTML = '';
    selectedGames = [];
    
    try {
        const games = await fetchNBAGames();
        
        if (!games || games.length === 0) {
            showError('No games available for today. Try selecting a different date.');
            loadingDiv.style.display = 'none';
            return;
        }
        
        console.log(`Found ${games.length} games`);
        
        // Display game cards
        games.forEach((game, index) => {
            const card = createGameCard(game, index);
            gamesContainer.appendChild(card);
        });
        
        loadingDiv.style.display = 'none';
        document.getElementById('runSimBtn').disabled = false;
        
    } catch (error) {
        console.error('Error loading games:', error);
        showError('Failed to load games. Check your internet connection.');
        loadingDiv.style.display = 'none';
    }
}

// Create game selection card
function createGameCard(game, index) {
    const card = document.createElement('div');
    card.className = 'game-card';
    
    const homeTeam = game.homeTeam;
    const awayTeam = game.awayTeam;
    
    card.innerHTML = `
        <div>
            <input type="checkbox" id="game-${index}" data-game-id="${game.id}" 
                   onchange="toggleGame(this)">
            <label for="game-${index}" style="cursor: pointer; font-weight: 600;">
                ${awayTeam} @ ${homeTeam}
            </label>
            <div class="game-time">${formatGameTime(game.startTime)}</div>
        </div>
    `;
    
    return card;
}

// Toggle game selection
function toggleGame(checkbox) {
    const gameId = checkbox.dataset.gameId;
    
    if (checkbox.checked) {
        selectedGames.push(gameId);
    } else {
        selectedGames = selectedGames.filter(id => id !== gameId);
    }
    
    console.log(`Selected games: ${selectedGames.length}`);
    document.getElementById('runSimBtn').disabled = selectedGames.length === 0;
}

// Run simulations for selected games
async function runSimulation() {
    if (selectedGames.length === 0) {
        showError('Please select at least one game.');
        return;
    }
    
    const iterations = parseInt(document.getElementById('simIterations').value);
    
    console.log(`Running simulations for ${selectedGames.length} games with ${iterations} iterations`);
    
    // Show results section
    document.getElementById('resultsSection').classList.remove('hidden');
    document.getElementById('progressContainer').classList.remove('hidden');
    document.getElementById('resultsContent').classList.add('hidden');
    
    try {
        // Fetch game data and rosters
        const progressText = document.getElementById('progressText');
        progressText.textContent = 'Fetching player rosters...';
        
        const gameData = await fetchGameRosters(selectedGames[0]);
        
        if (!gameData) {
            showError('Could not load roster data. Please try again.');
            return;
        }
        
        // Run simulation
        progressText.textContent = 'Running simulations...';
        
        const results = simulateGame(gameData.homeTeam, gameData.awayTeam, iterations, (progress) => {
            updateProgress(progress);
        });
        
        currentResults = results;
        displayResults(results);
        
        document.getElementById('progressContainer').classList.add('hidden');
        document.getElementById('resultsContent').classList.remove('hidden');
        
    } catch (error) {
        console.error('Simulation error:', error);
        showError('An error occurred during simulation. Please try again.');
    }
}

// Update progress bar
function updateProgress(progress) {
    const progressFill = document.getElementById('progressFill');
    const percentage = Math.round((progress / 100) * 100);
    progressFill.style.width = percentage + '%';
    progressFill.textContent = percentage + '%';
}

// Display simulation results
function displayResults(results) {
    console.log('Displaying results...');
    
    // Win probability
    const homeWinPct = (results.homeWins / results.totalSimulations * 100).toFixed(1);
    const awayWinPct = (results.awayWins / results.totalSimulations * 100).toFixed(1);
    
    const winProbDiv = document.getElementById('winProbability');
    winProbDiv.innerHTML = `
        <div class="team-prob">
            <div class="team-name">${results.homeTeam}</div>
            <div class="team-prob-value">${homeWinPct}%</div>
            <div class="avg-score">Avg: ${results.homeAvgScore.toFixed(1)} points</div>
        </div>
        <div class="team-prob">
            <div class="team-name">${results.awayTeam}</div>
            <div class="team-prob-value">${awayWinPct}%</div>
            <div class="avg-score">Avg: ${results.awayAvgScore.toFixed(1)} points</div>
        </div>
    `;
    
    // Team stats table
    const teamStatsDiv = document.getElementById('teamStatsTable');
    teamStatsDiv.innerHTML = createTeamStatsTable(results);
    
    // Player box scores
    const playerBoxDiv = document.getElementById('playerBoxScores');
    playerBoxDiv.innerHTML = createPlayerBoxScores(results);
}

// Create team stats table
function createTeamStatsTable(results) {
    return `
        <table>
            <thead>
                <tr>
                    <th>Stat</th>
                    <th>${results.homeTeam}</th>
                    <th>${results.awayTeam}</th>
                </tr>
            </thead>
            <tbody>
                <tr>
                    <td><strong>Points</strong></td>
                    <td>${results.homeAvgScore.toFixed(1)}</td>
                    <td>${results.awayAvgScore.toFixed(1)}</td>
                </tr>
                <tr>
                    <td><strong>3PM</strong></td>
                    <td>${results.homeStats.threePointsMade.toFixed(1)}</td>
                    <td>${results.awayStats.threePointsMade.toFixed(1)}</td>
                </tr>
                <tr>
                    <td><strong>FGM</strong></td>
                    <td>${results.homeStats.fieldGoalsMade.toFixed(1)}</td>
                    <td>${results.awayStats.fieldGoalsMade.toFixed(1)}</td>
                </tr>
                <tr>
                    <td><strong>Rebounds</strong></td>
                    <td>${results.homeStats.rebounds.toFixed(1)}</td>
                    <td>${results.awayStats.rebounds.toFixed(1)}</td>
                </tr>
                <tr>
                    <td><strong>Turnovers</strong></td>
                    <td>${results.homeStats.turnovers.toFixed(1)}</td>
                    <td>${results.awayStats.turnovers.toFixed(1)}</td>
                </tr>
                <tr>
                    <td><strong>Blocks</strong></td>
                    <td>${results.homeStats.blocks.toFixed(1)}</td>
                    <td>${results.awayStats.blocks.toFixed(1)}</td>
                </tr>
                <tr>
                    <td><strong>Assists</strong></td>
                    <td>${results.homeStats.assists.toFixed(1)}</td>
                    <td>${results.awayStats.assists.toFixed(1)}</td>
                </tr>
            </tbody>
        </table>
    `;
}

// Create player box scores table
function createPlayerBoxScores(results) {
    let html = '<table><thead><tr><th>Player</th><th>MIN</th><th>PTS</th><th>REB</th><th>AST</th><th>FG%</th><th>3PM</th><th>BLK</th><th>STL</th></tr></thead><tbody>';
    
    // Home team players
    if (results.homePlayerStats) {
        Object.values(results.homePlayerStats).forEach(player => {
            const fgPct = player.fieldGoalsAttempted > 0 
                ? (player.fieldGoalsMade / player.fieldGoalsAttempted * 100).toFixed(1)
                : '0.0';
            
            html += `
                <tr>
                    <td><strong>${player.name}</strong></td>
                    <td>${player.minutes.toFixed(1)}</td>
                    <td>${player.points.toFixed(1)}</td>
                    <td>${player.rebounds.toFixed(1)}</td>
                    <td>${player.assists.toFixed(1)}</td>
                    <td>${fgPct}%</td>
                    <td>${player.threePointsMade.toFixed(1)}</td>
                    <td>${player.blocks.toFixed(1)}</td>
                    <td>${player.steals.toFixed(1)}</td>
                </tr>
            `;
        });
    }
    
    // Away team players
    if (results.awayPlayerStats) {
        Object.values(results.awayPlayerStats).forEach(player => {
            const fgPct = player.fieldGoalsAttempted > 0 
                ? (player.fieldGoalsMade / player.fieldGoalsAttempted * 100).toFixed(1)
                : '0.0';
            
            html += `
                <tr>
                    <td><strong>${player.name}</strong></td>
                    <td>${player.minutes.toFixed(1)}</td>
                    <td>${player.points.toFixed(1)}</td>
                    <td>${player.rebounds.toFixed(1)}</td>
                    <td>${player.assists.toFixed(1)}</td>
                    <td>${fgPct}%</td>
                    <td>${player.threePointsMade.toFixed(1)}</td>
                    <td>${player.blocks.toFixed(1)}</td>
                    <td>${player.steals.toFixed(1)}</td>
                </tr>
            `;
        });
    }
    
    html += '</tbody></table>';
    return html;
}

// Export results to CSV
function exportResults() {
    if (!currentResults) {
        showError('No results to export.');
        return;
    }
    
    let csv = 'NBA Simulation Results\n\n';
    csv += `Game,${currentResults.homeTeam} vs ${currentResults.awayTeam}\n`;
    csv += `Simulations,${currentResults.totalSimulations}\n\n`;
    csv += `Win Probability\n`;
    csv += `${currentResults.homeTeam},${(currentResults.homeWins / currentResults.totalSimulations * 100).toFixed(1)}%\n`;
    csv += `${currentResults.awayTeam},${(currentResults.awayWins / currentResults.totalSimulations * 100).toFixed(1)}%\n\n`;
    
    csv += `Team Statistics\n`;
    csv += `Stat,${currentResults.homeTeam},${currentResults.awayTeam}\n`;
    csv += `Points,${currentResults.homeAvgScore.toFixed(1)},${currentResults.awayAvgScore.toFixed(1)}\n`;
    csv += `3PM,${currentResults.homeStats.threePointsMade.toFixed(1)},${currentResults.awayStats.threePointsMade.toFixed(1)}\n`;
    csv += `FGM,${currentResults.homeStats.fieldGoalsMade.toFixed(1)},${currentResults.awayStats.fieldGoalsMade.toFixed(1)}\n`;
    csv += `Rebounds,${currentResults.homeStats.rebounds.toFixed(1)},${currentResults.awayStats.rebounds.toFixed(1)}\n`;
    csv += `Turnovers,${currentResults.homeStats.turnovers.toFixed(1)},${currentResults.awayStats.turnovers.toFixed(1)}\n`;
    csv += `Blocks,${currentResults.homeStats.blocks.toFixed(1)},${currentResults.awayStats.blocks.toFixed(1)}\n`;
    csv += `Assists,${currentResults.homeStats.assists.toFixed(1)},${currentResults.awayStats.assists.toFixed(1)}\n\n`;
    
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'nba-simulation-results.csv';
    a.click();
}

// Show error message
function showError(message) {
    const errorContainer = document.getElementById('errorContainer');
    errorContainer.innerHTML = `<div class="error-message">${message}</div>`;
    errorContainer.classList.remove('hidden');
    
    setTimeout(() => {
        errorContainer.classList.add('hidden');
    }, 5000);
}

// Format game time
function formatGameTime(timestamp) {
    if (!timestamp) return 'Time TBD';
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
}

