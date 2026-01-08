# GitHub Actions Workflows

This project uses GitHub Actions for continuous integration and deployment. Here are the available workflows:

## Workflows

### 1. CI/CD Pipeline (`ci-cd.yml`)
- **Trigger**: Push to `main/master` branches or pull requests
- **Purpose**: Automated testing, building, and deployment
- **Jobs**:
  - `test`: Runs backend and frontend tests
  - `build-and-push`: Builds and pushes Docker images to GitHub Container Registry
  - `deploy`: Deploys to production (only on main branch push)

### 2. Manual Deployment (`manual-deploy.yml`)
- **Trigger**: Manual dispatch from GitHub UI
- **Purpose**: On-demand deployment to staging or production
- **Inputs**:
  - `environment`: Target environment (staging/production)
  - `deploy_backend`: Whether to deploy backend service
  - `deploy_frontend`: Whether to deploy frontend service
  - `deploy_db_migration`: Whether to run database migrations

### 3. Docker Build & Test (`docker-build.yml`)
- **Trigger**: Push to feature branches or pull requests
- **Purpose**: Build and test Docker images without pushing
- **Jobs**:
  - `build-backend`: Builds and tests backend Docker image
  - `build-frontend`: Builds and tests frontend Docker image
  - `docker-compose-test`: Tests docker-compose integration

## Container Registry

Docker images are pushed to GitHub Container Registry (GHCR):
- Backend: `ghcr.io/{username}/{repository}-backend`
- Frontend: `ghcr.io/{username}/{repository}-frontend`

## Secrets Required

For the workflows to function properly, the following secrets should be configured in your repository:

- `GITHUB_TOKEN` (automatically provided by GitHub)

## Usage

### Automatic Workflows
- Push changes to `main` or `master` to trigger deployment
- Open pull requests to run tests and build checks

### Manual Deployment
1. Go to the Actions tab in your GitHub repository
2. Select "Manual Deployment" workflow
3. Click "Run workflow"
4. Configure the inputs as needed

## Deployment Environments

The workflows support multiple deployment environments:
- `staging`: For testing and validation
- `production`: For live deployment

Each environment can be configured with separate deployment targets and secrets.