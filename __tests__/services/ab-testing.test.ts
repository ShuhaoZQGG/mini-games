/**
 * Tests for A/B Testing Service
 */

import abTesting from '@/lib/services/ab-testing';

describe('A/B Testing Service', () => {
  beforeEach(() => {
    // Clear any cached variants
    abTesting.clearForcedVariants();
    
    // Mock localStorage
    const localStorageMock = {
      getItem: jest.fn(),
      setItem: jest.fn(),
      clear: jest.fn(),
    };
    Object.defineProperty(window, 'localStorage', {
      value: localStorageMock,
      writable: true,
    });
  });

  describe('getVariant', () => {
    it('should return a variant for running experiments', () => {
      const variant = abTesting.getVariant('new_onboarding');
      
      expect(variant).toBeDefined();
      expect(variant?.id).toMatch(/control|variant_a/);
      expect(variant?.weight).toBe(50);
    });

    it('should return null for non-existent experiments', () => {
      const variant = abTesting.getVariant('non_existent');
      
      expect(variant).toBeNull();
    });

    it('should return consistent variant for same user', () => {
      const variant1 = abTesting.getVariant('new_onboarding');
      const variant2 = abTesting.getVariant('new_onboarding');
      
      expect(variant1?.id).toBe(variant2?.id);
    });

    it('should respect forced variants', () => {
      abTesting.forceVariant('new_onboarding', 'variant_a');
      
      const variant = abTesting.getVariant('new_onboarding');
      
      expect(variant?.id).toBe('variant_a');
    });
  });

  describe('isFeatureEnabled', () => {
    it('should check if feature flags are enabled', () => {
      // Dark mode is 100% rolled out
      const darkModeEnabled = abTesting.isFeatureEnabled('dark_mode');
      expect(darkModeEnabled).toBe(true);
      
      // AI hints is disabled
      const aiHintsEnabled = abTesting.isFeatureEnabled('ai_hints');
      expect(aiHintsEnabled).toBe(false);
    });

    it('should return false for non-existent flags', () => {
      const enabled = abTesting.isFeatureEnabled('non_existent');
      expect(enabled).toBe(false);
    });

    it('should handle partial rollouts consistently', () => {
      // Advanced stats is 50% rollout
      const results = new Set();
      
      // Test multiple times - should be consistent for same session
      for (let i = 0; i < 10; i++) {
        const enabled = abTesting.isFeatureEnabled('advanced_stats');
        results.add(enabled);
      }
      
      // Should be consistent (only one result)
      expect(results.size).toBe(1);
    });
  });

  describe('getFeatureConfig', () => {
    it('should return feature configuration when enabled', () => {
      // Force the feature to be enabled for testing
      const flagId = 'advanced_stats';
      
      // Mock isFeatureEnabled to return true
      jest.spyOn(abTesting, 'isFeatureEnabled').mockReturnValue(true);
      
      const config = abTesting.getFeatureConfig(flagId);
      
      expect(config).toBeDefined();
      expect(config).toHaveProperty('charts');
      expect(config).toHaveProperty('heatmaps');
    });

    it('should return null for disabled features', () => {
      const config = abTesting.getFeatureConfig('ai_hints');
      expect(config).toBeNull();
    });

    it('should return empty object for flags without variations', () => {
      // Mock isFeatureEnabled to return true
      jest.spyOn(abTesting, 'isFeatureEnabled').mockReturnValue(true);
      
      const config = abTesting.getFeatureConfig('dark_mode');
      expect(config).toEqual({});
    });
  });

  describe('trackGoal', () => {
    it('should track goal completion for experiments', () => {
      // Get a variant first to ensure user is in experiment
      const variant = abTesting.getVariant('new_onboarding');
      expect(variant).toBeDefined();
      
      // Track a goal
      const setItemSpy = jest.spyOn(Storage.prototype, 'setItem');
      abTesting.trackGoal('user_signup', true);
      
      // Should save result to localStorage in mock mode
      expect(setItemSpy).toHaveBeenCalled();
    });
  });

  describe('getActiveExperiments', () => {
    it('should return all running experiments', () => {
      const experiments = abTesting.getActiveExperiments();
      
      expect(experiments).toBeInstanceOf(Array);
      expect(experiments.length).toBeGreaterThan(0);
      expect(experiments.every(exp => exp.status === 'running')).toBe(true);
    });
  });

  describe('getAllFeatureFlags', () => {
    it('should return all feature flags', () => {
      const flags = abTesting.getAllFeatureFlags();
      
      expect(flags).toBeInstanceOf(Array);
      expect(flags.length).toBeGreaterThan(0);
      expect(flags.some(flag => flag.id === 'dark_mode')).toBe(true);
      expect(flags.some(flag => flag.id === 'multiplayer_mode')).toBe(true);
    });
  });

  describe('variant allocation', () => {
    it('should allocate variants according to weights', () => {
      const results = { control: 0, variant_a: 0 };
      
      // Force different allocations by clearing cache
      for (let i = 0; i < 100; i++) {
        abTesting.clearForcedVariants();
        
        // Mock different session IDs
        const originalSessionId = (abTesting as any).sessionId;
        (abTesting as any).sessionId = `session-${i}`;
        
        const variant = abTesting.getVariant('new_onboarding');
        if (variant) {
          results[variant.id as keyof typeof results]++;
        }
        
        // Restore original session ID
        (abTesting as any).sessionId = originalSessionId;
      }
      
      // With 50/50 split, both should have allocations
      expect(results.control).toBeGreaterThan(0);
      expect(results.variant_a).toBeGreaterThan(0);
      
      // Should be roughly 50/50 (allowing for randomness)
      const ratio = results.control / results.variant_a;
      expect(ratio).toBeGreaterThan(0.5);
      expect(ratio).toBeLessThan(2);
    });
  });
});