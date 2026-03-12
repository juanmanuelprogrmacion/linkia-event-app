import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'
import pg from 'pg'
const { Client } = pg

// Read env
const envFile = readFileSync('.env.local', 'utf-8')
const env = {}
for (const line of envFile.split('\n')) {
  const [key, ...rest] = line.split('=')
  if (key && rest.length) env[key.trim()] = rest.join('=').trim()
}

const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY)

const dbClient = new Client({
  connectionString: 'postgresql://postgres.wzorqpwfqrwritypyrvy:GQY3nGkJfVzMcfo5@aws-1-us-east-1.pooler.supabase.com:6543/postgres',
  ssl: { rejectUnauthorized: false },
})

const profiles = [
  { name: 'María García', file: '/tmp/profile-maria.png' },
  { name: 'Carlos Rodríguez', file: '/tmp/profile-carlos.png' },
  { name: 'Ana Martínez', file: '/tmp/profile-ana.png' },
  { name: 'Javier López', file: '/tmp/profile-javier.png' },
  { name: 'Lucía Fernández', file: '/tmp/profile-lucia.png' },
  { name: 'Diego Morales', file: '/tmp/profile-diego.png' },
  { name: 'Valentina Torres', file: '/tmp/profile-valentina.png' },
  { name: 'Mateo Silva', file: '/tmp/profile-mateo.png' },
]

async function upload() {
  await dbClient.connect()

  for (const p of profiles) {
    const fileData = readFileSync(p.file)
    const fileName = `profiles/${p.name.toLowerCase().replace(/\s+/g, '-').replace(/[áéíóú]/g, c => ({ á:'a',é:'e',í:'i',ó:'o',ú:'u' })[c])}.png`

    const { error } = await supabase.storage
      .from('photos')
      .upload(fileName, fileData, { contentType: 'image/png', upsert: true })

    if (error) {
      console.error(`Upload failed for ${p.name}:`, error.message)
      continue
    }

    const { data: urlData } = supabase.storage.from('photos').getPublicUrl(fileName)

    await dbClient.query(
      'UPDATE profiles SET photo_url = $1 WHERE display_name = $2',
      [urlData.publicUrl, p.name]
    )

    console.log(`Uploaded: ${p.name} → ${urlData.publicUrl}`)
  }

  await dbClient.end()
  console.log('\nAll photos uploaded and profiles updated')
}

upload().catch(e => { console.error(e.message); process.exit(1) })
