"""
AppCloud Node Operator Dashboard API
Legacy entry point - redirects to main.py

This file maintains backward compatibility with supervisor configuration.
All actual logic is now in main.py with modular route architecture.
"""
from main import app

# Re-export app for uvicorn
__all__ = ['app']
