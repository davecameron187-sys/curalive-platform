import { describe, it, expect } from 'vitest';
import crypto from 'crypto';

/**
 * Test to validate Recall.ai webhook secret configuration
 * Ensures the RECALL_AI_WEBHOOK_SECRET is properly set and can be used
 * for webhook signature verification
 */
describe('Recall.ai Webhook Configuration', () => {
  it('should have RECALL_AI_WEBHOOK_SECRET environment variable set', () => {
    const secret = process.env.RECALL_AI_WEBHOOK_SECRET;
    expect(secret).toBeDefined();
    expect(typeof secret).toBe('string');
  });

  it('should have RECALL_AI_WEBHOOK_SECRET in correct format (whsec_...)', () => {
    const secret = process.env.RECALL_AI_WEBHOOK_SECRET;
    expect(secret).toBeDefined();
    expect(secret).toMatch(/^whsec_[a-f0-9]{64}$/);
  });

  it('should have valid webhook secret length', () => {
    const secret = process.env.RECALL_AI_WEBHOOK_SECRET;
    expect(secret).toBeDefined();
    // whsec_ prefix (6 chars) + 64 hex chars = 70 total
    expect(secret!.length).toBe(70);
  });

  it('should be able to create webhook signatures with the secret', () => {
    const secret = process.env.RECALL_AI_WEBHOOK_SECRET;
    expect(secret).toBeDefined();

    // Simulate webhook signature creation
    const payload = JSON.stringify({ test: 'webhook' });
    const timestamp = Math.floor(Date.now() / 1000);
    const message = `${timestamp}.${payload}`;

    // Extract the key part (remove whsec_ prefix)
    const keyPart = secret!.substring(6);
    
    // Create HMAC signature
    const signature = crypto
      .createHmac('sha256', Buffer.from(keyPart, 'hex'))
      .update(message)
      .digest('hex');

    expect(signature).toBeDefined();
    expect(signature.length).toBeGreaterThan(0);
  });

  it('should not be empty or placeholder value', () => {
    const secret = process.env.RECALL_AI_WEBHOOK_SECRET;
    expect(secret).not.toBe('');
    expect(secret).not.toBe('your-recall-webhook-secret');
    expect(secret).not.toBe('undefined');
    expect(secret).not.toContain('REPLACE');
  });

  it('should be suitable for Shadow Mode webhook verification', () => {
    const secret = process.env.RECALL_AI_WEBHOOK_SECRET;
    expect(secret).toBeDefined();

    // Verify it can be used for webhook verification
    const isValidFormat = /^whsec_[a-f0-9]{64}$/.test(secret!);
    expect(isValidFormat).toBe(true);

    // Shadow Mode will use this to verify webhook requests from Recall.ai
    expect(secret!.length).toBe(70);
  });
});
