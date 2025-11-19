#!/usr/bin/env python3
"""
NBA API CORS Proxy Server
Simple Flask server that proxies requests to NBA.com API and adds CORS headers
Run with: https://flask-nba-server-bsarnovskiy.replit.app/
"""

from flask import Flask, request, jsonify
from flask_cors import CORS
import requests
import json

app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

# NBA.com API base URLs
NBA_API_BASE = 'https://stats.nba.com/stats'
NBA_CDN_BASE = 'https://cdn.nba.com'

# Required headers to make NBA.com API accept our requests
NBA_HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    'Accept': 'application/json',
    'x-nba-stats-origin': 'stats.nba.com',
    'x-nba-stats-token': 'true',
    'Referer': 'https://stats.nba.com/',
}

@app.route('/api/scoreboard', methods=['GET'])
def get_scoreboard():
    """
    Get today's NBA games scoreboard
    Query params: gameDate (YYYY-MM-DD format)
    """
    try:
        game_date = request.args.get('gameDate', '')
        # Format: https://cdn.nba.com/static/json/liveData/scoreboard/todaysScoreboard_00.json
        url = f"{NBA_CDN_BASE}/static/json/liveData/scoreboard/todaysScoreboard_00.json"
        
        response = requests.get(url, headers=NBA_HEADERS, timeout=10)
        response.raise_for_status()
        
        return jsonify(response.json())
    
    except requests.exceptions.RequestException as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/team/roster/<team_id>', methods=['GET'])
def get_team_roster(team_id):
    """
    Get roster for a specific NBA team
    """
    try:
        # NBA.com commonteamroster endpoint
        url = f"{NBA_API_BASE}/commonteamroster"
        params = {
            'Season': '2024-25',
            'TeamID': team_id
        }
        
        response = requests.get(url, headers=NBA_HEADERS, params=params, timeout=10)
        response.raise_for_status()
        
        return jsonify(response.json())
    
    except requests.exceptions.RequestException as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/players', methods=['GET'])
def get_all_players():
    """
    Get all active NBA players
    """
    try:
        url = f"{NBA_API_BASE}/commonallplayers"
        params = {
            'LeagueID': '00',
            'Season': '2024-25',
            'IsOnlyCurrentSeason': '1'
        }
        
        response = requests.get(url, headers=NBA_HEADERS, params=params, timeout=10)
        response.raise_for_status()
        
        return jsonify(response.json())
    
    except requests.exceptions.RequestException as e:
        return jsonify({'error': str(e)}), 500

@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({'status': 'healthy', 'service': 'NBA API Proxy'})

if __name__ == '__main__':
    print("🏀 NBA API Proxy Server Starting...")
    print("📡 Server running on http://localhost:5000")
    print("🔓 CORS enabled for all origins")
    print("\nAvailable endpoints:")
    print("  - GET /api/scoreboard")
    print("  - GET /api/team/roster/<team_id>")
    print("  - GET /api/players")
    print("  - GET /health")
    print("\nPress CTRL+C to stop\n")
    
    app.run(debug=True, host='0.0.0.0', port=5000)
