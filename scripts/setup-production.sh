#!/bin/bash

# Production Setup Script
# This script helps set up the production environment

set -e

echo "🚀 Mini Games Platform - Production Setup"
echo "========================================="
echo ""

# Check if .env.production exists
if [ -f .env.production ]; then
    echo "⚠️  .env.production already exists. Please backup and remove it first."
    exit 1
fi

# Function to prompt for input
prompt_for_value() {
    local var_name=$1
    local description=$2
    local is_secret=$3
    
    echo ""
    echo "📝 $description"
    if [ "$is_secret" = "true" ]; then
        read -s -p "Enter $var_name: " value
        echo ""
    else
        read -p "Enter $var_name: " value
    fi
    
    echo "$var_name=$value" >> .env.production
}

# Create .env.production
echo "Creating .env.production file..."
echo "# Production Environment Configuration" > .env.production
echo "# Generated on $(date)" >> .env.production
echo "" >> .env.production

# Supabase Configuration
echo "=== Supabase Configuration ==="
echo "Get these from: https://app.supabase.com/project/YOUR_PROJECT/settings/api"
prompt_for_value "NEXT_PUBLIC_SUPABASE_URL" "Supabase Project URL (e.g., https://xxx.supabase.co)" false
prompt_for_value "NEXT_PUBLIC_SUPABASE_ANON_KEY" "Supabase Anon/Public Key" false
prompt_for_value "SUPABASE_SERVICE_ROLE_KEY" "Supabase Service Role Key (keep secret!)" true

# App Configuration
echo ""
echo "=== App Configuration ==="
prompt_for_value "NEXT_PUBLIC_APP_URL" "Production URL (e.g., https://mini-games.vercel.app)" false

# Feature Flags
echo ""
echo "=== Feature Flags ==="
echo "NEXT_PUBLIC_ENABLE_PWA=true" >> .env.production
echo "NEXT_PUBLIC_ENABLE_ANALYTICS=true" >> .env.production
echo "NEXT_PUBLIC_ENABLE_MONITORING=true" >> .env.production
echo "NEXT_PUBLIC_ENABLE_PUSH_NOTIFICATIONS=false" >> .env.production
echo "Features enabled: PWA, Analytics, Monitoring"

# Environment
echo "NODE_ENV=production" >> .env.production
echo "NEXT_PUBLIC_APP_ENV=production" >> .env.production

echo ""
echo "=== Optional Services ==="
read -p "Configure Plausible Analytics? (y/n): " setup_plausible
if [ "$setup_plausible" = "y" ]; then
    prompt_for_value "NEXT_PUBLIC_PLAUSIBLE_DOMAIN" "Your domain for Plausible" false
    echo "NEXT_PUBLIC_PLAUSIBLE_API_HOST=https://plausible.io" >> .env.production
fi

read -p "Configure Sentry Error Tracking? (y/n): " setup_sentry
if [ "$setup_sentry" = "y" ]; then
    prompt_for_value "NEXT_PUBLIC_SENTRY_DSN" "Sentry DSN" false
    prompt_for_value "SENTRY_AUTH_TOKEN" "Sentry Auth Token" true
    prompt_for_value "SENTRY_ORG" "Sentry Organization" false
    echo "SENTRY_PROJECT=mini-games" >> .env.production
fi

echo ""
echo "✅ Production environment file created!"
echo ""

# Verify installation
echo "=== Verifying Setup ==="
if [ -f .env.production ]; then
    echo "✅ .env.production created successfully"
else
    echo "❌ Failed to create .env.production"
    exit 1
fi

# Check for required values
if grep -q "NEXT_PUBLIC_SUPABASE_URL=https://" .env.production; then
    echo "✅ Supabase URL configured"
else
    echo "⚠️  Supabase URL might be invalid"
fi

# Install dependencies
echo ""
echo "=== Installing Dependencies ==="
npm install

# Build check
echo ""
echo "=== Running Build Check ==="
npm run build

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Build successful!"
else
    echo ""
    echo "❌ Build failed. Please check your configuration."
    exit 1
fi

echo ""
echo "🎉 Production setup complete!"
echo ""
echo "Next steps:"
echo "1. Deploy to Vercel: vercel --prod"
echo "2. Run database migrations in Supabase SQL Editor"
echo "3. Configure authentication providers in Supabase"
echo "4. Set up GitHub secrets for CI/CD"
echo ""
echo "See DEPLOYMENT.md for detailed instructions."