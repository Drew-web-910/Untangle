// background.js
// Service worker: handles messages from content.js, calls Hugging Face's
// Inference API (running Meta's Llama model) to simplify or verify
// flagged sentences.

const HF_ENDPOINT = 'https://router.huggingface.co/v1/chat/completions';
const HF_MODEL = 'meta-llama/Llama-3.2-3B-Instruct:featherless-ai';

async function callHF(systemPrompt, userContent, maxTokens) {
  const { hfApiKey } = await chrome.storage.local.get(['hfApiKey']);
  if (!hfApiKey) {
    return { error: 'No API key set. Open Untangle options to add one.' };
  }

  const response = await fetch(HF_ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${hfApiKey}`,
    },
    body: JSON.stringify({
      model: HF_MODEL,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userContent },
      ],
      temperature: 0.3,
      max_tokens: maxTokens,
    }),
  });

  if (!response.ok) {
    const errText = await response.text().catch(() => '');
    return { error: `Hugging Face API error (${response.status}): ${errText.slice(0, 200)}` };
  }

  const data = await response.json();
  const content = data?.choices?.[0]?.message?.content?.trim();
  if (!content) {
    return { error: 'No response returned.' };
  }
  return { content };
}

async function simplifySentence(sentence) {
  const result = await callHF(
    'You rewrite a single sentence in plain, simple language. ' +
      'Keep the same meaning. Do not add commentary, quotes, or ' +
      'explanations — respond with only the rewritten sentence.',
    sentence,
    150
  );
  if (result.error) return result;
  return { rewrite: result.content };
}

async function verifySentence(sentence) {
  const result = await callHF(
    'A tool flagged this sentence as hard to read. Judge independently: ' +
      'is it genuinely complex/dense, or is it actually simple? Respond ' +
      'in one short sentence, starting with either "Genuinely complex:" ' +
      'or "Actually fairly simple:", followed by a brief reason.',
    sentence,
    80
  );
  if (result.error) return result;
  return { verdict: result.content };
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message?.type === 'UNTANGLE_SIMPLIFY') {
    simplifySentence(message.sentence)
      .then((result) => sendResponse(result))
      .catch((err) => sendResponse({ error: String(err) }));
    return true; // keep the message channel open for the async response
  }

  if (message?.type === 'UNTANGLE_VERIFY') {
    verifySentence(message.sentence)
      .then((result) => sendResponse(result))
      .catch((err) => sendResponse({ error: String(err) }));
    return true;
  }

  if (message?.type === 'UNTANGLE_STATS') {
    return false;
  }

  return false;
});