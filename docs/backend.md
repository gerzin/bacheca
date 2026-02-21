# Backend Development

## Prerequisites

- Docker and Docker Compose
- Python 3.14+ (for local development without Docker)
- [uv](https://github.com/astral-sh/uv) package manager (optional, for local development)

## Quick Start with Docker

1. **Start the database and backend**

   ```bash
   cd backend
   docker compose -f docker-compose.yml -f docker-compose.dev.yml up --build
   ```

   This starts:
   - PostgreSQL database on port `5432`
   - Django dev server on port `8000`

2. **Run migrations** (in a separate terminal)

   ```bash
   docker compose exec backend python manage.py migrate
   ```

3. **Create a superuser**

   ```bash
   docker compose exec backend python manage.py createsuperuser
   ```

4. **Access the app**
   - API: http://localhost:8000/api/v1/
   - Admin: http://localhost:8000/admin/

## Local Development (without Docker)

1. **Start the database only**

   ```bash
   cd backend
   docker compose up db
   ```

2. **Install dependencies**

   ```bash
   uv sync --dev
   ```

3. **Run migrations**

   ```bash
   uv run python manage.py migrate
   ```

4. **Start the dev server**

   ```bash
   uv run python manage.py runserver
   ```

## Useful Commands

```bash
# Run tests
uv run pytest

# Create new migrations
uv run python manage.py makemigrations

# Django shell
uv run python manage.py shell

# Check for issues
uv run python manage.py check

# Format code
uv run ruff format .

# Lint code
uv run ruff check .
```

## Environment Variables

For production, set the following in `.env` or environment:

| Variable | Description | Default |
|----------|-------------|---------|
| `SECRET_KEY` | Django secret key | (required) |
| `DEBUG` | Debug mode | `False` |
| `ALLOWED_HOSTS` | Comma-separated hosts | `localhost,127.0.0.1` |
| `POSTGRES_DB` | Database name | `bacheca` |
| `POSTGRES_USER` | Database user | `postgres` |
| `POSTGRES_PASSWORD` | Database password | `postgres` |
| `CORS_ALLOWED_ORIGINS` | CORS origins | `http://localhost:3000` |
