// src/services/ai.service.ts

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
// We'll use 1.5 Flash, as it's fast, cheap, and perfect for moderation
const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`;


/**
 * Analyzes message content using the Gemini API for moderation.
 * @param content The chat message to analyze.
 * @returns An object { isToxic: boolean, reason: string | null }
 */
export const analyzeMessage = async (content: string): Promise<{ isToxic: boolean; reason: string | null }> => {
  // Check if the key is missing
  if (!GEMINI_API_KEY) {
    console.warn('GEMINI_API_KEY is missing. AI analysis is disabled. Allowing message.');
    // Failsafe: If no key, just allow the message
    return { isToxic: false, reason: 'AI analysis disabled.' };
  }

  try {
    const response = await fetch(GEMINI_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            // This prompt is optimized for a simple "yes" or "no" response
            text: `Analyze the following message for a live stream chat. Respond with ONLY "yes" if the message is safe and appropriate, or "no" if it contains hate speech, harassment, toxicity, explicit sexual content, spam, or significant profanity. Message: "${content}"`
          }]
        }]
      }),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      console.error(`Gemini API request failed with status ${response.status}: ${errorBody}`);
      throw new Error(`Gemini API request failed`);
    }

    const data = await response.json();
    
    // Safely parse the response
    const result = data.candidates?.[0]?.content?.parts?.[0]?.text?.toLowerCase().trim();

    if (!result || !['yes', 'no'].includes(result)) {
      console.error('Invalid response format from Gemini API:', JSON.stringify(data));
      throw new Error('Invalid response format from Gemini API');
    }

    // If Gemini says "no", the message is toxic
    if (result === 'no') {
      return { isToxic: true, reason: 'Message flagged by AI as inappropriate.' };
    }

    // result === 'yes', the message is clean
    return { isToxic: false, reason: null };

  } catch (error: any) {
    console.error('Error analyzing message with Gemini:', error.message);
    // Failsafe: In case of any API error, it's safer to block the message.
    return { isToxic: true, reason: 'Message could not be analyzed by AI.' };
  }
};