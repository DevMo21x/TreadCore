import Database from 'better-sqlite3';
import type { Preset, Segment } from '@/types/preset';
import { fileURLToPath } from 'url';

const db = new Database('sqlite.db');

function presetsExist() {
  const row = db.prepare('SELECT COUNT(1) as c FROM presets').get();
  return row && row.c > 0;
}

type SeedPreset = Omit<Preset, 'id' | 'tags'> & { tags?: string[] | string | null };

function insertPreset(preset: SeedPreset) {
  const insert = db.prepare(
    `INSERT INTO presets (name, description, author_id, visibility, tags, difficulty, total_duration_seconds) VALUES (?, ?, ?, ?, ?, ?, ?)`
  );
  const info = insert.run(
    preset.name,
    preset.description || null,
    null,
    preset.visibility || 'public',
    Array.isArray(preset.tags) ? preset.tags.join(',') : preset.tags || null,
    preset.difficulty || 'moderate',
    preset.totalDurationSeconds || null
  );

  const presetId = info.lastInsertRowid as number;
  const insertSeg = db.prepare(
    `INSERT INTO preset_segments (preset_id, position, name, duration_seconds, speed, incline) VALUES (?, ?, ?, ?, ?, ?)`
  );
  const tr = db.transaction((segs: Segment[]) => {
    segs.forEach((s, i) =>
      insertSeg.run(presetId, i, s.name || null, s.duration_seconds, s.speed, s.incline)
    );
  });
  tr(preset.segments || []);
}

function seed() {
  if (!db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='presets'").get()) {
    console.log('Presets table not found. Run migrations first.');
    return;
  }

  if (presetsExist()) {
    console.log('Presets already exist; skipping seed.');
    return;
  }

  const defaults = [
    {
      name: 'Easy Walk',
      description: 'Gentle 20 minute walk to warm up',
      tags: ['walk', 'warmup'],
      difficulty: 'easy',
      totalDurationSeconds: 20 * 60,
      visibility: 'public',
      segments: [
        { name: 'Warmup', duration_seconds: 600, speed: 3.0, incline: 0 },
        { name: 'Steady', duration_seconds: 900, speed: 3.5, incline: 0 },
        { name: 'Cooldown', duration_seconds: 300, speed: 2.5, incline: 0 },
      ],
    },
    {
      name: 'Interval Run',
      description: '30 min intervals: alternate high and recovery',
      tags: ['run', 'intervals'],
      difficulty: 'hard',
      totalDurationSeconds: 30 * 60,
      visibility: 'public',
      segments: [
        { name: 'Warmup', duration_seconds: 300, speed: 6.0, incline: 0 },
        { name: 'Sprint 1', duration_seconds: 60, speed: 10.0, incline: 1 },
        { name: 'Recover 1', duration_seconds: 120, speed: 6.0, incline: 0 },
        { name: 'Sprint 2', duration_seconds: 60, speed: 10.0, incline: 1 },
        { name: 'Recover 2', duration_seconds: 120, speed: 6.0, incline: 0 },
        { name: 'Cooldown', duration_seconds: 300, speed: 4.0, incline: 0 },
      ],
    },
    {
      name: 'Hill Climb',
      description: 'Progressive incline climb for strength',
      tags: ['hill', 'strength'],
      difficulty: 'moderate',
      totalDurationSeconds: 25 * 60,
      visibility: 'public',
      segments: [
        { name: 'Warmup', duration_seconds: 300, speed: 5.0, incline: 0 },
        { name: 'Ramp 1', duration_seconds: 600, speed: 5.0, incline: 2 },
        { name: 'Ramp 2', duration_seconds: 600, speed: 5.0, incline: 4 },
        { name: 'Ramp 3', duration_seconds: 600, speed: 5.0, incline: 6 },
        { name: 'Cooldown', duration_seconds: 300, speed: 4.0, incline: 0 },
      ],
    },
    {
      name: 'Recovery Ride',
      description: 'Low intensity recovery',
      tags: ['recovery'],
      difficulty: 'easy',
      totalDurationSeconds: 15 * 60,
      visibility: 'public',
      segments: [{ name: 'Easy', duration_seconds: 900, speed: 4.0, incline: 0 }],
    },
    {
      name: 'Tempo Run',
      description: 'Sustained tempo effort',
      tags: ['tempo', 'run'],
      difficulty: 'moderate',
      totalDurationSeconds: 35 * 60,
      visibility: 'public',
      segments: [
        { name: 'Warmup', duration_seconds: 600, speed: 5.5, incline: 0 },
        { name: 'Tempo', duration_seconds: 2100, speed: 7.5, incline: 1 },
        { name: 'Cooldown', duration_seconds: 600, speed: 4.5, incline: 0 },
      ],
    },
    {
      name: 'Progressive Ramp',
      description: 'Gradual speed ramp to near-max',
      tags: ['ramp', 'speed'],
      difficulty: 'hard',
      totalDurationSeconds: 20 * 60,
      visibility: 'public',
      segments: [
        { name: 'Start', duration_seconds: 300, speed: 5.0, incline: 0 },
        { name: 'Mid', duration_seconds: 600, speed: 7.0, incline: 0 },
        { name: 'Peak', duration_seconds: 600, speed: 9.0, incline: 0 },
        { name: 'Cooldown', duration_seconds: 300, speed: 4.0, incline: 0 },
      ],
    },
  ];

  console.log(`Seeding ${defaults.length} default presets...`);
  const tx = db.transaction(() => {
    defaults.forEach((p) => insertPreset(p));
  });
  tx();
  console.log('Presets seeded.');
}

const __filename = fileURLToPath(import.meta.url);

if (process.argv[1] && process.argv[1] === __filename) {
  // Run seed when executed directly: `node ./src/db/seed-presets.ts`
  seed();
}

export default seed;
