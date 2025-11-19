#!/usr/bin/env python3
"""
Main entry point for NBA API Proxy Server
Imports and runs the Flask app from proxy_server.py
"""

from proxy_server import app

if __name__ == '__main__':
    print("🏀 Starting NBA API Proxy Server from main.py...")
    print("📡 Server will run on http://0.0.0.0:5000")
    print("🌐 CORS enabled for all origins")
    print("\nAvailable endpoints:")
    print("  - GET /")
    print("  - GET /api/scoreboard?gameDate=YYYY-MM-DD")
    print("  - GET /api/team/roster/<team_id>")
    print("  - GET /api/players")
    print("  - GET /health")
    print("\nPress CTRL+C to stop\n")
    
    app.run(debug=True, host='0.0.0.0', port=5000)
