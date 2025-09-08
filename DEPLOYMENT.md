# Deployment Guide

## Prerequisites

1. **Supabase Account**: Create a project at [supabase.com](https://supabase.com)
2. **Vercel Account**: Sign up at [vercel.com](https://vercel.com)
3. **GitHub Repository**: Ensure code is pushed to GitHub

## Step 1: Configure Supabase

### 1.1 Create Supabase Project
1. Go to [app.supabase.com](https://app.supabase.com)
2. Click "New Project"
3. Fill in:
   - Project name: `mini-games-prod`
   - Database password: (save securely)
   - Region: Choose closest to your users
4. Wait for project to be created (~2 minutes)

### 1.2 Get Credentials
1. Go to Settings > API
2. Copy:
   - `Project URL` → `NEXT_PUBLIC_SUPABASE_URL`
   - `anon public` key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `service_role` key → `SUPABASE_SERVICE_ROLE_KEY` (keep secret!)

### 1.3 Apply Database Migrations
1. Go to SQL Editor in Supabase dashboard
2. Run migrations in order:
   - First: `/supabase/migrations/001_initial_schema.sql`
   - Second: `/supabase/migrations/002_tournament_history.sql`
3. Verify tables are created in Table Editor

### 1.4 Configure Authentication
1. Go to Authentication > Providers
2. Enable desired providers:
   - Email/Password (enabled by default)
   - Google OAuth (optional)
   - GitHub OAuth (optional)
3. Configure redirect URLs:
   - Site URL: `https://your-domain.vercel.app`
   - Redirect URLs: `https://your-domain.vercel.app/auth/callback`

### 1.5 Set up Storage Buckets
1. Go to Storage
2. Create bucket: `avatars` (public)
3. Create bucket: `game-assets` (public)
4. Set policies for public read access

### 1.6 Configure Row Level Security (RLS)
RLS policies are included in the migration files. Verify they're active:
1. Go to Authentication > Policies
2. Check that policies exist for:
   - `profiles` table
   - `scores` table
   - `tournaments` table

## Step 2: Deploy to Vercel

### 2.1 Import Project
1. Go to [vercel.com/new](https://vercel.com/new)
2. Import your GitHub repository
3. Select the `mini-games` repository

### 2.2 Configure Environment Variables
Add these environment variables in Vercel dashboard:

```bash
# Required
NEXT_PUBLIC_SUPABASE_URL=your-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Feature Flags
NEXT_PUBLIC_ENABLE_PWA=true
NEXT_PUBLIC_ENABLE_ANALYTICS=true
NEXT_PUBLIC_ENABLE_MONITORING=true
NEXT_PUBLIC_APP_ENV=production
NEXT_PUBLIC_APP_URL=https://your-domain.vercel.app

# Optional Analytics (Plausible)
NEXT_PUBLIC_PLAUSIBLE_DOMAIN=your-domain.vercel.app
NEXT_PUBLIC_PLAUSIBLE_API_HOST=https://plausible.io

# Optional Monitoring (Sentry)
NEXT_PUBLIC_SENTRY_DSN=your-sentry-dsn
SENTRY_AUTH_TOKEN=your-auth-token
SENTRY_ORG=your-org
SENTRY_PROJECT=mini-games
```

### 2.3 Deploy
1. Click "Deploy"
2. Wait for build to complete (~3-5 minutes)
3. Visit your deployed site at provided URL

## Step 3: Configure GitHub Actions

### 3.1 Add Repository Secrets
Go to GitHub repo > Settings > Secrets and add:

```bash
VERCEL_TOKEN          # Get from Vercel account settings
VERCEL_ORG_ID         # Get from Vercel project settings
VERCEL_PROJECT_ID     # Get from Vercel project settings
SUPABASE_URL          # Your Supabase project URL
SUPABASE_ANON_KEY     # Your Supabase anon key
```

### 3.2 Enable Actions
1. Go to Actions tab in GitHub
2. Enable workflows if prompted
3. CI/CD pipeline will run on:
   - Every push to `main` (production deploy)
   - Every pull request (preview deploy)

## Step 4: Custom Domain (Optional)

### 4.1 Add Domain in Vercel
1. Go to your project in Vercel
2. Settings > Domains
3. Add your custom domain
4. Follow DNS configuration instructions

### 4.2 Update Environment Variables
Update these in Vercel dashboard:
```bash
NEXT_PUBLIC_APP_URL=https://your-custom-domain.com
NEXT_PUBLIC_PLAUSIBLE_DOMAIN=your-custom-domain.com
```

### 4.3 Update Supabase
1. Go to Supabase > Authentication > URL Configuration
2. Update Site URL to your custom domain
3. Add redirect URL for custom domain

## Step 5: Post-Deployment Checklist

### 5.1 Verify Core Features
- [ ] Homepage loads correctly
- [ ] All 18 games are playable
- [ ] Guest can play without login
- [ ] Authentication works (sign up/sign in)
- [ ] Scores are saved and displayed
- [ ] Leaderboards show data
- [ ] Dark mode toggle works
- [ ] PWA installation prompt appears

### 5.2 Test Performance
1. Run Lighthouse audit:
   - Performance > 90
   - Accessibility > 95
   - Best Practices > 90
   - SEO > 100

2. Check Core Web Vitals:
   - LCP < 2.5s
   - FID < 100ms
   - CLS < 0.1

### 5.3 Monitor
1. Check Vercel Analytics dashboard
2. Monitor Supabase usage metrics
3. Set up alerts for errors

## Step 6: Maintenance

### Regular Tasks
- **Daily**: Check error logs in Vercel
- **Weekly**: Review analytics and performance
- **Monthly**: Update dependencies
- **Quarterly**: Security audit

### Updating Production
1. Create feature branch from `main`
2. Make changes and test locally
3. Create pull request
4. Review preview deployment
5. Merge to `main` (auto-deploys)

## Troubleshooting

### Build Fails
- Check environment variables are set
- Verify Node.js version (18.x required)
- Clear cache and redeploy

### Database Connection Issues
- Verify Supabase URL and keys
- Check RLS policies aren't blocking
- Ensure migrations ran successfully

### Performance Issues
- Enable caching headers (configured in vercel.json)
- Optimize images with next/image
- Use ISR for static pages

### Authentication Problems
- Verify redirect URLs in Supabase
- Check CORS settings
- Ensure cookies are enabled

## Support

For issues:
1. Check [Vercel Status](https://vercel-status.com)
2. Check [Supabase Status](https://status.supabase.com)
3. Review deployment logs in Vercel
4. Open issue in GitHub repository

## Cost Estimation

### Free Tier Limits
- **Vercel**: 100GB bandwidth, unlimited deployments
- **Supabase**: 500MB database, 2GB bandwidth, 50K auth users
- **GitHub Actions**: 2000 minutes/month

### Estimated Monthly Costs (10K users)
- Vercel Pro: $20/month
- Supabase Pro: $25/month
- Total: ~$45/month

## Security Notes

1. **Never commit** `.env.local` or `.env.production`
2. **Keep secret** the service role key
3. **Rotate keys** quarterly
4. **Enable 2FA** on all accounts
5. **Monitor** for suspicious activity