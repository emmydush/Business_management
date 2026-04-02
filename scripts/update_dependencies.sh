#!/bin/bash
# Dependency Update Script for Business Management System
# This script updates all dependencies to the latest compatible versions

set -e  # Exit on any error

echo "🔧 Business Management System - Dependency Update Script"
echo "========================================================"
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Get script directory
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

# Parse command line arguments
UPDATE_TYPE="${1:-minor}"  # Default to minor updates
SKIP_BACKUP=false
DRY_RUN=false

while [[ $# -gt 0 ]]; do
    case $1 in
        --major)
            UPDATE_TYPE="major"
            shift
            ;;
        --minor)
            UPDATE_TYPE="minor"
            shift
            ;;
        --patch)
            UPDATE_TYPE="patch"
            shift
            ;;
        --skip-backup)
            SKIP_BACKUP=true
            shift
            ;;
        --dry-run)
            DRY_RUN=true
            shift
            ;;
        --help)
            echo "Usage: $0 [OPTIONS]"
            echo ""
            echo "Options:"
            echo "  --major         Update to latest major versions (may include breaking changes)"
            echo "  --minor         Update to latest minor versions (default)"
            echo "  --patch         Update only patch versions"
            echo "  --skip-backup   Skip creating backup of current dependencies"
            echo "  --dry-run       Show what would be updated without making changes"
            echo "  --help          Show this help message"
            echo ""
            exit 0
            ;;
        *)
            print_error "Unknown option: $1"
            exit 1
            ;;
    esac
done

print_status "Update type: $UPDATE_TYPE"
print_status "Project root: $PROJECT_ROOT"

# Check if we're in dry-run mode
if [ "$DRY_RUN" = true ]; then
    print_warning "DRY RUN MODE - No changes will be made"
    echo ""
fi

# ============================================
# BACKUP CURRENT DEPENDENCIES
# ============================================
if [ "$SKIP_BACKUP" = false ] && [ "$DRY_RUN" = false ]; then
    print_status "Creating backup of current dependencies..."
    
    BACKUP_DIR="$PROJECT_ROOT/backups/$(date +%Y%m%d_%H%M%S)"
    mkdir -p "$BACKUP_DIR"
    
    # Backup Python dependencies
    if [ -f "$PROJECT_ROOT/backend/requirements.txt" ]; then
        cp "$PROJECT_ROOT/backend/requirements.txt" "$BACKUP_DIR/requirements.txt.backup"
        print_success "Backed up requirements.txt"
    fi
    
    # Backup Node.js dependencies
    if [ -f "$PROJECT_ROOT/frontend/package.json" ]; then
        cp "$PROJECT_ROOT/frontend/package.json" "$BACKUP_DIR/package.json.backup"
        print_success "Backed up package.json"
    fi
    
    if [ -f "$PROJECT_ROOT/frontend/package-lock.json" ]; then
        cp "$PROJECT_ROOT/frontend/package-lock.json" "$BACKUP_DIR/package-lock.json.backup"
        print_success "Backed up package-lock.json"
    fi
    
    echo "Backup created at: $BACKUP_DIR"
    echo ""
fi

# ============================================
# UPDATE PYTHON DEPENDENCIES
# ============================================
print_status "Updating Python dependencies..."
echo "-----------------------------------------------------------"

cd "$PROJECT_ROOT/backend"

# Check if virtual environment exists, create if not
if [ ! -d "venv" ] && [ ! -d ".venv" ]; then
    print_status "Creating Python virtual environment..."
    python3 -m venv venv
    print_success "Virtual environment created"
fi

# Activate virtual environment
if [ -d "venv" ]; then
    source venv/bin/activate
elif [ -d ".venv" ]; then
    source .venv/bin/activate
fi

# Upgrade pip
print_status "Upgrading pip..."
pip install --upgrade pip

# Install pip-tools for dependency management
pip install pip-tools

# Generate new requirements from current environment
if [ "$DRY_RUN" = false ]; then
    print_status "Installing updated dependencies..."
    pip install -r requirements.txt --upgrade
    
    # Freeze current environment to requirements.txt
    pip freeze > requirements.txt
    print_success "Python dependencies updated"
else
    print_status "[DRY RUN] Would update Python dependencies"
fi

echo ""

# ============================================
# UPDATE NODE.JS DEPENDENCIES
# ============================================
print_status "Updating Node.js dependencies..."
echo "-----------------------------------------------------------"

cd "$PROJECT_ROOT/frontend"

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    print_status "Installing Node.js dependencies..."
    npm install
fi

# Update based on type
if [ "$DRY_RUN" = false ]; then
    case $UPDATE_TYPE in
        major)
            print_status "Updating to latest major versions..."
            npx npm-check-updates -u
            npm install
            ;;
        minor)
            print_status "Updating to latest minor versions..."
            npx npm-check-updates -u --target minor
            npm install
            ;;
        patch)
            print_status "Updating only patch versions..."
            npm update
            ;;
    esac
    
    print_success "Node.js dependencies updated"
else
    print_status "[DRY RUN] Would update Node.js dependencies ($UPDATE_TYPE)"
fi

echo ""

# ============================================
# SECURITY AUDIT
# ============================================
print_status "Running security audit..."
echo "-----------------------------------------------------------"

# Python security audit
print_status "Checking Python dependencies for vulnerabilities..."
cd "$PROJECT_ROOT/backend"

# Install safety if not present
pip install safety bandit

# Run safety check
if [ "$DRY_RUN" = false ]; then
    safety check --full-report || true
else
    print_status "[DRY RUN] Would run safety check"
fi

# Run bandit for code security
if [ "$DRY_RUN" = false ]; then
    bandit -r app/ -f json -o bandit-report.json || true
else
    print_status "[DRY RUN] Would run bandit security scan"
fi

# Node.js security audit
print_status "Checking Node.js dependencies for vulnerabilities..."
cd "$PROJECT_ROOT/frontend"

if [ "$DRY_RUN" = false ]; then
    npm audit --audit-level=moderate || true
else
    print_status "[DRY RUN] Would run npm audit"
fi

echo ""

# ============================================
# TESTING
# ============================================
if [ "$DRY_RUN" = false ]; then
    print_status "Running tests..."
    echo "-----------------------------------------------------------"
    
    # Python tests
    print_status "Running Python tests..."
    cd "$PROJECT_ROOT/backend"
    pip install pytest pytest-flask
    pytest --tb=short -v || print_warning "Some Python tests failed"
    
    # Node.js tests
    print_status "Running Node.js tests..."
    cd "$PROJECT_ROOT/frontend"
    npm test -- --watchAll=false --passWithNoTests || print_warning "Some Node.js tests failed"
    
    echo ""
fi

# ============================================
# SUMMARY
# ============================================
echo "========================================================"
print_success "Dependency update process completed!"
echo "========================================================"
echo ""

if [ "$DRY_RUN" = false ]; then
    echo "Summary:"
    echo "  - Python dependencies updated"
    echo "  - Node.js dependencies updated"
    echo "  - Security audits completed"
    echo "  - Tests executed"
    echo ""
    
    if [ "$SKIP_BACKUP" = false ]; then
        echo "Backup location: $BACKUP_DIR"
        echo ""
    fi
    
    echo "Next steps:"
    echo "  1. Review the changes in requirements.txt and package.json"
    echo "  2. Test the application thoroughly"
    echo "  3. Commit the changes: git add . && git commit -m 'chore(deps): update dependencies'"
    echo "  4. Push to repository: git push origin main"
    echo ""
    
    print_warning "If you encounter issues, you can restore from backup:"
    echo "  cp $BACKUP_DIR/requirements.txt.backup backend/requirements.txt"
    echo "  cp $BACKUP_DIR/package.json.backup frontend/package.json"
    echo "  cp $BACKUP_DIR/package-lock.json.backup frontend/package-lock.json"
else
    echo "This was a DRY RUN. No changes were made."
    echo "Run without --dry-run to apply updates."
fi

echo ""
print_success "Done!"
