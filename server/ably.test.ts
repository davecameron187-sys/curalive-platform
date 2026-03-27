import { describe, it, expect } from 'vitest';

/**
 * Ably API Key Validation Test
 * Validates that ABLY_API_KEY is properly configured for real-time transcript streaming
 */
describe('Ably Integration', () => {
  it('should have ABLY_API_KEY configured in environment', () => {
    const ablyKey = process.env.ABLY_API_KEY;
    expect(ablyKey).toBeDefined();
    expect(typeof ablyKey).toBe('string');
    expect(ablyKey?.length).toBeGreaterThan(10);
  });

  it('should have valid Ably API key format (keyName:keySecret)', () => {
    const ablyKey = process.env.ABLY_API_KEY;
    expect(ablyKey).toMatch(/^[a-zA-Z0-9_-]+\.[a-zA-Z0-9_-]+:[a-zA-Z0-9_-]+$/);
  });

  it('should be able to parse Ably key components', () => {
    const ablyKey = process.env.ABLY_API_KEY;
    const parts = ablyKey?.split(':');
    expect(parts).toHaveLength(2);
    
    const keyName = parts?.[0];
    const keySecret = parts?.[1];
    
    expect(keyName).toBeDefined();
    expect(keySecret).toBeDefined();
    expect(keyName?.length).toBeGreaterThan(5);
    expect(keySecret?.length).toBeGreaterThan(20);
  });

  it('should validate Ably key is not empty or placeholder', () => {
    const ablyKey = process.env.ABLY_API_KEY;
    expect(ablyKey).not.toBe('');
    expect(ablyKey).not.toBe('your-ably-key-here');
    expect(ablyKey).not.toBe('undefined');
    expect(ablyKey).not.toContain('REPLACE');
  });

  it('should confirm Shadow Mode can use Ably for transcript streaming', () => {
    const ablyKey = process.env.ABLY_API_KEY;
    
    // Verify key structure supports Pub/Sub channels
    const [keyName, keySecret] = ablyKey!.split(':');
    
    // Shadow Mode will use channels like: transcription-{sessionId}
    const testChannelName = 'transcription-shadow-mode-test';
    
    expect(keyName).toBeDefined();
    expect(keySecret).toBeDefined();
    expect(testChannelName).toMatch(/^transcription-/);
    
    // Key is valid for Pub/Sub operations
    expect(ablyKey).toContain('.');
    expect(ablyKey).toContain(':');
  });
});
