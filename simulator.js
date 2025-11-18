// Monte Carlo simulation engine
function simulateGame(homeTeam, awayTeam, numIterations, progressCallback) {
    console.log(`Starting simulation: ${homeTeam.name} vs ${awayTeam.name} (${numIterations} iterations)`);
    
    let homeWins = 0;
    let homeScores = [];
    let awayScores = [];
    let allHomePlayerStats = [];
    let allAwayPlayerStats = [];
    
    // Initialize player stats accumulators
    const homePlayerStatsAcc = {};
    const awayPlayerStatsAcc = {};
    
    homeTeam.players.forEach(p => {
        homePlayerStatsAcc[p.name] = initializePlayerStats(p);
    });
    
    awayTeam.players.forEach(p => {
        awayPlayerStatsAcc[p.name] = initializePlayerStats(p);
    });
    
    // Run simulations
    for (let sim = 0; sim < numIterations; sim++) {
        const gameResult = simulateSingleGame(homeTeam, awayTeam, homePlayerStatsAcc, awayPlayerStatsAcc);
        
        homeScores.push(gameResult.homeScore);
        awayScores.push(gameResult.awayScore);
        
        if (gameResult.homeScore > gameResult.awayScore) {
            homeWins++;
        }
        
        // Update progress every 100 simulations
        if ((sim + 1) % 100 === 0) {
            progressCallback((sim + 1) / numIterations * 100);
        }
    }
    
    // Calculate averages and aggregates
    const homeStats = calculateTeamStats(homePlayerStatsAcc, numIterations);
    const awayStats = calculateTeamStats(awayPlayerStatsAcc, numIterations);
    
    // Normalize player stats to per-simulation averages
    const homePlayerStats = {};
    const awayPlayerStats = {};
    
    Object.keys(homePlayerStatsAcc).forEach(playerName => {
        homePlayerStats[playerName] = normalizePlayerStats(homePlayerStatsAcc[playerName], numIterations);
    });
    
    Object.keys(awayPlayerStatsAcc).forEach(playerName => {
        awayPlayerStats[playerName] = normalizePlayerStats(awayPlayerStatsAcc[playerName], numIterations);
    });
    
    // Sort players by points scored
    const sortedHomeStats = Object.values(homePlayerStats).sort((a, b) => b.points - a.points);
    const sortedAwayStats = Object.values(awayPlayerStats).sort((a, b) => b.points - a.points);
    
    return {
        homeTeam: homeTeam.name,
        awayTeam: awayTeam.name,
        homeWins: homeWins,
        awayWins: numIterations - homeWins,
        totalSimulations: numIterations,
        homeAvgScore: homeScores.reduce((a, b) => a + b, 0) / homeScores.length,
        awayAvgScore: awayScores.reduce((a, b) => a + b, 0) / awayScores.length,
        homeStats: homeStats,
        awayStats: awayStats,
        homePlayerStats: homePlayerStats,
        awayPlayerStats: awayPlayerStats
    };
}

// Simulate a single game
function simulateSingleGame(homeTeam, awayTeam, homePlayerAcc, awayPlayerAcc) {
    const gameMinutes = 240; // 48 minutes * 5
    let homeScore = 0;
    let awayScore = 0;
    
    // Distribute minutes for both teams
    const homeMinutes = distributeMinutes(homeTeam.players, gameMinutes);
    const awayMinutes = distributeMinutes(awayTeam.players, gameMinutes);
    
    // Simulate possessions
    let timeElapsed = 0;
    while (timeElapsed < gameMinutes) {
        // Random possession duration (2-3 minutes)
        const possessionMinutes = 2 + Math.random();
        timeElapsed += possessionMinutes;
        
        // Home team possession
        if (Math.random() < 0.5 && timeElapsed < gameMinutes) {
            const result = simulatePossession(homeTeam, homeMinutes, homePlayerAcc);
            homeScore += result.points;
        } else if (timeElapsed < gameMinutes) {
            // Away team possession
            const result = simulatePossession(awayTeam, awayMinutes, awayPlayerAcc);
            awayScore += result.points;
        }
    }
    
    return {
        homeScore: Math.round(homeScore),
        awayScore: Math.round(awayScore)
    };
}

// Simulate a possession
function simulatePossession(team, minutesDistribution, playerAcc) {
    // Select player based on minutes/usage
    const player = selectPlayerByUsage(team, minutesDistribution);
    
    if (!player) return { points: 0 };
    
    // Calculate shot probability
    const baseEfficiency = player.stats.points / 20; // Normalize to ~20 PPM league average
    const shotSuccess = Math.random() < (0.45 * baseEfficiency); // ~45% FG% with adjustment
    
    let points = 0;
    
    if (shotSuccess) {
        // Determine if 2-pointer or 3-pointer
        const attemptThree = Math.random() < 0.35; // 35% of shots are 3s
        points = attemptThree ? 3 : 2;
        
        if (attemptThree) {
            playerAcc[player.name].threePointsMade += 1;
        }
        playerAcc[player.name].fieldGoalsMade += 1;
    }
    
    playerAcc[player.name].fieldGoalsAttempted += 1;
    playerAcc[player.name].points += points;
    playerAcc[player.name].minutes += 0.5; // Add minutes for this possession
    
    // Add random other stats
    if (Math.random() < 0.3) {
        playerAcc[player.name].rebounds += 1;
    }
    if (Math.random() < 0.15) {
        playerAcc[player.name].assists += 1;
    }
    if (Math.random() < 0.08) {
        playerAcc[player.name].steals += 1;
    }
    if (Math.random() < 0.08) {
        playerAcc[player.name].blocks += 1;
    }
    if (Math.random() < 0.1) {
        playerAcc[player.name].turnovers += 1;
    }
    
    return { points };
}

// Select player for possession based on usage
function selectPlayerByUsage(team, minutesDistribution) {
    if (!team.players || team.players.length === 0) return null;
    
    const totalUsage = team.players.reduce((sum, p) => sum + (minutesDistribution[p.name] || 0), 0);
    let random = Math.random() * totalUsage;
    
    for (let player of team.players) {
        const minutes = minutesDistribution[player.name] || 0;
        random -= minutes;
        if (random <= 0) return player;
    }
    
    return team.players[0];
}

// Distribute playing minutes among players
function distributeMinutes(players, totalMinutes) {
    const distribution = {};
    const usageWeights = {};
    
    // Calculate usage weights based on stats
    let totalWeight = 0;
    players.forEach(p => {
        const weight = (p.stats.points + p.stats.rebounds + p.stats.assists) / 30;
        usageWeights[p.name] = weight;
        totalWeight += weight;
    });
    
    // Distribute minutes proportionally
    players.forEach(p => {
        const proportion = usageWeights[p.name] / totalWeight;
        const minutes = totalMinutes * proportion;
        distribution[p.name] = minutes;
    });
    
    return distribution;
}

// Initialize player stats accumulator
function initializePlayerStats(player) {
    return {
        name: player.name,
        position: player.position,
        points: 0,
        rebounds: 0,
        assists: 0,
        steals: 0,
        blocks: 0,
        turnovers: 0,
        fieldGoalsMade: 0,
        fieldGoalsAttempted: 0,
        threePointsMade: 0,
        minutes: 0
    };
}

// Normalize player stats to averages
function normalizePlayerStats(playerStats, numIterations) {
    return {
        name: playerStats.name,
        position: playerStats.position,
        points: playerStats.points / numIterations,
        rebounds: playerStats.rebounds / numIterations,
        assists: playerStats.assists / numIterations,
        steals: playerStats.steals / numIterations,
        blocks: playerStats.blocks / numIterations,
        turnovers: playerStats.turnovers / numIterations,
        fieldGoalsMade: playerStats.fieldGoalsMade / numIterations,
        fieldGoalsAttempted: playerStats.fieldGoalsAttempted / numIterations,
        threePointsMade: playerStats.threePointsMade / numIterations,
        minutes: playerStats.minutes / numIterations
    };
}

// Calculate team statistics
function calculateTeamStats(playerStatsAcc, numIterations) {
    let totals = {
        points: 0,
        rebounds: 0,
        assists: 0,
        steals: 0,
        blocks: 0,
        turnovers: 0,
        fieldGoalsMade: 0,
        fieldGoalsAttempted: 0,
        threePointsMade: 0
    };
    
    Object.values(playerStatsAcc).forEach(player => {
        totals.points += player.points;
        totals.rebounds += player.rebounds;
        totals.assists += player.assists;
        totals.steals += player.steals;
        totals.blocks += player.blocks;
        totals.turnovers += player.turnovers;
        totals.fieldGoalsMade += player.fieldGoalsMade;
        totals.fieldGoalsAttempted += player.fieldGoalsAttempted;
        totals.threePointsMade += player.threePointsMade;
    });
    
    return {
        points: totals.points / numIterations,
        rebounds: totals.rebounds / numIterations,
        assists: totals.assists / numIterations,
        steals: totals.steals / numIterations,
        blocks: totals.blocks / numIterations,
        turnovers: totals.turnovers / numIterations,
        fieldGoalsMade: totals.fieldGoalsMade / numIterations,
        fieldGoalsAttempted: totals.fieldGoalsAttempted / numIterations,
        threePointsMade: totals.threePointsMade / numIterations
    };
}
