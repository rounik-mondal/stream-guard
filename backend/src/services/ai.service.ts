// src/services/ai.service.ts

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
// We'll use 1.5 Flash, as it's fast, cheap, and perfect for moderation
const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`;


/**
 * Analyzes message content using the Gemini API for moderation.
 * @param content The chat message to analyze.
 * @returns An object { isToxic: boolean, reason: string | null }
 */

// ===============================
// GEMINI RESPONSE TYPE
// ===============================
type GeminiResponse = {
  candidates?: Array<{
    content?: {
      parts?: Array<{
        text?: string;
      }>;
    };
  }>;
};



// Basic memory cache to limit API usage on recurrent messages
const messageCache = new Map<string, { isToxic: boolean; reason: string | null }>();

export const analyzeMessage = async (content: string): Promise<{ isToxic: boolean; reason: string | null }> => {
  if (!content || content.trim().length === 0) {
    return { isToxic: false, reason: null };
  }

  const normalizedContent = content.trim().toLowerCase();

  // Check cache first
  if (messageCache.has(normalizedContent)) {
    return messageCache.get(normalizedContent)!;
  }

  // Check if the key is missing
  if (!GEMINI_API_KEY) {
    console.warn('GEMINI_API_KEY is missing. AI analysis is disabled. Allowing message.');
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
            text: `Analyze this live stream chat message. If safe, respond EXACTLY with "SAFE". If toxic (hate speech, harassment, spam, extreme profanity), respond with "TOXIC: <Category>" where <Category> is a 1-3 word reason (e.g. Hate Speech, Spam). Message: "${content}"`
          }]
        }]
      }),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      console.error(`Gemini API request failed with status ${response.status}: ${errorBody}`);
      throw new Error(`Gemini API request failed`);
    }
    const data = (await response.json()) as GeminiResponse;

    const result =
      data.candidates?.[0]?.content?.parts?.[0]?.text
        ?.trim();

    if (!result) {
      throw new Error('Empty response from Gemini API');
    }

    let analysisResult = { isToxic: false, reason: null as string | null };

    if (result.toUpperCase().startsWith('TOXIC')) {
      const parts = result.split(':');
      const reason = parts[1] ? parts[1].trim() : 'Inappropriate content';
      analysisResult = { isToxic: true, reason };
    } else if (result.toUpperCase() !== 'SAFE') {
      // Failsafe block for unexpected responses if they look concerning
      console.warn(`Unexpected AI response: ${result}`);
      // Only block if it really didn't say SAFE
      if (result.toUpperCase().includes('TOXIC') || result.toUpperCase().includes('NO')) {
          analysisResult = { isToxic: true, reason: 'Flagged by AI' };
      }
    }

    // Cache management (keep it under 1000 items)
    if (messageCache.size > 1000) {
      const keys = Array.from(messageCache.keys());
      for (let i = 0; i < 500; i++) {
        const keyToDelete = keys[i];
        if (keyToDelete !== undefined) {
          messageCache.delete(keyToDelete);
        }
      }
    }

    messageCache.set(normalizedContent, analysisResult);
    return analysisResult;

  } catch (error: any) {
    console.error('Error analyzing message with Gemini:', error.message);
    return { isToxic: true, reason: 'Message could not be analyzed by AI.' };
  }
};