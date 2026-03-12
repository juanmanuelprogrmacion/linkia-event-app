import pg from 'pg'
const { Client } = pg

const client = new Client({
  connectionString: 'postgresql://postgres.wzorqpwfqrwritypyrvy:GQY3nGkJfVzMcfo5@aws-1-us-east-1.pooler.supabase.com:6543/postgres',
  ssl: { rejectUnauthorized: false },
})

const testProfiles = [
  {
    display_name: 'María García',
    headline: 'CEO en TechBA',
    company: 'TechBA',
    bio: 'Emprendedora serial, apasionada por la innovación en LATAM.',
    whatsapp_number: '5491155551234',
    looking_for: ['Invertir', 'Networking', 'Partners'],
    linkedin_url: 'https://linkedin.com/in/mariagarcia',
  },
  {
    display_name: 'Carlos Rodríguez',
    headline: 'CTO en Fintech Solutions',
    company: 'Fintech Solutions',
    bio: 'Ingeniero de software con 10 años de experiencia en fintech y blockchain.',
    whatsapp_number: '5491155552345',
    looking_for: ['Contratar', 'Networking', 'Co-founder'],
    linkedin_url: 'https://linkedin.com/in/carlosrodriguez',
  },
  {
    display_name: 'Ana Martínez',
    headline: 'Directora de Marketing en Globant',
    company: 'Globant',
    bio: 'Especialista en growth marketing y estrategia digital para startups.',
    whatsapp_number: '5491155553456',
    looking_for: ['Networking', 'Mentoría', 'Colaborar'],
    linkedin_url: 'https://linkedin.com/in/anamartinez',
  },
  {
    display_name: 'Javier López',
    headline: 'Inversor Ángel',
    company: 'NXTP Ventures',
    bio: 'Busco startups early-stage con potencial de impacto regional.',
    whatsapp_number: '5491155554567',
    looking_for: ['Invertir', 'Networking'],
    linkedin_url: 'https://linkedin.com/in/javierlopez',
  },
  {
    display_name: 'Lucía Fernández',
    headline: 'Diseñadora UX Senior',
    company: 'MercadoLibre',
    bio: 'Diseño experiencias digitales centradas en el usuario. Mentora en Girls Who Code.',
    whatsapp_number: '5491155555678',
    looking_for: ['Busco empleo', 'Networking', 'Mentoría'],
    linkedin_url: 'https://linkedin.com/in/luciafernandez',
  },
  {
    display_name: 'Diego Morales',
    headline: 'Fundador de DataAR',
    company: 'DataAR',
    bio: 'Construyendo soluciones de datos para empresas latinoamericanas.',
    whatsapp_number: '5491155556789',
    looking_for: ['Co-founder', 'Invertir', 'Partners'],
  },
  {
    display_name: 'Valentina Torres',
    headline: 'Product Manager en Rappi',
    company: 'Rappi',
    bio: 'PM con experiencia en productos B2C de alto tráfico.',
    whatsapp_number: '5491155557890',
    looking_for: ['Networking', 'Colaborar'],
    linkedin_url: 'https://linkedin.com/in/valentinatorres',
  },
  {
    display_name: 'Mateo Silva',
    headline: 'DevOps Lead',
    company: 'Auth0',
    bio: 'Infraestructura cloud, kubernetes y automatización.',
    whatsapp_number: '5491155558901',
    looking_for: ['Contratar', 'Networking'],
  },
]

async function seed() {
  await client.connect()
  console.log('Connected')

  // Get event ID
  const { rows: events } = await client.query(
    "SELECT id FROM events WHERE slug = 'argentina-2026'"
  )
  const eventId = events[0].id
  console.log('Event ID:', eventId)

  for (const profile of testProfiles) {
    // Create a fake session for each test profile
    const token = `test-${crypto.randomUUID()}`
    const deviceHash = `test-device-${crypto.randomUUID()}`

    const { rows: sessions } = await client.query(
      `INSERT INTO sessions (event_id, device_hash, token)
       VALUES ($1, $2, $3)
       RETURNING id`,
      [eventId, deviceHash, token]
    )

    const sessionId = sessions[0].id

    await client.query(
      `INSERT INTO profiles (session_id, event_id, display_name, headline, company, bio, whatsapp_number, looking_for, linkedin_url, is_complete)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, true)`,
      [
        sessionId,
        eventId,
        profile.display_name,
        profile.headline,
        profile.company || null,
        profile.bio || null,
        profile.whatsapp_number,
        profile.looking_for || null,
        profile.linkedin_url || null,
      ]
    )

    console.log(`Created: ${profile.display_name}`)
  }

  console.log(`\nSeeded ${testProfiles.length} test profiles`)
  await client.end()
}

seed().catch((e) => {
  console.error('Error:', e.message)
  process.exit(1)
})
