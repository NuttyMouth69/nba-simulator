// API fetching functions
const PROXY_BASE_URL = 'https://flask-nba-server-bsarnovskiy.replit.app';

// Helper function for date formatting (YYYY-MM-DD)
function getDateStr(date = null) {
  const d = date ? new Date(date) : new Date();
  return d.toISOString().split('T')[0]; // 'YYYY-MM-DD'
}

// Fetch NBA games for a specific date
async function fetchNBAGames(date = null) {
  try {
    const dateStr = getDateStr(date);
    console.log(`Fetching games for date ${dateStr}...`);
    const response = await fetch(`${PROXY_BASE_URL}/api/scoreboard?gameDate=${dateStr}`);
    if (!response.ok) throw new Error('API Error');
    const data = await response.json();

    if (!data.scoreboard || !data.scoreboard.games || data.scoreboard.games.length === 0) {
      console.log('No games found in API response');
      return [];
    }

    // Extract games with team IDs (and adjust any field as needed)
    const games = data.scoreboard.games.map(game => ({
      id: game.gameId,
      name: `${game.awayTeam.teamName} @ ${game.homeTeam.teamName}`,
      startTime: game.gameDateTimeUTC || '', // fallback if field differs
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

// Helper: Parse NBA roster from proxy backend response (resultSets structure)
function parseRoster(rosterData) {
  const set = rosterData.resultSets.find(rs => rs.name === "CommonTeamRoster");
  if (!set) return [];
  const headers = set.headers;
  return set.rowSet.map(row =>
    Object.fromEntries(headers.map((h,i) => [h,row[i]]))
  );
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

    // Extract player data from rosters, get top 10 players
    const homePlayers = parseRoster(homeRosterData).slice(0, 10).map(player => ({
      name: player.PLAYER, // field may be PLAYER or similar
      position: player.POSITION || 'N/A',
      jersey: player.NUM || '',
      height: player.HEIGHT || '',
      college: player.COLLEGE || '',
      birthdate: player.BIRTHDATE || ''
      // Add more fields as needed for your UI
    }));

    const awayPlayers = parseRoster(awayRosterData).slice(0, 10).map(player => ({
      name: player.PLAYER,
      position: player.POSITION || 'N/A',
      jersey: player.NUM || '',
      height: player.HEIGHT || '',
      college: player.COLLEGE || '',
      birthdate: player.BIRTHDATE || ''
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
        }))
      },
      awayTeam: {

    }
}
