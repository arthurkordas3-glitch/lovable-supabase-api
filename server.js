require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { createClient } = require('@supabase/supabase-js');

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 3000;

// Initialize Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

// Middleware
app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',
  credentials: true
}));
app.use(express.json());

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'API is running', timestamp: new Date().toISOString() });
});

// Get all records from a table
app.get('/api/:table', async (req, res) => {
  try {
    const { table } = req.params;
    const { data, error } = await supabase
      .from(table)
      .select('*');

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get a single record by ID
app.get('/api/:table/:id', async (req, res) => {
  try {
    const { table, id } = req.params;
    const { data, error } = await supabase
      .from(table)
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Create a new record
app.post('/api/:table', async (req, res) => {
  try {
    const { table } = req.params;
    const { data, error } = await supabase
      .from(table)
      .insert([req.body])
      .select();

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    res.status(201).json({ success: true, data });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update a record
app.put('/api/:table/:id', async (req, res) => {
  try {
    const { table, id } = req.params;
    const { data, error } = await supabase
      .from(table)
      .update(req.body)
      .eq('id', id)
      .select();

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete a record
app.delete('/api/:table/:id', async (req, res) => {
  try {
    const { table, id } = req.params;
    const { data, error } = await supabase
      .from(table)
      .delete()
      .eq('id', id)
      .select();

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    res.json({ success: true, message: 'Record deleted', data });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Internal Server Error' });
});

// Start server
app.listen(PORT, () => {
  console.log(`✅ Server running on http://localhost:${PORT}`);
  console.log(`📝 Supabase connected: ${process.env.SUPABASE_URL}`);
});