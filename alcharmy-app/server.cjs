const express = require('express');
const { GoogleGenAI } = require('@google/genai');

const app = express();
const PORT = 3000;

app.use(express.json());

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });

let catState = {
  name: "Alby",
  mood: "curious",
  hunger: 50,
  energy: 80,
  happiness: 70
};

app.use((req, res, next) => {
  console.log(`[INCOMING REQUEST] ${req.method}${req.url}`);
  next();
});

app.get('/', (req, res) => {
  res.send('Alcharmy Cat Server is online!');
});

app.post('/webhook', (req, res) => {
  console.log('[WEBHOOK RECEIVED]', JSON.stringify(req.body));

  return res.status(200).json({
    received: true,
    service: 'alcharmy',
    webhook: 'ok'
  });
});

app.get('/api/cat/status', (req, res) => {
  res.json({ success: true, cat: catState });
});

app.post('/api/cat/interact', async (req, res) => {
  const { action, message } = req.body;
  console.log(`Cat Action Received -> Action: ${action}, Message:${message}`);

  let actionContext = "";
  if (action === 'feed') {
    catState.hunger = Math.min(100, catState.hunger + 25);
    actionContext = "The user fed you. Purr happily.";
  } else if (action === 'play') {
    catState.energy = Math.max(0, catState.energy - 15);
    actionContext = "The user is playing with you. Act playful!";
  } else {
    actionContext = `The user says: "${message || 'Meow?'}". Respond as a digital cat living in a phone terminal.`;
  }

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3.6-flash',
      contents: `You are ${catState.name}, a digital cat. Stats: Hunger ${catState.hunger}, Energy ${catState.energy}. Context: ${actionContext}`,
    });

    return res.json({ success: true, cat: catState, reply: response.text });
  } catch (error) {
    console.error('Gemini Error:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
});

app.listen(PORT, '127.0.0.1', () => {
  console.log(`>>> Alcharmy Cat Server actively listening on http://127.0.0.1:${PORT}`);
});
