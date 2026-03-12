import pg from 'pg'
const { Client } = pg

const client = new Client({
  connectionString: 'postgresql://postgres.wzorqpwfqrwritypyrvy:GQY3nGkJfVzMcfo5@aws-1-us-east-1.pooler.supabase.com:6543/postgres',
  ssl: { rejectUnauthorized: false },
})

async function mockMatches() {
  await client.connect()
  console.log('Connected')

  // Get event
  const { rows: events } = await client.query(
    "SELECT id FROM events WHERE slug = 'argentina-2026'"
  )
  const eventId = events[0].id

  // Get all profiles in this event
  const { rows: profiles } = await client.query(
    'SELECT id, display_name FROM profiles WHERE event_id = $1',
    [eventId]
  )

  console.log(`Found ${profiles.length} profiles`)

  // Make every profile swipe "connect" on every other profile
  let inserted = 0
  for (const swiper of profiles) {
    for (const swiped of profiles) {
      if (swiper.id === swiped.id) continue

      const { rowCount } = await client.query(
        `INSERT INTO swipes (event_id, swiper_id, swiped_id, action)
         VALUES ($1, $2, $3, 'connect')
         ON CONFLICT DO NOTHING`,
        [eventId, swiper.id, swiped.id]
      )
      if (rowCount > 0) inserted++
    }
  }

  console.log(`Inserted ${inserted} connect swipes`)

  // Now create matches for all mutual connects
  let matches = 0
  for (let i = 0; i < profiles.length; i++) {
    for (let j = i + 1; j < profiles.length; j++) {
      const profileAId = profiles[i].id < profiles[j].id ? profiles[i].id : profiles[j].id
      const profileBId = profiles[i].id < profiles[j].id ? profiles[j].id : profiles[i].id

      const { rowCount } = await client.query(
        `INSERT INTO matches (event_id, profile_a_id, profile_b_id)
         VALUES ($1, $2, $3)
         ON CONFLICT DO NOTHING`,
        [eventId, profileAId, profileBId]
      )
      if (rowCount > 0) matches++
    }
  }

  console.log(`Created ${matches} matches`)
  console.log('\nDone! Every right swipe will now result in a match.')

  await client.end()
}

mockMatches().catch((e) => {
  console.error('Error:', e.message)
  process.exit(1)
})
