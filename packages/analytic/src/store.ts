import { DatabaseSync } from 'node:sqlite';
import { mkdirSync, existsSync } from 'node:fs';
import { dirname } from 'node:path';
import type { AnalyticEvent } from './schema.js';

export interface PostStats {
  slug: string;
  views: number;
  unique_sessions: number;
  avg_depth: number | null;
}

export interface EdgeStats {
  source: string;
  target: string;
  follows: number;
}

export interface DayCount {
  day: string;   // YYYY-MM-DD
  count: number;
}

export interface AnalyticStore {
  insert(event: AnalyticEvent): void;
  getTotalViews(): number;
  getUniqueSessionCount(): number;
  getTopPosts(limit?: number): PostStats[];
  getTopEdges(limit?: number): EdgeStats[];
  getDailyViews(days?: number): DayCount[];
  close(): void;
}

const INSERT_SQL = `
  INSERT INTO events
    (timestamp, event_type, species, session_id, content_node, source_node, edge_id, metadata)
  VALUES
    (@timestamp, @event_type, @species, @session_id, @content_node, @source_node, @edge_id, @metadata)
`;

const SCHEMA_SQL = `
  CREATE TABLE IF NOT EXISTS events (
    id           INTEGER PRIMARY KEY AUTOINCREMENT,
    timestamp    TEXT    NOT NULL,
    event_type   TEXT    NOT NULL,
    species      TEXT    NOT NULL,
    session_id   TEXT    NOT NULL,
    content_node TEXT    NOT NULL,
    source_node  TEXT,
    edge_id      TEXT,
    metadata     TEXT    NOT NULL DEFAULT '{}'
  );
  CREATE INDEX IF NOT EXISTS idx_ts    ON events(timestamp);
  CREATE INDEX IF NOT EXISTS idx_node  ON events(content_node);
  CREATE INDEX IF NOT EXISTS idx_sp    ON events(species);
  CREATE INDEX IF NOT EXISTS idx_sess  ON events(session_id);
`;

export function createStore(dbPath: string): AnalyticStore {
  mkdirSync(dirname(dbPath), { recursive: true });
  const db = new DatabaseSync(dbPath);
  db.exec('PRAGMA journal_mode = WAL');
  db.exec(SCHEMA_SQL);

  const insertStmt = db.prepare(INSERT_SQL);

  return {
    insert(event: AnalyticEvent) {
      insertStmt.run({
        timestamp:    event.timestamp,
        event_type:   event.event_type,
        species:      event.species,
        session_id:   event.session_id,
        content_node: event.content_node,
        source_node:  event.source_node ?? null,
        edge_id:      event.edge_id ?? null,
        metadata:     JSON.stringify(event.metadata),
      });
    },

    getTotalViews(): number {
      const row = db.prepare(
        `SELECT COUNT(*) as n FROM events WHERE event_type = 'post.read'`,
      ).get() as unknown as { n: number };
      return row.n;
    },

    getUniqueSessionCount(): number {
      const row = db.prepare(
        `SELECT COUNT(DISTINCT session_id) as n FROM events`,
      ).get() as unknown as { n: number };
      return row.n;
    },

    getTopPosts(limit = 10): PostStats[] {
      return db.prepare(`
        SELECT
          content_node                              AS slug,
          COUNT(*)                                  AS views,
          COUNT(DISTINCT session_id)                AS unique_sessions,
          AVG(CAST(json_extract(metadata, '$.reading_depth') AS REAL)) AS avg_depth
        FROM events
        WHERE event_type = 'post.read'
        GROUP BY content_node
        ORDER BY views DESC
        LIMIT ?
      `).all(limit) as unknown as PostStats[];
    },

    getTopEdges(limit = 10): EdgeStats[] {
      return db.prepare(`
        SELECT
          source_node  AS source,
          content_node AS target,
          COUNT(*)     AS follows
        FROM events
        WHERE event_type = 'wikilink.followed'
          AND source_node IS NOT NULL
        GROUP BY source_node, content_node
        ORDER BY follows DESC
        LIMIT ?
      `).all(limit) as unknown as EdgeStats[];
    },

    getDailyViews(days = 14): DayCount[] {
      return db.prepare(`
        SELECT
          date(timestamp)  AS day,
          COUNT(*)         AS count
        FROM events
        WHERE event_type = 'post.read'
          AND timestamp >= datetime('now', ?)
        GROUP BY day
        ORDER BY day ASC
      `).all(`-${days} days`) as unknown as DayCount[];
    },

    close() {
      db.close();
    },
  };
}

/** Singleton store for the VRA Lab site (one instance per process). */
let _store: AnalyticStore | null = null;

export function getStore(dbPath: string): AnalyticStore {
  if (!_store) _store = createStore(dbPath);
  return _store;
}

/** Returns store only if the DB file already exists (analytics have been collected). */
export function getStoreIfExists(dbPath: string): AnalyticStore | null {
  if (!existsSync(dbPath)) return null;
  return getStore(dbPath);
}
