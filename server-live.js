import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import express from 'express';
import { createClient } from '@supabase/supabase-js';

// Fallback: manually read .env if dotenv/config missed it
const envPath = path.resolve('.env');
if (fs.existsSync(envPath)) {
  const envFile = fs.readFileSync(envPath, 'utf8');
  envFile.split('\n').forEach(line => {
    const parts = line.split('=');
    if (parts.length >= 2) {
      const key = parts[0].trim();
      const val = parts.slice(1).join('=').trim().replace(/^["']|["']$/g, '');
      if (key && val && !process.env[key]) {
        process.env[key] = val;
      }
    }
  });
}

const app = express();
app.use(express.json());

const PORT = Number(process.env.PORT || process.env.PADDLE_PORT || 3001);

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

console.log('----------------------------------------');
console.log('SUPABASE_URL:', supabaseUrl ? 'FOUND (' + supabaseUrl.substring(0, 15) + '...)' : 'MISSING ❌');
console.log('SUPABASE_ANON_KEY:', supabaseKey ? 'FOUND (' + supabaseKey.substring(0, 8) + '...)' : 'MISSING ❌');
console.log('----------------------------------------');

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Error: Supabase URL and Key must be defined in your .env file!');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Health Check Route
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', service: 'Alcharmy Live API' });
});

// Person API: Create Person (POST)
app.post('/api/people', async (req, res) => {
  try {
    const { name, email, role, organisation, position } = req.body;
    if (!name || !email) {
      return res.status(400).json({ error: 'Name and email are required fields.' });
    }

    const { data, error } = await supabase
      .from('people')
      .upsert([{ 
        name, 
        email, 
        role: role || position || 'member',
        organisation: organisation || null,
        position: position || null
      }], { onConflict: 'email' })
      .select();

    if (error) throw error;

    return res.status(201).json({
      message: 'Person created successfully',
      data: data[0]
    });
  } catch (err) {
    console.error('Error creating person:', err.message);
    return res.status(500).json({ error: err.message || 'Internal Server Error' });
  }
});

// Person API: Get Person by ID (GET)
app.get('/api/people/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { data, error } = await supabase
      .from('people')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !data) {
      return res.status(404).json({ error: 'Person not found' });
    }

    return res.status(200).json({ data });
  } catch (err) {
    console.error('Error fetching person:', err.message);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
});


// Person API: Bulk Create People (POST /api/people/bulk)
app.post('/api/people/bulk', async (req, res) => {
  try {
    const records = Array.isArray(req.body) ? req.body : req.body.people;
    if (!Array.isArray(records) || records.length === 0) {
      return res.status(400).json({ error: 'Please provide a non-empty array of people records.' });
    }

    for (const p of records) {
      if (!p.name || !p.email) {
        return res.status(400).json({ error: 'Each person record must include a name and email.' });
      }
    }

    const { data, error } = await supabase
      .from('people')
      .insert(records.map(p => ({
        name: p.name,
        email: p.email,
        role: p.role || 'member'
      })))
      .select();

    if (error) throw error;

    return res.status(201).json({
      message: `Successfully created ${data.length} people records.`,
      data
    });
  } catch (err) {
    console.error('Error in bulk create:', err.message);
    return res.status(500).json({ error: err.message || 'Internal Server Error' });
  }
});



// Person API: Get Current User / "Me" (GET /api/me)
app.get('/api/me', async (req, res) => {
  try {
    const primaryId = process.env.PRIMARY_USER_ID;
    let query = supabase.from('people').select('*');
    
    if (primaryId) {
      query = query.eq('id', primaryId);
    } else {
      query = query.eq('email', 'support@alcharmy.site');
    }

    const { data, error } = await query.single();

    if (error || !data) {
      return res.status(404).json({ error: 'Primary user profile not found' });
    }

    return res.status(200).json({ data });
  } catch (err) {
    console.error('Error fetching primary user:', err.message);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
});


app.listen(PORT, () => {
  console.log('======================================');
  console.log(' ALCHARMY LIVE API SERVER RUNNING');
  console.log('======================================');
  console.log(`Port: ${PORT}`);
  console.log('POST /api/people');
  console.log('GET  /api/people/:id');
  console.log('GET  /health');
  console.log('======================================');
});
