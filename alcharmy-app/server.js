import express from "express";

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

app.get("/", (req, res) => {
  res.json({
    service: "ALCHARMY",
    backend: "ONLINE",
    mode: "LOCAL_TEST"
  });
});

app.get("/health", (req, res) => {
  res.json({
    service: "ALCHARMY",
    status: "ONLINE",
    mode: "LOCAL_TEST"
  });
});

app.get("/api/status", (req, res) => {
  res.json({
    alcharmy: "ONLINE",
    dragon: "NOT_CONNECTED",
    payment: "NOT_CONFIGURED",
    checkout: "NOT_CONFIGURED",
    mode: "LOCAL_TEST"
  });
});

app.post("/api/cat/interact", (req, res) => {
  const { action = "talk", message = "" } = req.body ?? {};

  res.json({
    ok: true,
    action,
    message,
    service: "ALCHARMY",
    engine: "LOCAL_TEST"
  });
});

app.post("/webhook", (req, res) => {
  console.log("Webhook received:", req.body);

  res.status(200).json({
    received: true
  });
});


app.get('/ai/status', (req, res) => {
  res.json({
    ok: true,
    service: 'ALCHARMY_AI',
    status: 'ONLINE',
    mode: 'LOCAL_TEST',
    orchestrator: 'WIZ',
    backend: 'ALCHARMY',
    auth: 'SUPABASE_AUTH',
    database: 'SUPABASE',
    dragon: 'READY',
    payments: 'PAUSED',
    shopify: 'REMOVED'
  })
})

app.listen(PORT, "0.0.0.0", () => {
  console.log(`ALCHARMY backend running on port ${PORT}`);
});
