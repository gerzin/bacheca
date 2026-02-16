# Bacheca Backend

Django REST Framework backend for the Bacheca application.

## Requirements

- Python 3.14+
- PostgreSQL 17+
- Docker & Docker Compose (optional, for containerized development)

## Quick Start

### Local Development (without Docker)

1. **Create environment file**
   ```bash
   cp .env.example .env
   # Edit .env with your settings
   ```

2. **Install dependencies**
   ```bash
   uv sync
   ```

3. **Start PostgreSQL** (or use Docker for just the database)
   ```bash
   docker compose up db -d
   ```

4. **Run migrations**
   ```bash
   uv run python manage.py migrate
   ```

5. **Create superuser**
   ```bash
   uv run python manage.py createsuperuser
   ```

6. **Run development server**
   ```bash
   uv run python manage.py runserver
   ```

### Docker Development

1. **Create environment file**
   ```bash
   cp .env.example .env
   # Edit .env with your settings
   ```

2. **Build and run with Docker Compose**
   ```bash
   docker compose -f docker-compose.yml -f docker-compose.dev.yml up --build
   ```

3. **Run migrations**
   ```bash
   docker compose exec backend python manage.py migrate
   ```

4. **Create superuser**
   ```bash
   docker compose exec backend python manage.py createsuperuser
   ```

### Production Deployment

1. **Set production environment variables**
   - Generate a secure `SECRET_KEY`
   - Set `DEBUG=False`
   - Configure `ALLOWED_HOSTS`
   - Set strong `POSTGRES_PASSWORD`

2. **Build and run**
   ```bash
   docker compose up --build -d
   ```

3. **Run migrations**
   ```bash
   docker compose exec backend python manage.py migrate
   ```

## Project Structure

```
backend/
├── config/              # Django project settings
│   ├── settings.py      # Main settings (uses environment variables)
│   ├── urls.py          # URL routing
│   └── wsgi.py          # WSGI entry point
├── users/               # Users app
│   ├── models.py        # User and Ban models
│   ├── views.py         # API views
│   ├── serializers.py   # DRF serializers
│   ├── permissions.py   # Custom permissions
│   └── urls.py          # App URL routing
├── tests/               # Test suite
├── manage.py            # Django management script
├── pyproject.toml       # Project dependencies
├── Dockerfile           # Production Docker image
├── Dockerfile.dev       # Development Docker image
├── docker-compose.yml   # Production compose file
├── docker-compose.dev.yml # Development compose override
└── .env.example         # Environment variables template
```

## Testing

```bash
# Run tests
uv run pytest

# Run with coverage
uv run pytest --cov=. --cov-report=html
```

## API Endpoints

### General
- `/` - API root with available endpoints
- `/admin/` - Django admin interface
- `/health/` - Health check endpoint

### Users (`/api/v1/`)
- `POST /api/v1/users/register/` - Register a new user
- `GET /api/v1/users/` - List users (staff only)
- `GET /api/v1/users/{id}/` - Get user details
- `PATCH /api/v1/users/{id}/` - Update user
- `GET /api/v1/users/me/` - Get current user profile
- `PATCH /api/v1/users/me/` - Update current user profile
- `POST /api/v1/users/change-password/` - Change password
- `POST /api/v1/users/{id}/ban/` - Ban a user (staff only)
- `POST /api/v1/users/{id}/unban/` - Unban a user (staff only)

### Bans (`/api/v1/bans/`) - Staff only
- `GET /api/v1/bans/` - List all bans
- `GET /api/v1/bans/{id}/` - Get ban details
- `POST /api/v1/bans/{id}/lift/` - Lift a ban

## User Roles

| Role | Permissions |
|------|-------------|
| Anonymous | View posts (read-only) |
| User | Create posts, edit own profile |
| Staff | Moderate posts, ban/unban users |
| Superuser | Full access, cannot be banned |

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `DEBUG` | Enable debug mode | `False` |
| `SECRET_KEY` | Django secret key | Required in production |
| `ALLOWED_HOSTS` | Comma-separated allowed hosts | `localhost,127.0.0.1` |
| `POSTGRES_DB` | Database name | `bacheca` |
| `POSTGRES_USER` | Database user | `postgres` |
| `POSTGRES_PASSWORD` | Database password | `postgres` |
| `POSTGRES_HOST` | Database host | `localhost` |
| `POSTGRES_PORT` | Database port | `5432` |
| `CORS_ALLOWED_ORIGINS` | Comma-separated CORS origins | `http://localhost:3000` |
