const catchAsync = require('../utils/catchAsync');
const ApiError = require('../utils/ApiError');
const Groq = require('groq-sdk');

let groqClient = null;
const getGroqClient = () => {
  if (!process.env.GROQ_API_KEY) return null;
  if (!groqClient) {
    groqClient = new Groq({ apiKey: process.env.GROQ_API_KEY });
  }
  return groqClient;
};

exports.chat = catchAsync(async (req, res) => {
  const { messages } = req.body;
  
  if (!messages || !Array.isArray(messages)) {
    throw new ApiError(400, 'Messages array is required.');
  }

  const groq = getGroqClient();
  if (!groq) {
    throw new ApiError(500, 'GROQ_API_KEY is not configured.');
  }

  const systemPrompt = {
    role: 'system',
    content: `You are the AI Assistant for a Society Maintenance Tracker. 
Your goal is to help residents solve their problems. Be concise and polite.
If the problem is simple (e.g. "how do I pay maintenance?"), answer it.
If the problem requires physical repair (e.g. "my sink is leaking", "no electricity"), tell them you cannot fix it physically and they should raise a complaint using the button below.

You MUST always output a raw JSON object with exactly two keys:
1. "reply": A string containing your response to the user.
2. "summary": A short 1-2 sentence summary of their problem (e.g. "Sink is leaking in kitchen") ONLY IF they need to raise a complaint. If they do NOT need to raise a complaint (e.g. you answered their question), set "summary" to null.

DO NOT output anything outside the JSON object.`
  };

  try {
    const response = await groq.chat.completions.create({
      messages: [systemPrompt, ...messages.map(m => ({ role: m.role, content: m.content }))],
      model: 'llama-3.3-70b-versatile',
      temperature: 0.5,
      response_format: { type: 'json_object' }
    });

    const resultText = response.choices[0]?.message?.content || '{}';
    const resultJson = JSON.parse(resultText);

    res.status(200).json({
      success: true,
      data: resultJson
    });
  } catch (error) {
    console.error('Groq AI Chat Error:', error);
    throw new ApiError(500, 'Failed to generate AI response.');
  }
});
