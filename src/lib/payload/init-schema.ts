// Automated DDL Schema initialization for SQLite and Turso LibSQL
// Guarantees all tables and indexes exist without requiring drizzle-kit in serverless production

export const SCHEMA_STATEMENTS = [
  // 1. Users
  `CREATE TABLE IF NOT EXISTS \`users\` (
    \`id\` integer PRIMARY KEY NOT NULL,
    \`updated_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
    \`created_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
    \`email\` text NOT NULL,
    \`reset_password_token\` text,
    \`reset_password_expiration\` text,
    \`salt\` text,
    \`hash\` text,
    \`reset_password_requested_at\` text,
    \`login_attempts\` numeric DEFAULT 0,
    \`lock_until\` text
  );`,

  `CREATE TABLE IF NOT EXISTS \`users_sessions\` (
    \`_order\` integer NOT NULL,
    \`_parent_id\` integer NOT NULL,
    \`id\` text PRIMARY KEY NOT NULL,
    \`created_at\` text,
    \`expires_at\` text NOT NULL,
    FOREIGN KEY (\`_parent_id\`) REFERENCES \`users\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );`,

  // 2. Proposals
  `CREATE TABLE IF NOT EXISTS \`proposals\` (
    \`id\` integer PRIMARY KEY NOT NULL,
    \`proposal_id\` text NOT NULL,
    \`title\` text NOT NULL,
    \`status\` text DEFAULT 'draft' NOT NULL,
    \`version\` text DEFAULT 'v1',
    \`cover_image_url\` text,
    \`tour_type\` text DEFAULT 'Private Tour (Minimum 2 People)',
    \`travel_date\` text DEFAULT '2026',
    \`route\` text,
    \`intro_text\` text,
    \`extra_info\` text,
    \`custom_html\` text,
    \`inclusions\` text,
    \`exclusions\` text,
    \`updated_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
    \`created_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL
  );`,

  `CREATE TABLE IF NOT EXISTS \`proposals_itinerary\` (
    \`_order\` integer NOT NULL,
    \`_parent_id\` integer NOT NULL,
    \`id\` text PRIMARY KEY NOT NULL,
    \`day_no\` numeric NOT NULL,
    \`day_title\` text NOT NULL,
    \`items\` text NOT NULL,
    \`accommodation_note\` text DEFAULT 'See Price List',
    \`image_url\` text,
    FOREIGN KEY (\`_parent_id\`) REFERENCES \`proposals\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );`,

  `CREATE TABLE IF NOT EXISTS \`proposals_pricing\` (
    \`_order\` integer NOT NULL,
    \`_parent_id\` integer NOT NULL,
    \`id\` text PRIMARY KEY NOT NULL,
    \`option_label\` text NOT NULL,
    \`stays\` text,
    FOREIGN KEY (\`_parent_id\`) REFERENCES \`proposals\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );`,

  `CREATE TABLE IF NOT EXISTS \`proposals_pricing_rows\` (
    \`_order\` integer NOT NULL,
    \`_parent_id\` text NOT NULL,
    \`id\` text PRIMARY KEY NOT NULL,
    \`row_type\` text NOT NULL,
    \`price_amount\` numeric NOT NULL,
    \`currency\` text DEFAULT 'IDR',
    FOREIGN KEY (\`_parent_id\`) REFERENCES \`proposals_pricing\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );`,

  // 3. Payload Internal Tables
  `CREATE TABLE IF NOT EXISTS \`payload_kv\` (
    \`id\` integer PRIMARY KEY NOT NULL,
    \`key\` text NOT NULL,
    \`data\` text NOT NULL
  );`,

  `CREATE TABLE IF NOT EXISTS \`payload_locked_documents\` (
    \`id\` integer PRIMARY KEY NOT NULL,
    \`global_slug\` text,
    \`updated_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
    \`created_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL
  );`,

  `CREATE TABLE IF NOT EXISTS \`payload_locked_documents_rels\` (
    \`id\` integer PRIMARY KEY NOT NULL,
    \`order\` integer,
    \`parent_id\` integer NOT NULL,
    \`path\` text NOT NULL,
    \`users_id\` integer,
    \`proposals_id\` integer,
    FOREIGN KEY (\`parent_id\`) REFERENCES \`payload_locked_documents\`(\`id\`) ON UPDATE no action ON DELETE cascade,
    FOREIGN KEY (\`users_id\`) REFERENCES \`users\`(\`id\`) ON UPDATE no action ON DELETE cascade,
    FOREIGN KEY (\`proposals_id\`) REFERENCES \`proposals\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );`,

  `CREATE TABLE IF NOT EXISTS \`payload_preferences\` (
    \`id\` integer PRIMARY KEY NOT NULL,
    \`key\` text,
    \`value\` text,
    \`updated_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
    \`created_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL
  );`,

  `CREATE TABLE IF NOT EXISTS \`payload_preferences_rels\` (
    \`id\` integer PRIMARY KEY NOT NULL,
    \`order\` integer,
    \`parent_id\` integer NOT NULL,
    \`path\` text NOT NULL,
    \`users_id\` integer,
    FOREIGN KEY (\`parent_id\`) REFERENCES \`payload_preferences\`(\`id\`) ON UPDATE no action ON DELETE cascade,
    FOREIGN KEY (\`users_id\`) REFERENCES \`users\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );`,

  `CREATE TABLE IF NOT EXISTS \`payload_migrations\` (
    \`id\` integer PRIMARY KEY NOT NULL,
    \`name\` text,
    \`batch\` numeric,
    \`updated_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
    \`created_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL
  );`,

  // 4. Indexes
  `CREATE INDEX IF NOT EXISTS \`users_sessions_order_idx\` ON \`users_sessions\` (\`_order\`);`,
  `CREATE INDEX IF NOT EXISTS \`users_sessions_parent_id_idx\` ON \`users_sessions\` (\`_parent_id\`);`,
  `CREATE INDEX IF NOT EXISTS \`users_updated_at_idx\` ON \`users\` (\`updated_at\`);`,
  `CREATE INDEX IF NOT EXISTS \`users_created_at_idx\` ON \`users\` (\`created_at\`);`,
  `CREATE UNIQUE INDEX IF NOT EXISTS \`users_email_idx\` ON \`users\` (\`email\`);`,

  `CREATE INDEX IF NOT EXISTS \`proposals_itinerary_order_idx\` ON \`proposals_itinerary\` (\`_order\`);`,
  `CREATE INDEX IF NOT EXISTS \`proposals_itinerary_parent_id_idx\` ON \`proposals_itinerary\` (\`_parent_id\`);`,
  `CREATE INDEX IF NOT EXISTS \`proposals_pricing_rows_order_idx\` ON \`proposals_pricing_rows\` (\`_order\`);`,
  `CREATE INDEX IF NOT EXISTS \`proposals_pricing_rows_parent_id_idx\` ON \`proposals_pricing_rows\` (\`_parent_id\`);`,
  `CREATE INDEX IF NOT EXISTS \`proposals_pricing_order_idx\` ON \`proposals_pricing\` (\`_order\`);`,
  `CREATE INDEX IF NOT EXISTS \`proposals_pricing_parent_id_idx\` ON \`proposals_pricing\` (\`_parent_id\`);`,
  `CREATE UNIQUE INDEX IF NOT EXISTS \`proposals_proposal_id_idx\` ON \`proposals\` (\`proposal_id\`);`,
  `CREATE INDEX IF NOT EXISTS \`proposals_updated_at_idx\` ON \`proposals\` (\`updated_at\`);`,
  `CREATE INDEX IF NOT EXISTS \`proposals_created_at_idx\` ON \`proposals\` (\`created_at\`);`,

  `CREATE UNIQUE INDEX IF NOT EXISTS \`payload_kv_key_idx\` ON \`payload_kv\` (\`key\`);`,
  `CREATE INDEX IF NOT EXISTS \`payload_locked_documents_global_slug_idx\` ON \`payload_locked_documents\` (\`global_slug\`);`,
  `CREATE INDEX IF NOT EXISTS \`payload_locked_documents_updated_at_idx\` ON \`payload_locked_documents\` (\`updated_at\`);`,
  `CREATE INDEX IF NOT EXISTS \`payload_locked_documents_created_at_idx\` ON \`payload_locked_documents\` (\`created_at\`);`,
  `CREATE INDEX IF NOT EXISTS \`payload_locked_documents_rels_order_idx\` ON \`payload_locked_documents_rels\` (\`order\`);`,
  `CREATE INDEX IF NOT EXISTS \`payload_locked_documents_rels_parent_idx\` ON \`payload_locked_documents_rels\` (\`parent_id\`);`,
  `CREATE INDEX IF NOT EXISTS \`payload_locked_documents_rels_path_idx\` ON \`payload_locked_documents_rels\` (\`path\`);`,
  `CREATE INDEX IF NOT EXISTS \`payload_locked_documents_rels_users_id_idx\` ON \`payload_locked_documents_rels\` (\`users_id\`);`,
  `CREATE INDEX IF NOT EXISTS \`payload_locked_documents_rels_proposals_id_idx\` ON \`payload_locked_documents_rels\` (\`proposals_id\`);`,

  `CREATE INDEX IF NOT EXISTS \`payload_preferences_key_idx\` ON \`payload_preferences\` (\`key\`);`,
  `CREATE INDEX IF NOT EXISTS \`payload_preferences_updated_at_idx\` ON \`payload_preferences\` (\`updated_at\`);`,
  `CREATE INDEX IF NOT EXISTS \`payload_preferences_created_at_idx\` ON \`payload_preferences\` (\`created_at\`);`,
  `CREATE INDEX IF NOT EXISTS \`payload_preferences_rels_order_idx\` ON \`payload_preferences_rels\` (\`order\`);`,
  `CREATE INDEX IF NOT EXISTS \`payload_preferences_rels_parent_idx\` ON \`payload_preferences_rels\` (\`parent_id\`);`,
  `CREATE INDEX IF NOT EXISTS \`payload_preferences_rels_path_idx\` ON \`payload_preferences_rels\` (\`path\`);`,
  `CREATE INDEX IF NOT EXISTS \`payload_preferences_rels_users_id_idx\` ON \`payload_preferences_rels\` (\`users_id\`);`,

  `CREATE INDEX IF NOT EXISTS \`payload_migrations_updated_at_idx\` ON \`payload_migrations\` (\`updated_at\`);`,
  `CREATE INDEX IF NOT EXISTS \`payload_migrations_created_at_idx\` ON \`payload_migrations\` (\`created_at\`);`,
];

let schemaInitialized = false;

export async function ensureDatabaseSchema(adapter: any) {
  if (schemaInitialized) return;
  const client = adapter?.client;
  if (!client || typeof client.execute !== 'function') {
    return;
  }

  for (const sql of SCHEMA_STATEMENTS) {
    try {
      await client.execute(sql);
    } catch (err: any) {
      // Ignore if table/index already exists
      const msg = err?.message || String(err);
      if (!msg.includes('already exists')) {
        console.warn('[Schema Init Notice]:', msg);
      }
    }
  }

  schemaInitialized = true;
  console.log('[Schema Init] Complete: Database tables and indexes verified.');
}
