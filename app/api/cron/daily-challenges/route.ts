import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client with service role key for admin operations
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

// Verify cron secret to ensure only Vercel can call this endpoint
const CRON_SECRET = process.env.CRON_SECRET;

// List of games for daily challenges
const GAMES = [
  'cps-test', 'typing-test', 'reaction-time', 'mental-math', 
  'aim-trainer', 'memory-match', 'snake', '2048', 'tetris'
];

// Challenge types with requirements
const CHALLENGE_TYPES = [
  { type: 'score', description: 'Achieve a score of {target}' },
  { type: 'time', description: 'Complete in under {target} seconds' },
  { type: 'streak', description: 'Get a streak of {target}' },
  { type: 'accuracy', description: 'Achieve {target}% accuracy' },
  { type: 'speed', description: 'Reach {target} actions per minute' }
];

function generateDailyChallenge() {
  const game = GAMES[Math.floor(Math.random() * GAMES.length)];
  const challengeType = CHALLENGE_TYPES[Math.floor(Math.random() * CHALLENGE_TYPES.length)];
  
  // Generate appropriate target based on game and challenge type
  let target: number;
  switch (challengeType.type) {
    case 'score':
      target = Math.floor(Math.random() * 5000) + 1000;
      break;
    case 'time':
      target = Math.floor(Math.random() * 120) + 30;
      break;
    case 'streak':
      target = Math.floor(Math.random() * 20) + 5;
      break;
    case 'accuracy':
      target = Math.floor(Math.random() * 30) + 70;
      break;
    case 'speed':
      target = Math.floor(Math.random() * 100) + 50;
      break;
    default:
      target = 100;
  }
  
  return {
    game_type: game,
    challenge_type: challengeType.type,
    description: challengeType.description.replace('{target}', target.toString()),
    target_value: target,
    xp_reward: Math.floor(Math.random() * 500) + 100,
    active_date: new Date().toISOString().split('T')[0]
  };
}

export async function GET(request: NextRequest) {
  try {
    // Verify the request is from Vercel Cron
    const authHeader = request.headers.get('authorization');
    if (CRON_SECRET && authHeader !== `Bearer ${CRON_SECRET}`) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Generate 3 daily challenges
    const challenges = [
      generateDailyChallenge(),
      generateDailyChallenge(),
      generateDailyChallenge()
    ];

    // Remove yesterday's challenges
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    
    const { error: deleteError } = await supabase
      .from('daily_challenges')
      .delete()
      .lt('active_date', yesterday.toISOString().split('T')[0]);

    if (deleteError) {
      console.error('Error deleting old challenges:', deleteError);
    }

    // Insert new challenges
    const { data, error } = await supabase
      .from('daily_challenges')
      .insert(challenges)
      .select();

    if (error) {
      console.error('Error creating daily challenges:', error);
      return NextResponse.json(
        { error: 'Failed to create daily challenges' },
        { status: 500 }
      );
    }

    // Send notification to all users about new challenges
    // This would integrate with your push notification service
    
    return NextResponse.json({
      success: true,
      message: 'Daily challenges created successfully',
      challenges: data
    });

  } catch (error) {
    console.error('Cron job error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Health check endpoint for monitoring
export async function HEAD() {
  return new NextResponse(null, { status: 200 });
}