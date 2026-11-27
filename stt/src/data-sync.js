const DEFAULT_API_URL = 'http://127.0.0.1:8000';

export async function sendUtterance(lectureId, utterance, apiUrl = DEFAULT_API_URL) {
  const response = await fetch(
    `${apiUrl}/lectures/${encodeURIComponent(lectureId)}/stt`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: utterance.text, timestamp: utterance.start }),
    }
  );

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`STT API ${response.status}: ${error}`);
  }

  return response.json();
}

export async function sendUtterances(lectureId, utterances, apiUrl = DEFAULT_API_URL) {
  const results = [];
  for (const utterance of utterances) {
    try {
      const sent = await sendUtterance(lectureId, utterance, apiUrl);
      results.push({ utterance, ok: true, sent });
    } catch (error) {
      results.push({ utterance, ok: false, error: error.message });
    }
  }
  return results;
}
