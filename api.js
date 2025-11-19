// API fetching functions

// Base URL for the proxy server
const PROXY_BASE_URL = 'https://flask-nba-server-bsarnovskiy.replit.app/';
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
        
        console.log(`Fetching games from NBA.com API via proxy for date ${dateStr}...`);
        
        const response = await fetch(`${PROXY_BASE_URL}/api/scoreboard`);
        if (!response.ok) throw new Error('API Error');
        
        const data = await response.json();
        
        // Check if scoreboard exists
        if (!data.scoreboard || !data.scoreboard.games || data.scoreboard.games.length === 0) {
            console.log('No games found in API response');
            return [];
        }
        
        // Extract games with team IDs
        const games = data.scoreboard.games.map(game => ({
            id: game.gameId,
            name: `${game.awayTeam.teamName} @ ${game.homeTeam.teamName}`,
            startTime: game.gameTimeUTC,
            homeTeam: game.homeTeam.teamName,
            awayTeam: game.awayTeam.teamName,
            homeTeamId: game.homeTeam.teamId,
            awayTeamId: game.awayTeam.teamId
        }));
        
        console.log(`Fetched ${games.length} games`);
        return games;
        
    } catch (error) {
        console.error('Failed to fetch games:', error);
        return [];
    }
}

// Fetch game rosters with player data using team IDs
async function fetchGameRosters(game) {
    try {
        console.log(`Fetching rosters for ${game.awayTeam} @ ${game.homeTeam}...`);
        
        // Fetch both team rosters via proxy
        const [homeRosterResponse, awayRosterResponse] = await Promise.all([
            fetch(`${PROXY_BASE_URL}/api/team/roster/${game.homeTeamId}`),
            fetch(`${PROXY_BASE_URL}/api/team/roster/${game.awayTeamId}`)
        ]);
        
        if (!homeRosterResponse.ok || !awayRosterResponse.ok) {
            throw new Error('Failed to fetch team rosters');
        }
        
        const homeRosterData = await homeRosterResponse.json();
        const awayRosterData = await awayRosterResponse.json();
        
        // Extract player data from rosters
        const homePlayers = homeRosterData.roster.slice(0, 10).map(player => ({
            name: player.name,
            position: player.position || 'N/A',
            injuryStatus: player.injury ? player.injury.description : null
        }));
        
        const awayPlayers = awayRosterData.roster.slice(0, 10).map(player => ({
            name: player.name,
            position: player.position || 'N/A',
            injuryStatus: player.injury ? player.injury.description : null
        }));
        
        console.log(`Fetched ${homePlayers.length} home players and ${awayPlayers.length} away players`);
        
        return {
            homeTeam: {
                name: game.homeTeam,
                players: homePlayers
            },
            awayTeam: {
                name: game.awayTeam,
                players: awayPlayers
            }
        };
        
    } catch (error) {
        console.error('Error fetching rosters:', error);
        
        // Fallback data only if API fails
        return {
            homeTeam: {
                name: game.homeTeam,
                players: Array.from({ length: 10 }, (_, i) => ({
                    name: `${game.homeTeam} Player ${i + 1}`,
                    position: ['PG', 'SG', 'SF', 'PF', 'C'][i % 5],
                    injuryStatus: null
                }))
            },
            awayTeam: {
                name: game.awayTeam,
                players: Array.from({ length: 10 }, (_, i) => ({
                    name: `${game.awayTeam} Player ${i + 1}`,
                    position: ['PG', 'SG', 'SF', 'PF', 'C'][i % 5],
                    injuryStatus: null
                }))
            }
        };
    }
}
