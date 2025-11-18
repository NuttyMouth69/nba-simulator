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
        
        // Extract games with team IDs
        const games = scoreboard.events.map(event => ({
            id: event.id,
            name: event.name,
            startTime: event.date,
            homeTeam: event.competitions[0].competitors.find(c => c.homeAway === 'home').team.displayName,
            awayTeam: event.competitions[0].competitors.find(c => c.homeAway === 'away').team.displayName,
            homeTeamId: event.competitions[0].competitors.find(c => c.homeAway === 'home').team.id,
            awayTeamId: event.competitions[0].competitors.find(c => c.homeAway === 'away').team.id
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
        
        // Fetch both team rosters
        const [homeRosterResponse, awayRosterResponse] = await Promise.all([
            fetch(`https://site.api.espn.com/apis/site/v2/sports/basketball/nba/teams/${game.homeTeamId}/roster`),
            fetch(`https://site.api.espn.com/apis/site/v2/sports/basketball/nba/teams/${game.awayTeamId}/roster`)
        ]);
        
        if (!homeRosterResponse.ok || !awayRosterResponse.ok) {
            throw new Error('Failed to fetch team rosters');
        }
        
        const homeRosterData = await homeRosterResponse.json();
        const awayRosterData = await awayRosterResponse.json();
        
        // Extract player data from rosters
        const homePlayers = homeRosterData.athletes.slice(0, 10).map(athlete => ({
            name: athlete.displayName,
            position: athlete.position?.abbreviation || 'N/A',
            injuryStatus: athlete.injuries && athlete.injuries.length > 0 ? athlete.injuries[0].status : null
        }));
        
        const awayPlayers = awayRosterData.athletes.slice(0, 10).map(athlete => ({
            name: athlete.displayName,
            position: athlete.position?.abbreviation || 'N/A',
            injuryStatus: athlete.injuries && athlete.injuries.length > 0 ? athlete.injuries[0].status : null
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
