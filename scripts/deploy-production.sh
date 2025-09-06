#!/bin/bash

# Production Deployment Script
# This script handles the deployment of the mini-games platform to production

set -e  # Exit on error

echo "🚀 Starting production deployment..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if we're on the main branch
CURRENT_BRANCH=$(git rev-parse --abbrev-ref HEAD)
if [ "$CURRENT_BRANCH" != "main" ] && [ "$CURRENT_BRANCH" != "master" ]; then
    echo -e "${YELLOW}Warning: You're not on the main/master branch. Current branch: $CURRENT_BRANCH${NC}"
    read -p "Do you want to continue? (y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

# Check for uncommitted changes
if ! git diff-index --quiet HEAD --; then
    echo -e "${RED}Error: You have uncommitted changes. Please commit or stash them first.${NC}"
    exit 1
fi

echo "📦 Installing dependencies..."
npm ci --production=false

echo "🧪 Running tests..."
npm test -- --coverage --watchAll=false

echo "🔍 Running linter..."
npm run lint

echo "🏗️ Building production bundle..."
npm run build

# Run database migrations
echo "🗄️ Running database migrations..."
if [ -f "supabase/migrations/002_tournament_history.sql" ]; then
    echo "Found new migration: 002_tournament_history.sql"
    # Note: In production, you would run this through Supabase CLI or dashboard
    # supabase db push --project-ref your-project-ref
fi

# Build optimization report (optional)
if [ "$ANALYZE" = "true" ]; then
    echo "📊 Generating bundle analysis..."
    ANALYZE=true npm run build
fi

# Create production environment file if it doesn't exist
if [ ! -f ".env.production.local" ]; then
    echo -e "${YELLOW}Warning: .env.production.local not found${NC}"
    echo "Please ensure all production environment variables are properly configured"
fi

# Verify build output
if [ ! -d ".next" ]; then
    echo -e "${RED}Error: Build output not found${NC}"
    exit 1
fi

echo "✅ Build successful!"

# Deploy to hosting provider (examples below)
echo "📤 Deploying to production..."

# Option 1: Vercel deployment
if command -v vercel &> /dev/null; then
    echo "Deploying to Vercel..."
    vercel --prod
fi

# Option 2: Docker deployment
if [ -f "Dockerfile" ]; then
    echo "Building Docker image..."
    docker build -t mini-games:latest .
    # docker push your-registry/mini-games:latest
fi

# Option 3: Traditional server deployment
# rsync -avz --delete .next/ user@server:/var/www/mini-games/.next/
# rsync -avz --delete public/ user@server:/var/www/mini-games/public/
# ssh user@server "cd /var/www/mini-games && npm install --production && pm2 restart mini-games"

# Run post-deployment checks
echo "🔍 Running post-deployment checks..."

# Check if the site is accessible
if [ -n "$NEXT_PUBLIC_APP_URL" ]; then
    if curl -f -s -o /dev/null "$NEXT_PUBLIC_APP_URL"; then
        echo -e "${GREEN}✅ Site is accessible at $NEXT_PUBLIC_APP_URL${NC}"
    else
        echo -e "${RED}⚠️ Warning: Site might not be accessible at $NEXT_PUBLIC_APP_URL${NC}"
    fi
fi

# Notify team (optional)
# curl -X POST -H 'Content-type: application/json' \
#   --data "{\"text\":\"🚀 Mini-games platform deployed to production by $(git config user.name)\"}" \
#   YOUR_SLACK_WEBHOOK_URL

echo -e "${GREEN}🎉 Deployment complete!${NC}"
echo "Don't forget to:"
echo "  - Monitor error logs"
echo "  - Check performance metrics"
echo "  - Verify all features are working"
echo "  - Update status page if needed"

# Generate deployment report
COMMIT_HASH=$(git rev-parse HEAD)
DEPLOY_TIME=$(date)
echo "
Deployment Report
=================
Time: $DEPLOY_TIME
Branch: $CURRENT_BRANCH
Commit: $COMMIT_HASH
Environment: production
" > deployment-report.txt

echo "📄 Deployment report saved to deployment-report.txt"