// API fetching functions

// Fetch NBA games for a specific date
async function fetchNBAGames(date = null) {
    try {
        // If no date provided, use today
        let dateStr = '';
        if (date) {
            // Date is already in YYYYMMDD format from date picker
            dateStr = date;
        } else {
            // Get today's date in YYYYMMDD format
            const today = new Date();
            dateStr = today.toISOString().split('T')[0].replace(/-/g, '');
        }
        
        const url = `https://site.api.espn.com/apis/site/v2/sports/basketball/nba/scoreboard?dates=${dateStr}`;
        
        console.log(`Fetching games from ESPN for date ${dateStr}...`);
        
        const response = await fetch(url);
        if (!response.ok) throw new Error('API Error');
        
        const scoreboard = await response.json();
        
        // Check if events exist and is an array
        if (!scoreboard.events || !Array.isArray(scoreboard.events) || scoreboard.events.length === 0) {
            console.log('No games found in API response');
            return [];
        }
        
        // Extract games
        const games = scoreboard.events.map(event => ({
            id: event.id,
            name: event.name,
            startTime: event.date,
            homeTeam: event.competitions[0].competitors.find(c => c.homeAway === 'home').team.displayName,
            awayTeam: event.competitions[0].competitors.find(c => c.homeAway === 'away').team.displayName
        }));
        
        console.log(`Fetched ${games.length} games`);
        return games;
        
    } catch (error) {
        console.error('Failed to fetch games:', error);
        return [];
    }
}

// Fetch game rosters with player data
async function fetchGameRosters(gameId) {
    try {
        const url = `https://site.api.espn.com/apis/site/v2/sports/basketball/nba/summary?event=${gameId}`;
        
        console.log('Fetching game summary and rosters...');
        
        const response = await fetch(url);
        if (!response.ok) throw new Error('API Error');
        
        const summary = await response.json();
        
        // Check if boxscore exists
        if (!summary.boxscore || !summary.boxscore.teams) {
            console.warn('Boxscore data not available, using sample data');
            return getSampleGameData();
        }
        
        const homeTeamData = summary.boxscore.teams[0];
        const awayTeamData = summary.boxscore.teams[1];
        
        // Extract player data
        const homePlayers = extractPlayers(homeTeamData);
        const awayPlayers = extractPlayers(awayTeamData);
        
        return {
            homeTeam: {
                name: homeTeamData.team.displayName,
                players: homePlayers
            },
            awayTeam: {
                name: awayTeamData.team.displayName,
                players: awayPlayers
            }
        };
        
    } catch (error) {
        console.error('Failed to fetch rosters:', error);
        console.log('Using sample data as fallback');
        return getSampleGameData();
    }
}

// Extract player data from team data
function extractPlayers(teamData) {
    try {
        if (!teamData.statistics || !teamData.statistics[0] || !teamData.statistics[0].athletes) {
            return getSamplePlayers(teamData.team.displayName);
        }
        
        return teamData.statistics[0].athletes.map(athlete => {
            const stats = athlete.stats || [];
            return {
                name: athlete.athlete.displayName || 'Unknown Player',
                position: athlete.athlete.position?.abbreviation || 'G',
                stats: {
                    points: parseFloat(stats[0]) || 15.0,
                    rebounds: parseFloat(stats[1]) || 5.0,
                    assists: parseFloat(stats[2]) || 3.0,
                    steals: parseFloat(stats[3]) || 1.0,
                    blocks: parseFloat(stats[4]) || 1.0,
                    turnovers: parseFloat(stats[5]) || 2.0
                }
            };
        }).filter(p => p.name !== 'Unknown Player');
        
    } catch (error) {
        console.error('Error extracting players:', error);
        return getSamplePlayers('Unknown Team');
    }
}

// Sample game data for development/fallback
function getSampleGameData() {
    return {
        homeTeam: {
            name: "Los Angeles Lakers",
            players: getSamplePlayers("Lakers")
        },
        awayTeam: {
            name: "Golden State Warriors",
            players: getSamplePlayers("Warriors")
        }
    };
}

// Sample players for fallback
function getSamplePlayers(teamName) {
    const samplePlayers = {
        "Lakers": [
            { name: "LeBron James", position: "F", stats: { points: 25.0, rebounds: 7.3, assists: 7.1, steals: 1.1, blocks: 0.7, turnovers: 2.5 } },
            { name: "Anthony Davis", position: "F-C", stats: { points: 24.7, rebounds: 12.6, assists: 3.5, steals: 0.9, blocks: 2.1, turnovers: 2.0 } },
            { name: "D'Angelo Russell", position: "G", stats: { points: 18.0, rebounds: 3.1, assists: 6.3, steals: 1.4, blocks: 0.3, turnovers: 2.8 } },
            { name: "Austin Reaves", position: "G", stats: { points: 15.9, rebounds: 4.4, assists: 5.5, steals: 1.0, blocks: 0.2, turnovers: 1.8 } },
            { name: "Rui Hachimura", position: "F", stats: { points: 13.6, rebounds: 4.3, assists: 1.2, steals: 0.6, blocks: 0.4, turnovers: 1.1 } },
            { name: "Jarred Vanderbilt", position: "F", stats: { points: 5.2, rebounds: 4.8, assists: 1.2, steals: 0.7, blocks: 0.5, turnovers: 0.8 } },
            { name: "Taurean Prince", position: "F", stats: { points: 8.9, rebounds: 2.9, assists: 1.5, steals: 0.5, blocks: 0.3, turnovers: 1.0 } }
        ],
        "Warriors": [
            { name: "Stephen Curry", position: "G", stats: { points: 26.4, rebounds: 4.5, assists: 5.1, steals: 1.2, blocks: 0.4, turnovers: 2.3 } },
            { name: "Klay Thompson", position: "G", stats: { points: 17.9, rebounds: 3.3, assists: 2.2, steals: 0.8, blocks: 0.6, turnovers: 1.2 } },
            { name: "Andrew Wiggins", position: "F", stats: { points: 13.2, rebounds: 4.5, assists: 1.7, steals: 1.1, blocks: 0.5, turnovers: 1.0 } },
            { name: "Draymond Green", position: "F", stats: { points: 8.5, rebounds: 7.2, assists: 6.0, steals: 1.3, blocks: 0.9, turnovers: 2.1 } },
            { name: "Kevon Looney", position: "C", stats: { points: 5.7, rebounds: 8.8, assists: 2.0, steals: 0.3, blocks: 0.8, turnovers: 1.0 } },
            { name: "Jonathan Kuminga", position: "F", stats: { points: 16.1, rebounds: 4.8, assists: 2.2, steals: 0.9, blocks: 0.7, turnovers: 1.5 } },
            { name: "Moses Moody", position: "G-F", stats: { points: 8.1, rebounds: 3.0, assists: 0.8, steals: 0.6, blocks: 0.2, turnovers: 0.9 } }
        ]
    };
    
    return samplePlayers[teamName] || samplePlayers["Lakers"];
}
