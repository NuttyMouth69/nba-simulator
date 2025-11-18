# NBA Game Simulator

An interactive NBA game simulator that fetches live NBA rosters and injury data to run realistic game simulations.

## Features

- **Live NBA Data**: Fetches current NBA games, rosters, and injury information from NBA.com API
- **Real-time Roster Display**: View team rosters with player positions and injury status before running simulations
- **Date Selection**: Choose any date to see scheduled NBA games
- **Game Simulation**: Run realistic game simulations based on current rosters
- **Injury Tracking**: Displays current injury status for players

## Architecture

This project uses a Python Flask proxy server to bypass CORS restrictions when accessing the NBA.com API:

- **Frontend**: HTML/CSS/JavaScript (hosted on GitHub Pages)
- **Backend**: Python Flask proxy server
- **API**: NBA.com official API

## Setup Instructions

### Prerequisites

- Python 3.7 or higher
- pip (Python package manager)

### 1. Clone the Repository

```bash
git clone https://github.com/NuttyMouth69/nba-simulator.git
cd nba-simulator
```

### 2. Install Python Dependencies

```bash
pip install -r requirements.txt
```

### 3. Run the Proxy Server

```bash
python proxy_server.py
```

The proxy server will start on `http://localhost:5000`

### 4. Open the Simulator

Open `index.html` in your web browser, or visit the live GitHub Pages site:

```
https://nuttymouth69.github.io/nba-simulator/
```

**Note**: The frontend is currently configured to use `localhost:5000` for local development. For production deployment, update the `PROXY_BASE_URL` in `api.js`.

## Deployment

### Deploy Proxy Server

The Python proxy server can be deployed to various platforms:

#### Option 1: Replit (Free)
1. Create a new Repl and upload the project files
2. Run `python proxy_server.py`
3. Copy the Replit URL
4. Update `PROXY_BASE_URL` in `api.js` with your Replit URL

#### Option 2: Heroku (Free Tier)
1. Create a Heroku app
2. Deploy using Git:
   ```bash
   heroku create your-app-name
   git push heroku main
   ```
3. Update `PROXY_BASE_URL` in `api.js` with your Heroku app URL

#### Option 3: Railway (Free)
1. Import the GitHub repository on Railway
2. Deploy automatically
3. Update `PROXY_BASE_URL` in `api.js` with your Railway URL

### Update Frontend Configuration

After deploying the proxy server, update `api.js`:

```javascript
// Change from:
const PROXY_BASE_URL = 'http://localhost:5000';

// To your deployed URL:
const PROXY_BASE_URL = 'https://your-deployed-proxy-url.com';
```

## How It Works

1. **Select Date**: Choose a date to fetch NBA games scheduled for that day
2. **View Games**: Games are displayed with team matchups
3. **Select Game**: Click the checkbox next to a game to load team rosters
4. **View Rosters**: Player names, positions, and injury status are displayed
5. **Run Simulation**: Click "Run Simulation" to simulate the selected game
6. **View Results**: See quarter-by-quarter scores and final results

## API Endpoints

The proxy server provides these endpoints:

- `GET /api/scoreboard` - Get today's NBA games
- `GET /api/team/roster/<team_id>` - Get roster for a specific team
- `GET /api/players` - Get all active NBA players
- `GET /health` - Health check endpoint

## Files

- `index.html` - Main HTML page
- `styles.css` - Styling for the simulator
- `app.js` - Main application logic and UI handling
- `simulator.js` - Game simulation engine
- `api.js` - API fetching functions
- `proxy_server.py` - Python Flask CORS proxy
- `requirements.txt` - Python dependencies

## Technologies Used

- **Frontend**: Vanilla JavaScript, HTML5, CSS3
- **Backend**: Python, Flask, Flask-CORS
- **API**: NBA.com official API
- **Hosting**: GitHub Pages (frontend), Various options for backend

## Troubleshooting

### Proxy Server Not Running
- Make sure Python and pip are installed
- Check that all dependencies are installed: `pip install -r requirements.txt`
- Ensure port 5000 is not in use by another application

### No Rosters Appearing
- Verify the proxy server is running
- Check browser console for error messages
- Ensure `PROXY_BASE_URL` in `api.js` is correct
- Check that the selected date has scheduled NBA games

### CORS Errors
- The proxy server should handle CORS automatically
- If issues persist, check that Flask-CORS is installed
- Verify the proxy server is accessible from your browser

## Future Enhancements

- Advanced statistics and player ratings
- Historical game data
- Team standings and playoff predictions
- Player comparison tools
- More detailed injury information
- Save simulation results

## License

MIT License

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.
