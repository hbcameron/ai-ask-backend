// api/ask.js
import fetch from 'node-fetch';

export default async function handler(req, res) {
  // ---- Only accept POST -------------------------------------------------
  if (req.method !== 'POST') {
    return res.status(405).json({ answer: 'Method not allowed' });
  }

  // ---- Pull the query, enforce 100‑char limit -----------------------------
  const { query } = req.body || {};
  const trimmed = (query || '').trim().slice(0, 100);
  if (!trimmed) {
    return res.status(400).json({ answer: 'Empty query' });
  }

  // ---- Call OpenAI (or any LLM endpoint) -------------------------------
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
    const answer = data.choices?.[0]?.message?.content?.trim() ||
      'Sorry, I could not generate a response.';
    return res.status(200).json({ answer });
  } catch (err) {
    console.error('OpenAI error:', err);
    return res.status(500).json({ answer: 'Error contacting AI service.' });
  }
}
