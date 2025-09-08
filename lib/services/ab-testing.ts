/**
 * A/B Testing Framework with Feature Flags
 * Enables experimentation and gradual feature rollout
 */

import { createClient } from '@/lib/supabase/client';
import analytics from './analytics';

interface Experiment {
  id: string;
  name: string;
  description: string;
  status: 'draft' | 'running' | 'paused' | 'completed';
  variants: Variant[];
  targeting?: TargetingRule[];
  allocation: AllocationMethod;
  startDate?: Date;
  endDate?: Date;
  goals: Goal[];
}

interface Variant {
  id: string;
  name: string;
  weight: number; // Percentage of traffic (0-100)
  config: Record<string, any>;
  isControl?: boolean;
}

interface TargetingRule {
  type: 'user_property' | 'device' | 'location' | 'custom';
  property: string;
  operator: 'equals' | 'contains' | 'greater_than' | 'less_than' | 'in' | 'not_in';
  value: any;
}

interface AllocationMethod {
  type: 'random' | 'deterministic' | 'progressive';
  seed?: string; // For deterministic allocation
  rampUp?: RampUpConfig; // For progressive rollout
}

interface RampUpConfig {
  startPercentage: number;
  endPercentage: number;
  duration: number; // in hours
}

interface Goal {
  id: string;
  name: string;
  type: 'conversion' | 'engagement' | 'retention' | 'custom';
  metric: string;
  target?: number;
}

interface FeatureFlag {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  rolloutPercentage: number;
  targeting?: TargetingRule[];
  variations?: Record<string, any>;
}

interface ExperimentResult {
  experimentId: string;
  variantId: string;
  userId?: string;
  sessionId: string;
  timestamp: Date;
  goals: Record<string, any>;
}

class ABTestingService {
  private experiments: Map<string, Experiment> = new Map();
  private featureFlags: Map<string, FeatureFlag> = new Map();
  private userVariants: Map<string, string> = new Map(); // Cache user variant assignments
  private userId: string | null = null;
  private sessionId: string;
  private deviceInfo: Record<string, any>;
  private mockMode: boolean = true; // Use mock data when Supabase not configured

  constructor() {
    this.sessionId = this.generateSessionId();
    this.deviceInfo = this.getDeviceInfo();
    this.initializeUser();
    this.loadExperiments();
    this.loadFeatureFlags();
  }

  private generateSessionId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  private getDeviceInfo(): Record<string, any> {
    if (typeof window === 'undefined') {
      return {};
    }

    return {
      userAgent: navigator.userAgent,
      platform: navigator.platform,
      language: navigator.language,
      screenWidth: window.screen.width,
      screenHeight: window.screen.height,
      viewport: {
        width: window.innerWidth,
        height: window.innerHeight,
      },
      isMobile: /Mobile|Android|iPhone|iPad/i.test(navigator.userAgent),
      isTablet: /iPad|Android/i.test(navigator.userAgent) && !/Mobile/i.test(navigator.userAgent),
    };
  }

  private async initializeUser() {
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      this.userId = user?.id || null;
    } catch (error) {
      this.userId = null;
    }
  }

  private async loadExperiments() {
    if (this.mockMode) {
      // Load mock experiments for testing
      this.experiments = new Map([
        ['new_onboarding', {
          id: 'new_onboarding',
          name: 'New User Onboarding Flow',
          description: 'Testing new onboarding tutorial vs existing flow',
          status: 'running',
          variants: [
            { id: 'control', name: 'Current Flow', weight: 50, config: { showTutorial: false }, isControl: true },
            { id: 'variant_a', name: 'Interactive Tutorial', weight: 50, config: { showTutorial: true } },
          ],
          allocation: { type: 'random' },
          goals: [
            { id: 'signup', name: 'User Signup', type: 'conversion', metric: 'user_signup' },
            { id: 'first_game', name: 'First Game Played', type: 'engagement', metric: 'game_start' },
          ],
        }],
        ['game_difficulty', {
          id: 'game_difficulty',
          name: 'Dynamic Difficulty Adjustment',
          description: 'Testing AI-powered difficulty adjustment',
          status: 'running',
          variants: [
            { id: 'control', name: 'Static Difficulty', weight: 60, config: { dynamic: false }, isControl: true },
            { id: 'variant_a', name: 'Dynamic Adjustment', weight: 40, config: { dynamic: true } },
          ],
          allocation: { 
            type: 'progressive',
            rampUp: { startPercentage: 10, endPercentage: 40, duration: 168 } // 1 week ramp
          },
          goals: [
            { id: 'retention', name: 'Player Retention', type: 'retention', metric: 'return_rate' },
            { id: 'games_played', name: 'Games per Session', type: 'engagement', metric: 'games_count' },
          ],
        }],
      ]);
    } else {
      // Load from Supabase
      try {
        const supabase = createClient();
        const { data, error } = await supabase
          .from('experiments')
          .select('*')
          .eq('status', 'running');

        if (!error && data) {
          data.forEach((exp: any) => {
            this.experiments.set(exp.id, exp as Experiment);
          });
        }
      } catch (error) {
        console.error('Failed to load experiments:', error);
      }
    }
  }

  private async loadFeatureFlags() {
    if (this.mockMode) {
      // Load mock feature flags
      this.featureFlags = new Map([
        ['multiplayer_mode', {
          id: 'multiplayer_mode',
          name: 'Multiplayer Mode',
          description: 'Enable real-time multiplayer for supported games',
          enabled: true,
          rolloutPercentage: 25,
          targeting: [
            { type: 'user_property', property: 'games_played', operator: 'greater_than', value: 10 }
          ],
        }],
        ['dark_mode', {
          id: 'dark_mode',
          name: 'Dark Mode',
          description: 'Enable dark theme option',
          enabled: true,
          rolloutPercentage: 100,
        }],
        ['advanced_stats', {
          id: 'advanced_stats',
          name: 'Advanced Statistics',
          description: 'Show detailed game statistics and analytics',
          enabled: true,
          rolloutPercentage: 50,
          variations: {
            basic: { charts: false, heatmaps: false },
            advanced: { charts: true, heatmaps: true },
          },
        }],
        ['ai_hints', {
          id: 'ai_hints',
          name: 'AI-Powered Hints',
          description: 'Provide intelligent hints during gameplay',
          enabled: false,
          rolloutPercentage: 0,
        }],
      ]);
    } else {
      // Load from Supabase
      try {
        const supabase = createClient();
        const { data, error } = await supabase
          .from('feature_flags')
          .select('*')
          .eq('enabled', true);

        if (!error && data) {
          data.forEach((flag: any) => {
            this.featureFlags.set(flag.id, flag as FeatureFlag);
          });
        }
      } catch (error) {
        console.error('Failed to load feature flags:', error);
      }
    }
  }

  // Public methods

  /**
   * Get variant for a user in an experiment
   */
  getVariant(experimentId: string): Variant | null {
    const experiment = this.experiments.get(experimentId);
    if (!experiment || experiment.status !== 'running') {
      return null;
    }

    // Check if user meets targeting criteria
    if (!this.meetsTargeting(experiment.targeting)) {
      return null;
    }

    // Check cached assignment
    const cacheKey = `${experimentId}_${this.userId || this.sessionId}`;
    if (this.userVariants.has(cacheKey)) {
      const variantId = this.userVariants.get(cacheKey)!;
      return experiment.variants.find(v => v.id === variantId) || null;
    }

    // Allocate variant
    const variant = this.allocateVariant(experiment);
    if (variant) {
      this.userVariants.set(cacheKey, variant.id);
      this.trackExperimentExposure(experimentId, variant.id);
    }

    return variant;
  }

  /**
   * Check if a feature flag is enabled for the current user
   */
  isFeatureEnabled(flagId: string): boolean {
    const flag = this.featureFlags.get(flagId);
    if (!flag || !flag.enabled) {
      return false;
    }

    // Check targeting rules
    if (!this.meetsTargeting(flag.targeting)) {
      return false;
    }

    // Check rollout percentage
    const hash = this.hashString(`${flagId}_${this.userId || this.sessionId}`);
    const bucket = (hash % 100) + 1;
    return bucket <= flag.rolloutPercentage;
  }

  /**
   * Get feature flag configuration
   */
  getFeatureConfig(flagId: string): Record<string, any> | null {
    const flag = this.featureFlags.get(flagId);
    if (!flag || !this.isFeatureEnabled(flagId)) {
      return null;
    }

    if (flag.variations) {
      // Determine which variation to return
      const hash = this.hashString(`${flagId}_variation_${this.userId || this.sessionId}`);
      const variations = Object.keys(flag.variations);
      const index = hash % variations.length;
      return flag.variations[variations[index]];
    }

    return {};
  }

  /**
   * Track goal completion for an experiment
   */
  trackGoal(goalName: string, value?: any) {
    // Find experiments with this goal
    this.experiments.forEach((experiment, experimentId) => {
      const variant = this.getVariant(experimentId);
      if (variant) {
        const goal = experiment.goals.find(g => g.metric === goalName);
        if (goal) {
          this.recordGoalCompletion(experimentId, variant.id, goal.id, value);
        }
      }
    });

    // Also track in analytics
    analytics.trackGoal(goalName, value);
  }

  /**
   * Get all active experiments for debugging
   */
  getActiveExperiments(): Experiment[] {
    return Array.from(this.experiments.values()).filter(
      exp => exp.status === 'running'
    );
  }

  /**
   * Get all feature flags for debugging
   */
  getAllFeatureFlags(): FeatureFlag[] {
    return Array.from(this.featureFlags.values());
  }

  /**
   * Force a specific variant for testing
   */
  forceVariant(experimentId: string, variantId: string) {
    const experiment = this.experiments.get(experimentId);
    if (experiment) {
      const variant = experiment.variants.find(v => v.id === variantId);
      if (variant) {
        const cacheKey = `${experimentId}_${this.userId || this.sessionId}`;
        this.userVariants.set(cacheKey, variantId);
      }
    }
  }

  /**
   * Clear all forced variants
   */
  clearForcedVariants() {
    this.userVariants.clear();
  }

  // Private helper methods

  private meetsTargeting(rules?: TargetingRule[]): boolean {
    if (!rules || rules.length === 0) {
      return true;
    }

    return rules.every(rule => {
      switch (rule.type) {
        case 'device':
          return this.evaluateDeviceRule(rule);
        case 'user_property':
          return this.evaluateUserPropertyRule(rule);
        case 'location':
          return this.evaluateLocationRule(rule);
        case 'custom':
          return this.evaluateCustomRule(rule);
        default:
          return true;
      }
    });
  }

  private evaluateDeviceRule(rule: TargetingRule): boolean {
    const value = this.deviceInfo[rule.property];
    return this.compareValues(value, rule.operator, rule.value);
  }

  private evaluateUserPropertyRule(rule: TargetingRule): boolean {
    // This would typically check user properties from database
    // For now, return true for mock mode
    return true;
  }

  private evaluateLocationRule(rule: TargetingRule): boolean {
    // This would check user location
    // For now, return true for mock mode
    return true;
  }

  private evaluateCustomRule(rule: TargetingRule): boolean {
    // Custom rule evaluation logic
    return true;
  }

  private compareValues(actual: any, operator: string, expected: any): boolean {
    switch (operator) {
      case 'equals':
        return actual === expected;
      case 'contains':
        return String(actual).includes(String(expected));
      case 'greater_than':
        return actual > expected;
      case 'less_than':
        return actual < expected;
      case 'in':
        return Array.isArray(expected) && expected.includes(actual);
      case 'not_in':
        return Array.isArray(expected) && !expected.includes(actual);
      default:
        return false;
    }
  }

  private allocateVariant(experiment: Experiment): Variant | null {
    const { allocation, variants } = experiment;

    switch (allocation.type) {
      case 'random':
        return this.randomAllocation(variants);
      case 'deterministic':
        return this.deterministicAllocation(variants, allocation.seed);
      case 'progressive':
        return this.progressiveAllocation(variants, allocation.rampUp);
      default:
        return null;
    }
  }

  private randomAllocation(variants: Variant[]): Variant {
    const random = Math.random() * 100;
    let cumulative = 0;

    for (const variant of variants) {
      cumulative += variant.weight;
      if (random <= cumulative) {
        return variant;
      }
    }

    return variants[variants.length - 1];
  }

  private deterministicAllocation(variants: Variant[], seed?: string): Variant {
    const hash = this.hashString(`${seed || ''}_${this.userId || this.sessionId}`);
    const bucket = hash % 100;
    let cumulative = 0;

    for (const variant of variants) {
      cumulative += variant.weight;
      if (bucket < cumulative) {
        return variant;
      }
    }

    return variants[variants.length - 1];
  }

  private progressiveAllocation(variants: Variant[], rampUp?: RampUpConfig): Variant {
    if (!rampUp) {
      return this.randomAllocation(variants);
    }

    // Calculate current percentage based on ramp-up schedule
    const now = Date.now();
    const startTime = Date.now() - (rampUp.duration * 60 * 60 * 1000);
    const elapsed = now - startTime;
    const progress = Math.min(elapsed / (rampUp.duration * 60 * 60 * 1000), 1);
    const currentPercentage = rampUp.startPercentage + 
      (rampUp.endPercentage - rampUp.startPercentage) * progress;

    // Adjust variant weights based on current percentage
    const adjustedVariants = variants.map(v => ({
      ...v,
      weight: v.isControl ? (100 - currentPercentage) : currentPercentage
    }));

    return this.randomAllocation(adjustedVariants);
  }

  private hashString(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash);
  }

  private trackExperimentExposure(experimentId: string, variantId: string) {
    analytics.trackCustom('experiment_exposure', {
      experiment_id: experimentId,
      variant_id: variantId,
      user_id: this.userId || '',
      session_id: this.sessionId,
    });
  }

  private async recordGoalCompletion(
    experimentId: string,
    variantId: string,
    goalId: string,
    value: any
  ) {
    const result: ExperimentResult = {
      experimentId,
      variantId,
      userId: this.userId || undefined,
      sessionId: this.sessionId,
      timestamp: new Date(),
      goals: { [goalId]: value },
    };

    if (this.mockMode) {
      // Store in localStorage for mock mode
      const key = `experiment_results_${experimentId}`;
      const existing = localStorage.getItem(key);
      const results = existing ? JSON.parse(existing) : [];
      results.push(result);
      localStorage.setItem(key, JSON.stringify(results));
    } else {
      // Save to Supabase
      try {
        const supabase = createClient();
        await supabase.from('experiment_results').insert(result as any);
      } catch (error) {
        console.error('Failed to record experiment result:', error);
      }
    }

    // Track in analytics
    analytics.trackCustom('experiment_goal', {
      experiment_id: experimentId,
      variant_id: variantId,
      goal_id: goalId,
      value: value,
    });
  }
}

// Create singleton instance
const abTesting = new ABTestingService();

// Export service and helper functions
export default abTesting;

export const getVariant = (experimentId: string) => abTesting.getVariant(experimentId);
export const isFeatureEnabled = (flagId: string) => abTesting.isFeatureEnabled(flagId);
export const getFeatureConfig = (flagId: string) => abTesting.getFeatureConfig(flagId);
export const trackGoal = (goalName: string, value?: any) => abTesting.trackGoal(goalName, value);