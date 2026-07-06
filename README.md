# Movie Recommendation System

A web-based movie recommendation system that suggests movies based on user preferences like genre, language, and rating. Built with Flask and vanilla JavaScript.

## Features

- User authentication (login/signup) with password hashing
- Session management for secure access
- Movie recommendations based on:
  - Genre
  - Language
  - Minimum IMDb rating
  - Sorting by popularity, rating, or revenue
- User history tracking
- Profile avatar customization
- Account deletion
- Responsive design

## Technology Stack

- **Backend**: Flask, SQLite, Pandas
- **Frontend**: HTML, CSS, JavaScript
- **Security**: Werkzeug password hashing, Flask sessions
- **Deployment**: Gunicorn ready

## Installation

### Prerequisites

- Python 3.8+
- pip

### Setup

1. Clone the repository:
```bash
git clone <repository-url>
cd movie-recommendation