import express from 'express';
import { createClient } from '@supabase/supabase-js';

const router = express.Router();
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

router.post('/', async (req, res) => {
  try {
    const { name, email, role } = req.body;
    if (!name || !email) {
      return res.status(400).json({ error: 'Name and email are required fields.' });
    }

    const { data, error } = await supabase
      .from('people')
      .insert([{ name, email, role: role || 'member' }])
      .select();

    if (error) throw error;

    return res.status(201).json({
      message: 'Person created successfully',
      data: data[0]
    });
  } catch (err) {
    console.error('Error creating person:', err.message);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
});

router.get('/:id', async (req, res) => {
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

export default router;
