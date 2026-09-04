const API_BASE_URL = 'http://127.0.0.1:3000';

async function sendCatMessage(action, message) {
  try {
    const response = await fetch(`${API_BASE_URL}/api/cat/interact`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action, message })
    });
    const data = await response.json();
    console.log("Alby's Response:", data);
  } catch (error) {
    console.error("Fetch Error:", error.message);
  }
}

// Test talking to Alby
sendCatMessage('talk', 'Hello from the Termux JavaScript test script!');
