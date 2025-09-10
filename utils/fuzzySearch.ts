/**
 * Fuzzy search utility for game searching
 * Implements Levenshtein distance and fuzzy matching
 */

export interface SearchResult<T> {
  item: T;
  score: number;
  matches: string[];
}

/**
 * Calculate Levenshtein distance between two strings
 */
function levenshteinDistance(str1: string, str2: string): number {
  const m = str1.length;
  const n = str2.length;
  const dp: number[][] = Array(m + 1).fill(null).map(() => Array(n + 1).fill(0));

  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (str1[i - 1] === str2[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1];
      } else {
        dp[i][j] = Math.min(
          dp[i - 1][j] + 1,    // deletion
          dp[i][j - 1] + 1,    // insertion
          dp[i - 1][j - 1] + 1 // substitution
        );
      }
    }
  }

  return dp[m][n];
}

/**
 * Check if query is a substring match (with tolerance for typos)
 */
function fuzzySubstringMatch(query: string, target: string, maxDistance: number = 2): boolean {
  query = query.toLowerCase();
  target = target.toLowerCase();
  
  // Direct substring match
  if (target.includes(query)) return true;
  
  // Check each substring of target that's similar length to query
  const queryLen = query.length;
  for (let i = 0; i <= target.length - queryLen; i++) {
    const substring = target.substr(i, queryLen + maxDistance);
    const distance = levenshteinDistance(query, substring);
    if (distance <= maxDistance) return true;
  }
  
  return false;
}

/**
 * Score a match based on various criteria
 */
function calculateMatchScore(
  query: string,
  target: string,
  fieldWeight: number = 1
): number {
  query = query.toLowerCase();
  target = target.toLowerCase();
  
  let score = 0;
  
  // Exact match
  if (target === query) {
    score += 100 * fieldWeight;
  }
  // Starts with query
  else if (target.startsWith(query)) {
    score += 80 * fieldWeight;
  }
  // Contains as word boundary
  else if (new RegExp(`\\b${query}`, 'i').test(target)) {
    score += 60 * fieldWeight;
  }
  // Contains query
  else if (target.includes(query)) {
    score += 40 * fieldWeight;
  }
  // Fuzzy match
  else {
    const distance = levenshteinDistance(query, target);
    const maxLen = Math.max(query.length, target.length);
    const similarity = 1 - (distance / maxLen);
    if (similarity > 0.6) {
      score += similarity * 30 * fieldWeight;
    }
  }
  
  return score;
}

/**
 * Perform fuzzy search on a collection of items
 */
export function fuzzySearch<T>(
  query: string,
  items: T[],
  fields: {
    key: keyof T;
    weight?: number;
  }[],
  threshold: number = 0.3
): SearchResult<T>[] {
  if (!query || query.trim() === '') {
    return items.map(item => ({
      item,
      score: 0,
      matches: []
    }));
  }
  
  const results: SearchResult<T>[] = [];
  const queryTerms = query.toLowerCase().split(/\s+/);
  
  for (const item of items) {
    let totalScore = 0;
    const matches: string[] = [];
    
    for (const field of fields) {
      const value = String(item[field.key] || '');
      const weight = field.weight || 1;
      
      for (const term of queryTerms) {
        const score = calculateMatchScore(term, value, weight);
        if (score > 0) {
          totalScore += score;
          if (!matches.includes(field.key as string)) {
            matches.push(field.key as string);
          }
        }
      }
    }
    
    // Normalize score
    const normalizedScore = totalScore / (queryTerms.length * 100);
    
    if (normalizedScore >= threshold) {
      results.push({
        item,
        score: normalizedScore,
        matches
      });
    }
  }
  
  // Sort by score descending
  return results.sort((a, b) => b.score - a.score);
}

/**
 * Highlight matching parts in text
 */
export function highlightMatches(text: string, query: string): string {
  if (!query) return text;
  
  const terms = query.split(/\s+/).filter(t => t.length > 0);
  let highlighted = text;
  
  for (const term of terms) {
    const regex = new RegExp(`(${term})`, 'gi');
    highlighted = highlighted.replace(regex, '<mark>$1</mark>');
  }
  
  return highlighted;
}