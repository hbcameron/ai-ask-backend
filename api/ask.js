// api/ask.js
import fetch from 'node-fetch';

export default async function handler(req, res) {
  // --------------------------------------------------------------
  // 1️⃣  CORS – allow any origin (you can restrict this to your domain)
  // --------------------------------------------------------------
  res.setHeader('Access-Control-Allow-Origin', '*');               // <‑‑ important
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS'); // allow POST and pre‑flight
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // --------------------------------------------------------------
  // 2️⃣  Handle the pre‑flight OPTIONS request (sent by the browser)
  // --------------------------------------------------------------
  if (req.method === 'OPTIONS') {
    // No body needed – just tell the browser it’s OK
    return res.status(200).end();
  }

  // --------------------------------------------------------------
  // 3️⃣  Only accept POST
  // --------------------------------------------------------------
  if (req.method !== 'POST') {
    return res.status(405).json({ answer: 'Method not allowed' });
  }

  // --------------------------------------------------------------
  // 4️⃣  Get the query, enforce the 100‑character limit
  // --------------------------------------------------------------
  const { query } = req.body || {};
  const trimmed = (query || '').trim().slice(0, 100);
  if (!trimmed) {
    return res.status(400).json({ answer: 'Empty query' });
  }

  // --------------------------------------------------------------
  // 5️⃣  Call OpenAI (or any LLM you prefer)
  // --------------------------------------------------------------
  try {
    const openaiResp = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content:
              'You are a helpful genealogy assistant. Keep answers short (1‑2 sentences) and provide a resource link when appropriate.',
          },
          { role: 'user', content: trimmed },
        ],
        max_tokens: 150,
        temperature: 0.6,
      }),
    });

    const data = await openaiResp.json();

    // If OpenAI returned an error (e.g., quota exceeded) surface it for debugging
    if (!openaiResp.ok) {
      console.error('OpenAI error payload:', data);
      return res.status(500).json({ answer: 'Error contacting AI service.' });
    }

    const answer = data.choices?.[0]?.message?.content?.trim() ||
      'Sorry, I could not generate a response.';
    return res.status(200).json({ answer });
  } catch (err) {
    console.error('OpenAI fetch exception:', err);
    return res.status(500).json({ answer: 'Error contacting AI service.' });
  }
}
