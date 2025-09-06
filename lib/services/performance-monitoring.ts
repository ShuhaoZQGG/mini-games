/**
 * Performance Monitoring Service
 * Tracks Core Web Vitals and other performance metrics
 */

import analytics from './analytics';

interface PerformanceMetric {
  name: string;
  value: number;
  rating: 'good' | 'needs-improvement' | 'poor';
  delta?: number;
  id: string;
  navigationType?: string;
  url?: string;
}

interface PerformanceThresholds {
  good: number;
  poor: number;
}

interface ResourceTiming {
  name: string;
  type: string;
  duration: number;
  size: number;
  startTime: number;
}

interface MemoryInfo {
  usedJSHeapSize: number;
  totalJSHeapSize: number;
  jsHeapSizeLimit: number;
}

class PerformanceMonitoringService {
  private metrics: Map<string, PerformanceMetric> = new Map();
  private observer: PerformanceObserver | null = null;
  private resourceObserver: PerformanceObserver | null = null;
  private reportingEndpoint: string;
  private debugMode: boolean;
  private sessionId: string;
  private metricsQueue: PerformanceMetric[] = [];
  private batchTimer: NodeJS.Timeout | null = null;
  private navigationStart: number = 0;

  // Core Web Vitals thresholds
  private readonly thresholds = {
    LCP: { good: 2500, poor: 4000 }, // Largest Contentful Paint
    FID: { good: 100, poor: 300 },   // First Input Delay
    CLS: { good: 0.1, poor: 0.25 },  // Cumulative Layout Shift
    FCP: { good: 1800, poor: 3000 }, // First Contentful Paint
    TTFB: { good: 800, poor: 1800 }, // Time to First Byte
    INP: { good: 200, poor: 500 },   // Interaction to Next Paint
  };

  constructor() {
    this.reportingEndpoint = process.env.NEXT_PUBLIC_PERFORMANCE_ENDPOINT || '/api/performance';
    this.debugMode = process.env.NODE_ENV === 'development';
    this.sessionId = this.generateSessionId();

    if (typeof window !== 'undefined') {
      this.navigationStart = performance.timeOrigin || performance.timing.navigationStart;
      this.initializeObservers();
      this.measureInitialMetrics();
      this.setupMemoryMonitoring();
      this.setupResourceMonitoring();
      this.setupErrorMonitoring();
    }
  }

  private generateSessionId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  private initializeObservers() {
    // Check for browser support
    if (!('PerformanceObserver' in window)) {
      console.warn('PerformanceObserver not supported');
      return;
    }

    try {
      // Observe Core Web Vitals
      this.observeLCP();
      this.observeFID();
      this.observeCLS();
      this.observeFCP();
      this.observeTTFB();
      this.observeINP();
      
      // Observe long tasks
      this.observeLongTasks();
      
      // Observe layout shifts
      this.observeLayoutShifts();
    } catch (error) {
      console.error('Failed to initialize performance observers:', error);
    }
  }

  private observeLCP() {
    try {
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const lastEntry = entries[entries.length - 1] as any;
        
        const metric: PerformanceMetric = {
          name: 'LCP',
          value: lastEntry.renderTime || lastEntry.loadTime,
          rating: this.getRating('LCP', lastEntry.renderTime || lastEntry.loadTime),
          id: this.generateMetricId(),
          url: window.location.href,
        };

        this.recordMetric(metric);
      });

      observer.observe({ type: 'largest-contentful-paint', buffered: true });
    } catch (error) {
      // LCP not supported
    }
  }

  private observeFID() {
    try {
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const firstEntry = entries[0] as any;
        
        const metric: PerformanceMetric = {
          name: 'FID',
          value: firstEntry.processingStart - firstEntry.startTime,
          rating: this.getRating('FID', firstEntry.processingStart - firstEntry.startTime),
          id: this.generateMetricId(),
          url: window.location.href,
        };

        this.recordMetric(metric);
        observer.disconnect();
      });

      observer.observe({ type: 'first-input', buffered: true });
    } catch (error) {
      // FID not supported
    }
  }

  private observeCLS() {
    let clsValue = 0;
    let clsEntries: any[] = [];
    let sessionValue = 0;
    let sessionEntries: any[] = [];

    try {
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries() as any[]) {
          // Only count layout shifts without recent user input
          if (!entry.hadRecentInput) {
            const firstSessionEntry = sessionEntries[0];
            const lastSessionEntry = sessionEntries[sessionEntries.length - 1];

            // If the entry is more than 5 seconds after the previous entry or
            // more than 1 second after the first entry, start a new session
            if (sessionValue &&
                entry.startTime - lastSessionEntry.startTime > 5000 ||
                entry.startTime - firstSessionEntry.startTime > 1000) {
              sessionValue = entry.value;
              sessionEntries = [entry];
            } else {
              sessionValue += entry.value;
              sessionEntries.push(entry);
            }

            // Keep track of the max session value
            if (sessionValue > clsValue) {
              clsValue = sessionValue;
              clsEntries = sessionEntries;

              const metric: PerformanceMetric = {
                name: 'CLS',
                value: clsValue,
                rating: this.getRating('CLS', clsValue),
                id: this.generateMetricId(),
                delta: entry.value,
                url: window.location.href,
              };

              this.recordMetric(metric);
            }
          }
        }
      });

      observer.observe({ type: 'layout-shift', buffered: true });
    } catch (error) {
      // CLS not supported
    }
  }

  private observeFCP() {
    try {
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const fcpEntry = entries.find(entry => entry.name === 'first-contentful-paint');
        
        if (fcpEntry) {
          const metric: PerformanceMetric = {
            name: 'FCP',
            value: fcpEntry.startTime,
            rating: this.getRating('FCP', fcpEntry.startTime),
            id: this.generateMetricId(),
            url: window.location.href,
          };

          this.recordMetric(metric);
          observer.disconnect();
        }
      });

      observer.observe({ type: 'paint', buffered: true });
    } catch (error) {
      // FCP not supported
    }
  }

  private observeTTFB() {
    try {
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const navigationEntry = entries.find(entry => entry.entryType === 'navigation') as any;
        
        if (navigationEntry) {
          const ttfb = navigationEntry.responseStart - navigationEntry.requestStart;
          
          const metric: PerformanceMetric = {
            name: 'TTFB',
            value: ttfb,
            rating: this.getRating('TTFB', ttfb),
            id: this.generateMetricId(),
            navigationType: navigationEntry.type,
            url: window.location.href,
          };

          this.recordMetric(metric);
          observer.disconnect();
        }
      });

      observer.observe({ type: 'navigation', buffered: true });
    } catch (error) {
      // TTFB not supported
    }
  }

  private observeINP() {
    let inpValue = 0;
    const interactions: any[] = [];

    try {
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries() as any[]) {
          if (entry.interactionId) {
            interactions.push(entry);
            
            // Calculate INP as the 98th percentile of interactions
            const sortedInteractions = [...interactions].sort((a, b) => b.duration - a.duration);
            const index = Math.min(Math.floor(sortedInteractions.length * 0.98), sortedInteractions.length - 1);
            const newINP = sortedInteractions[index]?.duration || 0;

            if (newINP !== inpValue) {
              inpValue = newINP;
              
              const metric: PerformanceMetric = {
                name: 'INP',
                value: inpValue,
                rating: this.getRating('INP', inpValue),
                id: this.generateMetricId(),
                url: window.location.href,
              };

              this.recordMetric(metric);
            }
          }
        }
      });

      observer.observe({ type: 'event', buffered: true } as PerformanceObserverInit);
    } catch (error) {
      // INP not supported
    }
  }

  private observeLongTasks() {
    try {
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.duration > 50) {
            this.recordLongTask({
              duration: entry.duration,
              startTime: entry.startTime,
              name: entry.name,
            });
          }
        }
      });

      observer.observe({ type: 'longtask', buffered: true });
    } catch (error) {
      // Long tasks not supported
    }
  }

  private observeLayoutShifts() {
    const shifts: any[] = [];

    try {
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries() as any[]) {
          if (!entry.hadRecentInput && entry.value > 0.01) {
            shifts.push({
              value: entry.value,
              startTime: entry.startTime,
              sources: entry.sources?.map((source: any) => ({
                node: source.node?.tagName,
                previousRect: source.previousRect,
                currentRect: source.currentRect,
              })),
            });

            if (this.debugMode) {
              console.warn('Layout shift detected:', entry);
            }
          }
        }
      });

      observer.observe({ type: 'layout-shift', buffered: true });
    } catch (error) {
      // Layout shift observation not supported
    }
  }

  private setupResourceMonitoring() {
    if (!('PerformanceObserver' in window)) return;

    try {
      this.resourceObserver = new PerformanceObserver((list) => {
        const resources: ResourceTiming[] = [];
        
        for (const entry of list.getEntries() as PerformanceResourceTiming[]) {
          if (entry.duration > 100) { // Only track resources taking > 100ms
            resources.push({
              name: entry.name,
              type: entry.initiatorType,
              duration: entry.duration,
              size: entry.transferSize || 0,
              startTime: entry.startTime,
            });
          }
        }

        if (resources.length > 0) {
          this.recordResourceTimings(resources);
        }
      });

      this.resourceObserver.observe({ type: 'resource', buffered: true });
    } catch (error) {
      // Resource timing not supported
    }
  }

  private setupMemoryMonitoring() {
    if (!('memory' in performance)) return;

    // Monitor memory usage every 30 seconds
    setInterval(() => {
      const memory = (performance as any).memory;
      if (memory) {
        const memoryInfo: MemoryInfo = {
          usedJSHeapSize: memory.usedJSHeapSize,
          totalJSHeapSize: memory.totalJSHeapSize,
          jsHeapSizeLimit: memory.jsHeapSizeLimit,
        };

        this.recordMemoryUsage(memoryInfo);
      }
    }, 30000);
  }

  private setupErrorMonitoring() {
    // Monitor JavaScript errors
    window.addEventListener('error', (event) => {
      this.recordError({
        message: event.message,
        source: event.filename,
        line: event.lineno,
        column: event.colno,
        stack: event.error?.stack,
      });
    });

    // Monitor unhandled promise rejections
    window.addEventListener('unhandledrejection', (event) => {
      this.recordError({
        message: `Unhandled Promise Rejection: ${event.reason}`,
        stack: event.reason?.stack,
      });
    });
  }

  private measureInitialMetrics() {
    // Measure initial page load metrics
    if (window.performance && window.performance.timing) {
      const timing = window.performance.timing;
      const navigationStart = timing.navigationStart;

      // Calculate various timings
      const metrics = {
        domContentLoaded: timing.domContentLoadedEventEnd - navigationStart,
        domComplete: timing.domComplete - navigationStart,
        loadComplete: timing.loadEventEnd - navigationStart,
        domInteractive: timing.domInteractive - navigationStart,
        dnsLookup: timing.domainLookupEnd - timing.domainLookupStart,
        tcpConnect: timing.connectEnd - timing.connectStart,
        request: timing.responseStart - timing.requestStart,
        response: timing.responseEnd - timing.responseStart,
        domProcessing: timing.domComplete - timing.domLoading,
      };

      Object.entries(metrics).forEach(([name, value]) => {
        if (value > 0) {
          this.recordCustomMetric(name, value);
        }
      });
    }
  }

  private getRating(metricName: string, value: number): 'good' | 'needs-improvement' | 'poor' {
    const threshold = this.thresholds[metricName as keyof typeof this.thresholds];
    if (!threshold) return 'good';

    if (value <= threshold.good) return 'good';
    if (value <= threshold.poor) return 'needs-improvement';
    return 'poor';
  }

  private generateMetricId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  private recordMetric(metric: PerformanceMetric) {
    this.metrics.set(metric.name, metric);
    this.metricsQueue.push(metric);

    if (this.debugMode) {
      console.log(`[Performance] ${metric.name}: ${metric.value.toFixed(2)}ms (${metric.rating})`);
    }

    // Batch metrics for reporting
    this.scheduleBatchReport();

    // Report to analytics immediately for Core Web Vitals
    if (['LCP', 'FID', 'CLS', 'FCP', 'TTFB', 'INP'].includes(metric.name)) {
      this.reportToAnalytics(metric);
    }
  }

  private recordLongTask(task: any) {
    if (this.debugMode) {
      console.warn(`[Performance] Long task detected: ${task.duration.toFixed(2)}ms`);
    }

    analytics.trackCustom('long_task', {
      duration: Math.round(task.duration),
      startTime: Math.round(task.startTime),
    });
  }

  private recordResourceTimings(resources: ResourceTiming[]) {
    // Group resources by type
    const grouped = resources.reduce((acc, resource) => {
      if (!acc[resource.type]) {
        acc[resource.type] = [];
      }
      acc[resource.type].push(resource);
      return acc;
    }, {} as Record<string, ResourceTiming[]>);

    // Calculate aggregates by type
    Object.entries(grouped).forEach(([type, items]) => {
      const totalDuration = items.reduce((sum, item) => sum + item.duration, 0);
      const totalSize = items.reduce((sum, item) => sum + item.size, 0);

      analytics.trackCustom('resource_timing', {
        type,
        count: items.length,
        totalDuration: Math.round(totalDuration),
        totalSize: Math.round(totalSize),
        avgDuration: Math.round(totalDuration / items.length),
      });
    });
  }

  private recordMemoryUsage(memory: MemoryInfo) {
    const usagePercent = (memory.usedJSHeapSize / memory.jsHeapSizeLimit) * 100;

    if (this.debugMode && usagePercent > 90) {
      console.warn(`[Performance] High memory usage: ${usagePercent.toFixed(2)}%`);
    }

    analytics.trackCustom('memory_usage', {
      used: Math.round(memory.usedJSHeapSize / 1048576), // Convert to MB
      total: Math.round(memory.totalJSHeapSize / 1048576),
      limit: Math.round(memory.jsHeapSizeLimit / 1048576),
      percentage: Math.round(usagePercent),
    });
  }

  private recordError(error: any) {
    analytics.trackCustom('js_error', {
      message: error.message?.substring(0, 200),
      source: error.source?.substring(0, 100),
      line: error.line || 0,
      column: error.column || 0,
    });
  }

  private recordCustomMetric(name: string, value: number) {
    analytics.trackTiming('page_load', name, value);
  }

  private scheduleBatchReport() {
    if (this.batchTimer) return;

    this.batchTimer = setTimeout(() => {
      this.sendBatchReport();
      this.batchTimer = null;
    }, 5000); // Send batch every 5 seconds
  }

  private async sendBatchReport() {
    if (this.metricsQueue.length === 0) return;

    const metrics = [...this.metricsQueue];
    this.metricsQueue = [];

    try {
      await fetch(this.reportingEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: this.sessionId,
          metrics,
          timestamp: Date.now(),
          url: window.location.href,
          userAgent: navigator.userAgent,
        }),
      });
    } catch (error) {
      // Reporting failed, re-queue metrics
      this.metricsQueue.unshift(...metrics);
    }
  }

  private reportToAnalytics(metric: PerformanceMetric) {
    const webVitals = {
      lcp: metric.name === 'LCP' ? metric.value : 0,
      fid: metric.name === 'FID' ? metric.value : 0,
      cls: metric.name === 'CLS' ? metric.value : 0,
      fcp: metric.name === 'FCP' ? metric.value : 0,
      ttfb: metric.name === 'TTFB' ? metric.value : 0,
      inp: metric.name === 'INP' ? metric.value : 0,
    };

    analytics.trackPerformance(webVitals);
  }

  // Public API

  /**
   * Get current Core Web Vitals metrics
   */
  getCoreWebVitals() {
    return {
      LCP: this.metrics.get('LCP'),
      FID: this.metrics.get('FID'),
      CLS: this.metrics.get('CLS'),
      FCP: this.metrics.get('FCP'),
      TTFB: this.metrics.get('TTFB'),
      INP: this.metrics.get('INP'),
    };
  }

  /**
   * Mark a custom timing
   */
  mark(name: string) {
    if (window.performance && window.performance.mark) {
      window.performance.mark(name);
    }
  }

  /**
   * Measure between two marks
   */
  measure(name: string, startMark: string, endMark: string) {
    if (window.performance && window.performance.measure) {
      try {
        window.performance.measure(name, startMark, endMark);
        const entries = window.performance.getEntriesByName(name, 'measure');
        if (entries.length > 0) {
          const duration = entries[entries.length - 1].duration;
          this.recordCustomMetric(name, duration);
        }
      } catch (error) {
        console.error('Failed to measure performance:', error);
      }
    }
  }

  /**
   * Clean up observers
   */
  destroy() {
    if (this.observer) {
      this.observer.disconnect();
    }
    if (this.resourceObserver) {
      this.resourceObserver.disconnect();
    }
    if (this.batchTimer) {
      clearTimeout(this.batchTimer);
      this.sendBatchReport();
    }
  }
}

// Create singleton instance
const performanceMonitoring = new PerformanceMonitoringService();

// Export service
export default performanceMonitoring;