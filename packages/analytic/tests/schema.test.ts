import { describe, it, expect } from 'vitest';
import { AnalyticEventSchema } from '../src/schema.js';

describe('AnalyticEventSchema', () => {
  it('parses a valid post.read event', () => {
    const result = AnalyticEventSchema.safeParse({
      timestamp: '2026-04-09T12:00:00.000Z',
      event_type: 'post.read',
      species: 'human',
      session_id: 'abc123',
      content_node: 'my-post',
      metadata: {},
    });
    expect(result.success).toBe(true);
  });

  it('parses a wikilink.followed event with optional fields', () => {
    const result = AnalyticEventSchema.safeParse({
      timestamp: '2026-04-09T12:00:00.000Z',
      event_type: 'wikilink.followed',
      species: 'agent',
      session_id: 'session-42',
      content_node: 'target-post',
      source_node: 'source-post',
      edge_id: 'source-post->target-post',
      metadata: { tool: 'read_post' },
    });
    expect(result.success).toBe(true);
  });

  it('defaults metadata to empty object when omitted', () => {
    const result = AnalyticEventSchema.safeParse({
      timestamp: '2026-04-09T12:00:00.000Z',
      event_type: 'crawler.visit',
      species: 'crawler',
      session_id: 'gptbot-1',
      content_node: 'some-post',
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.metadata).toEqual({});
    }
  });

  it('rejects an unknown event_type', () => {
    const result = AnalyticEventSchema.safeParse({
      timestamp: '2026-04-09T12:00:00.000Z',
      event_type: 'unknown.event',
      species: 'human',
      session_id: 'abc',
      content_node: 'post',
    });
    expect(result.success).toBe(false);
  });

  it('rejects an invalid timestamp', () => {
    const result = AnalyticEventSchema.safeParse({
      timestamp: 'not-a-date',
      event_type: 'post.read',
      species: 'human',
      session_id: 'abc',
      content_node: 'post',
    });
    expect(result.success).toBe(false);
  });

  it('rejects missing content_node', () => {
    const result = AnalyticEventSchema.safeParse({
      timestamp: '2026-04-09T12:00:00.000Z',
      event_type: 'post.read',
      species: 'human',
      session_id: 'abc',
    });
    expect(result.success).toBe(false);
  });
});
