# Supabase Database Setup Instructions

## Prerequisites
1. Create a Supabase account at [supabase.com](https://supabase.com)
2. Create a new Supabase project

## Setup Steps

### 1. Get Supabase Credentials
1. Go to your Supabase project dashboard
2. Navigate to Settings > API
3. Copy the following values:
   - Project URL (anon key)
   - Anon/public key

### 2. Configure Environment Variables
1. Copy `.env.example` to `.env.local`:
   ```bash
   cp .env.example .env.local
   ```

2. Update `.env.local` with your actual Supabase credentials:
   ```
   NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
   NODE_ENV=development
   ```

### 3. Set up Database Schema
1. Go to your Supabase project dashboard
2. Navigate to SQL Editor
3. Copy and paste the contents of `migrations/001_initial_schema.sql`
4. Run the SQL script

### 4. Verify Setup
1. Check that all tables are created in the Table Editor
2. Verify that Row Level Security is enabled
3. Test the connection by running the application

## Database Schema Overview

The database includes the following main tables:

- **games**: Game metadata and information
- **scores**: Individual game scores from players
- **leaderboards**: Optimized leaderboard data with rankings
- **profiles**: User profile information
- **achievements**: Achievement definitions
- **user_achievements**: User achievement tracking

## Security Notes

- Row Level Security (RLS) is enabled on all user-facing tables
- Guests can submit scores using session-based identification
- Authenticated users have full access to their own data
- Leaderboards are publicly readable

## Testing

After setup, you can test the database connection by:
1. Playing any game and submitting a score
2. Checking the leaderboard functionality
3. Verifying data appears in your Supabase dashboard