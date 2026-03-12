import pg from 'pg'
const { Client } = pg

const client = new Client({
  connectionString: 'postgresql://postgres.wzorqpwfqrwritypyrvy:GQY3nGkJfVzMcfo5@aws-1-us-east-1.pooler.supabase.com:6543/postgres',
  ssl: { rejectUnauthorized: false },
})

async function setup() {
  await client.connect()
  console.log('Connected to Supabase')

  // Create tables
  console.log('\n--- Creating tables ---')

  await client.query(`
    CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

    -- Events
    CREATE TABLE IF NOT EXISTS events (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      slug TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      access_code TEXT UNIQUE,
      description TEXT,
      location TEXT,
      starts_at TIMESTAMPTZ,
      ends_at TIMESTAMPTZ,
      cover_image_url TEXT,
      is_virtual BOOLEAN DEFAULT false,
      is_active BOOLEAN DEFAULT true,
      created_at TIMESTAMPTZ DEFAULT now()
    );

    -- Sessions (device-based auth)
    CREATE TABLE IF NOT EXISTS sessions (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
      device_hash TEXT NOT NULL,
      token TEXT UNIQUE NOT NULL,
      created_at TIMESTAMPTZ DEFAULT now(),
      UNIQUE(event_id, device_hash)
    );

    -- Profiles
    CREATE TABLE IF NOT EXISTS profiles (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      session_id UUID UNIQUE NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
      event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
      display_name TEXT NOT NULL,
      headline TEXT,
      company TEXT,
      bio TEXT,
      photo_url TEXT,
      email TEXT,
      phone TEXT,
      linkedin_url TEXT,
      website_url TEXT,
      whatsapp_number TEXT,
      looking_for TEXT[],
      is_complete BOOLEAN DEFAULT false,
      created_at TIMESTAMPTZ DEFAULT now(),
      updated_at TIMESTAMPTZ DEFAULT now()
    );

    -- Swipes
    CREATE TABLE IF NOT EXISTS swipes (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
      swiper_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
      swiped_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
      action TEXT NOT NULL CHECK (action IN ('connect', 'skip')),
      created_at TIMESTAMPTZ DEFAULT now(),
      UNIQUE(swiper_id, swiped_id)
    );

    -- Matches
    CREATE TABLE IF NOT EXISTS matches (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
      profile_a_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
      profile_b_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
      created_at TIMESTAMPTZ DEFAULT now(),
      UNIQUE(profile_a_id, profile_b_id)
    );

    -- Indexes for performance
    CREATE INDEX IF NOT EXISTS idx_sessions_event_id ON sessions(event_id);
    CREATE INDEX IF NOT EXISTS idx_sessions_token ON sessions(token);
    CREATE INDEX IF NOT EXISTS idx_profiles_event_id ON profiles(event_id);
    CREATE INDEX IF NOT EXISTS idx_profiles_session_id ON profiles(session_id);
    CREATE INDEX IF NOT EXISTS idx_swipes_swiper_id ON swipes(swiper_id);
    CREATE INDEX IF NOT EXISTS idx_swipes_swiped_id ON swipes(swiped_id);
    CREATE INDEX IF NOT EXISTS idx_swipes_event_id ON swipes(event_id);
    CREATE INDEX IF NOT EXISTS idx_matches_event_id ON matches(event_id);
    CREATE INDEX IF NOT EXISTS idx_matches_profiles ON matches(profile_a_id, profile_b_id);
  `)
  console.log('Tables created')

  // Seed the Argentina event
  console.log('\n--- Seeding Argentina event ---')
  const { rows } = await client.query(`
    INSERT INTO events (slug, name, access_code, description, location, starts_at, ends_at, is_active)
    VALUES (
      'argentina-2026',
      'Linker Argentina 2026',
      'ARG26',
      'Evento de networking profesional en Argentina',
      'Buenos Aires, Argentina',
      '2026-03-26T09:00:00-03:00',
      '2026-03-26T22:00:00-03:00',
      true
    )
    ON CONFLICT (slug) DO UPDATE SET
      name = EXCLUDED.name,
      is_active = EXCLUDED.is_active
    RETURNING id, slug, name;
  `)
  console.log('Event created:', rows[0])

  console.log('\n--- Done! ---')
  console.log('Add these to your .env.local:')
  console.log('NEXT_PUBLIC_EVENT_SLUG=argentina-2026')

  await client.end()
}

setup().catch(e => {
  console.error('Error:', e.message)
  process.exit(1)
})
