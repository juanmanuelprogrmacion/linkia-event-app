import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'

// Read .env.local manually
const envFile = readFileSync('.env.local', 'utf-8')
const env = {}
for (const line of envFile.split('\n')) {
  const [key, ...rest] = line.split('=')
  if (key && rest.length) env[key.trim()] = rest.join('=').trim()
}

const supabase = createClient(
  env.NEXT_PUBLIC_SUPABASE_URL,
  env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

const event = {
  slug: 'argentina-2026',
  name: 'Linker Argentina 2026',
  access_code: 'ARG26',
  starts_at: '2026-03-26T09:00:00-03:00',
  ends_at: '2026-03-26T22:00:00-03:00',
  is_active: true,
}

async function seed() {
  console.log('Creating event:', event.name)

  const { data, error } = await supabase
    .from('events')
    .upsert(event, { onConflict: 'slug' })
    .select()

  if (error) {
    console.error('Error inserting event:', error.message)
    console.log('\nIf RLS is blocking, run this SQL in your Supabase SQL Editor:')
    console.log(`
INSERT INTO events (slug, name, access_code, starts_at, ends_at, is_active)
VALUES ('${event.slug}', '${event.name}', '${event.access_code}', '${event.starts_at}', '${event.ends_at}', true)
ON CONFLICT (slug) DO NOTHING;
    `)
    process.exit(1)
  }

  console.log('Event created:', data)
  console.log('\nAdd this to your .env.local:')
  console.log('NEXT_PUBLIC_EVENT_SLUG=argentina-2026')
}

seed()
