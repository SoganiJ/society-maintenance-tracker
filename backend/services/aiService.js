const Groq = require('groq-sdk');
const { getSettings } = require('./settingsService');

let groqClient = null;

const getGroqClient = () => {
  if (!process.env.GROQ_API_KEY) return null;
  if (!groqClient) {
    groqClient = new Groq({ apiKey: process.env.GROQ_API_KEY });
  }
  return groqClient;
};

/**
 * Uses Groq LLM (llama-3.3-70b-versatile) to provide a "meantime suggestion"
 * for the user based on their complaint title and description.
 */
const suggestMeantimeSolution = async (title, description) => {
  const groq = getGroqClient();
  if (!groq) {
    throw new Error('GROQ_API_KEY is not configured in environment variables.');
  }

  const prompt = `
You are a helpful Society Maintenance AI.
A resident just submitted a maintenance complaint. Provide a very brief (1-2 sentences max) practical suggestion on what they should do in the meantime while waiting for the maintenance team. Focus on safety and preventing further damage (e.g. "Please turn off the main water valve to prevent further flooding").

Complaint Title: "${title}"
Complaint Description: "${description}"

Output ONLY a valid JSON object with one key: "suggestion". Do not include any other text.
  `.trim();

  try {
    const response = await groq.chat.completions.create({
      messages: [{ role: 'system', content: prompt }],
      model: 'llama-3.3-70b-versatile',
      temperature: 0.3,
      response_format: { type: 'json_object' },
    });

    const resultText = response.choices[0]?.message?.content || '{}';
    const resultJson = JSON.parse(resultText);
    return resultJson.suggestion || 'The maintenance team has been notified and will look into it soon.';
  } catch (error) {
    console.error('Groq AI Error (Meantime):', error);
    return 'The maintenance team has been notified and will look into it soon.'; // Fallback
  }
};

/**
 * Admin Agent: Consults the AI with a complaint and a list of workers
 * to find the best matching worker and provide a solution summary.
 */
const consultAdminAgent = async (complaint, workers) => {
  const groq = getGroqClient();
  if (!groq) {
    throw new Error('GROQ_API_KEY is not configured in environment variables.');
  }

  const workerData = workers.map(w => ({ id: w._id, name: w.name, skills: w.skills })).filter(w => w.skills && w.skills.length > 0);

  const prompt = `
You are the Admin AI Copilot for a Society Maintenance system.
You are given a complaint and a list of available workers. 
Your job is to:
1. Summarize the issue briefly.
2. Recommend a specific action.
3. Recommend the best worker for the job based on their skills.

Complaint Category: ${complaint.category}
Complaint Priority: ${complaint.priority}
Complaint Title: "${complaint.title}"
Complaint Description: "${complaint.description}"

Available Workers:
${JSON.stringify(workerData, null, 2)}

Output ONLY a valid JSON object with the following keys:
- "summary": (String) A brief summary of the issue.
- "action": (String) The recommended action for the admin.
- "recommendedWorkerId": (String) The ID of the best matching worker from the list, or null if no one matches.
  `.trim();

  try {
    const response = await groq.chat.completions.create({
      messages: [{ role: 'system', content: prompt }],
      model: 'llama-3.3-70b-versatile',
      temperature: 0.2,
      response_format: { type: 'json_object' },
    });

    const resultText = response.choices[0]?.message?.content || '{}';
    return JSON.parse(resultText);
  } catch (error) {
    console.error('Groq AI Error (Admin Agent):', error);
    throw new Error('Failed to consult AI agent.');
  }
};

/**
 * Summarize a complaint description for the admin.
 */
const summarizeDescription = async (title, description) => {
  const groq = getGroqClient();
  if (!groq) {
    throw new Error('GROQ_API_KEY is not configured in environment variables.');
  }

  const prompt = `
You are a concise administrative assistant for a residential Society Maintenance system.
Summarize the following maintenance complaint into 2-3 clear, actionable bullet points for the admin. Focus on what happened, where, and how urgent it seems.

Complaint Title: "${title}"
Complaint Description: "${description}"

Output ONLY a valid JSON object with one key: "summary". The value should be a short, clear summary string (use bullet points with • character).
  `.trim();

  try {
    const response = await groq.chat.completions.create({
      messages: [{ role: 'system', content: prompt }],
      model: 'llama-3.3-70b-versatile',
      temperature: 0.2,
      response_format: { type: 'json_object' },
    });

    const resultText = response.choices[0]?.message?.content || '{}';
    const resultJson = JSON.parse(resultText);
    return resultJson.summary || 'Unable to generate summary.';
  } catch (error) {
    console.error('Groq AI Error (Summarize):', error);
    return 'Unable to generate summary at this time.';
  }
};

module.exports = {
  suggestMeantimeSolution,
  consultAdminAgent,
  summarizeDescription,
};
