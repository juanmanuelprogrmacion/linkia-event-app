import pg from 'pg'
const { Client } = pg

const client = new Client({
  connectionString: 'postgresql://postgres.wzorqpwfqrwritypyrvy:GQY3nGkJfVzMcfo5@aws-1-us-east-1.pooler.supabase.com:6543/postgres',
  ssl: { rejectUnauthorized: false },
})

const TEST_TOKEN = 'test-dev-token-linker-2026'

async function setup() {
  await client.connect()

  // Get event
  const { rows: events } = await client.query(
    "SELECT id FROM events WHERE slug = 'argentina-2026'"
  )
  const eventId = events[0].id

  // Check if test session already exists
  const { rows: existing } = await client.query(
    'SELECT s.id as session_id, p.id as profile_id FROM sessions s LEFT JOIN profiles p ON p.session_id = s.id WHERE s.token = $1',
    [TEST_TOKEN]
  )

  let sessionId, profileId

  if (existing.length > 0 && existing[0].profile_id) {
    sessionId = existing[0].session_id
    profileId = existing[0].profile_id
    console.log('Test user already exists, updating...')

    await client.query(
      `UPDATE profiles SET
        display_name = 'Test User',
        headline = 'QA Tester en Linker',
        company = 'Linker',
        bio = 'Cuenta de prueba para testing. No es un usuario real.',
        whatsapp_number = '5491100000000',
        looking_for = $1,
        photo_url = 'https://wzorqpwfqrwritypyrvy.supabase.co/storage/v1/object/public/photos/profiles/maria-garcia.png',
        is_complete = true,
        updated_at = NOW()
      WHERE id = $2`,
      [['Networking', 'Colaborar'], profileId]
    )
  } else {
    // Create session
    if (existing.length > 0) {
      sessionId = existing[0].session_id
    } else {
      const { rows: sessions } = await client.query(
        `INSERT INTO sessions (event_id, device_hash, token)
         VALUES ($1, 'test-device-permanent', $2)
         RETURNING id`,
        [eventId, TEST_TOKEN]
      )
      sessionId = sessions[0].id
    }

    // Create profile
    const { rows: profiles } = await client.query(
      `INSERT INTO profiles (session_id, event_id, display_name, headline, company, bio, whatsapp_number, looking_for, photo_url, is_complete)
       VALUES ($1, $2, 'Test User', 'QA Tester en Linker', 'Linker', 'Cuenta de prueba para testing.', '5491100000000', $3, 'https://wzorqpwfqrwritypyrvy.supabase.co/storage/v1/object/public/photos/profiles/maria-garcia.png', true)
       RETURNING id`,
      [sessionId, eventId, ['Networking', 'Colaborar']]
    )
    profileId = profiles[0].id
  }

  // Now make all OTHER seed profiles swipe "connect" on the test user
  const { rows: otherProfiles } = await client.query(
    'SELECT id, display_name FROM profiles WHERE event_id = $1 AND id != $2',
    [eventId, profileId]
  )

  let swipes = 0
  for (const other of otherProfiles) {
    const { rowCount } = await client.query(
      `INSERT INTO swipes (event_id, swiper_id, swiped_id, action)
       VALUES ($1, $2, $3, 'connect')
       ON CONFLICT DO NOTHING`,
      [eventId, other.id, profileId]
    )
    if (rowCount > 0) swipes++
  }

  console.log(`\n✅ Test user ready!`)
  console.log(`   Profile: Test User (${profileId})`)
  console.log(`   ${swipes} seed profiles pre-swiped "connect" on you`)
  console.log(`   → Every right swipe = instant match\n`)
  console.log(`🔑 Token: ${TEST_TOKEN}`)
  console.log(`\n📋 To use: open the app and run this in the browser console:`)
  console.log(`   localStorage.setItem('linker_session', '${TEST_TOKEN}')`)
  console.log(`   Then refresh the page — you'll be logged in as Test User.\n`)

  await client.end()
}

setup().catch((e) => {
  console.error('Error:', e.message)
  process.exit(1)
})
