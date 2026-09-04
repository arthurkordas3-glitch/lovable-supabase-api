import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { createClient } from '@supabase/supabase-js';

const app = express();
const PORT = Number(process.env.PORT || 3000);
const SUPABASE_URL = process.env.SUPABASE_URL?.trim();
const SUPABASE_KEY = (
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.SUPABASE_PUBLISHABLE_KEY ||
  process.env.SUPABASE_ANON_KEY
)?.trim();

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('❌ Supabase credentials missing. Set SUPABASE_URL and a server-side key in .env.');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',
  credentials: true
}));
app.use(express.json());

app.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    service: 'ALCHARMY Supabase API',
    supabase_configured: true,
    timestamp: new Date().toISOString()
  });
});

app.get('/api/:table', async (req, res) => {
  try {
    const { table } = req.params;
    const { data, error } = await supabase.from(table).select('*');
    if (error) return res.status(400).json({ error: error.message });
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : 'Internal error' });
  }
});

app.get('/api/:table/:id', async (req, res) => {
  try {
    const { table, id } = req.params;
    const { data, error } = await supabase.from(table).select('*').eq('id', id).single();
    if (error) return res.status(400).json({ error: error.message });
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : 'Internal error' });
  }
});

app.post('/api/:table', async (req, res) => {
  try {
    const { table } = req.params;
    const { data, error } = await supabase.from(table).insert([req.body]).select();
    if (error) return res.status(400).json({ error: error.message });
    res.status(201).json({ success: true, data });
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : 'Internal error' });
  }
});

app.put('/api/:table/:id', async (req, res) => {
  try {
    const { table, id } = req.params;
    const { data, error } = await supabase.from(table).update(req.body).eq('id', id).select();
    if (error) return res.status(400).json({ error: error.message });
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : 'Internal error' });
  }
});

app.delete('/api/:table/:id', async (req, res) => {
  try {
    const { table, id } = req.params;
    const { data, error } = await supabase.from(table).delete().eq('id', id).select();
    if (error) return res.status(400).json({ error: error.message });
    res.json({ success: true, message: 'Record deleted', data });
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : 'Internal error' });
  }
});

app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ error: 'Internal Server Error' });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ ALCHARMY API listening on 0.0.0.0:${PORT}`);
  console.log(`✅ Supabase configured: ${SUPABASE_URL}`);
});
