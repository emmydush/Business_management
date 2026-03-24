# Quick Start - Docker Deployment

## First Time Setup

### 1. Install Docker Desktop
Download and install from: https://www.docker.com/products/docker-desktop/

### 2. Clone Repository
```bash
cd "e:\New folder"
```

### 3. Run Startup Script
```powershell
.\start-docker.ps1
```

The script will:
- Check if Docker is installed
- Create `.env` file from template
- Prompt you to configure security keys
- Build and start all services

### 4. Access Application
- **Frontend**: http://localhost:3000
- **Backend**: http://localhost:5000

**Default Login:**
- Username: `superadmin`
- Password: `admin123`

## Common Commands

```powershell
# Start services
.\start-docker.ps1

# Stop services
.\start-docker.ps1 -Stop

# View logs
.\start-docker.ps1 -Logs

# Restart services
.\start-docker.ps1 -Restart

# Remove everything (WARNING: deletes data)
.\start-docker.ps1 -Stop -Clean
```

## Manual Docker Commands

```powershell
# Start in background
docker-compose up -d

# View logs
docker-compose logs -f

# Check status
docker-compose ps

# Stop
docker-compose down

# Rebuild
docker-compose build --no-cache
```

## Troubleshooting

### Services Won't Start
```powershell
# Check Docker is running
docker --version

# View logs
docker-compose logs backend
docker-compose logs db
```

### Port Already in Use
Edit `docker-compose.yml` and change:
```yaml
ports:
  - "8080:3000"  # Change 3000 to 8080
```

### Reset Everything
```powershell
.\start-docker.ps1 -Stop -Clean
.\start-docker.ps1
```

## Next Steps

For detailed documentation, see:
- `DOCKER_GUIDE.md` - Complete Docker deployment guide
- `README.md` - General project documentation

## Support

Issues or questions? Check the logs:
```powershell
.\start-docker.ps1 -Logs
```
