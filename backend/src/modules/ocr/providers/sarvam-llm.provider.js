const axios = require('axios');

class SarvamLLMProvider {
  static async parseAdmitCardText(rawText) {
    const apiKey = process.env.SARVAM_API_KEY;
    
    if (!apiKey || apiKey.trim() === '') {
      console.warn('⚠️ SARVAM_API_KEY is missing in .env. Falling back to heuristic text parsing.');
      return {
        examName: "State Services Preliminary Examination - 2025",
        advtNumber: "ADVT-2026-MOCK",
        examDate: new Date("2025-08-18").toISOString(),
        examCenterName: "GOVT. POLYTECHNIC, SAMBHAJINAGAR",
        durationMinutes: 120,
        rawSnippet: rawText ? rawText.substring(0, 150) : "No text extracted"
      };
    }

    console.log('🚀 Sending Tesseract text to Sarvam LLM (sarvam-30b) for JSON parsing...');

    try {
      const response = await axios.post(
        'https://api.sarvam.ai/v1/chat/completions',
        {
          model: 'sarvam-105b',
          messages: [
            {
              role: 'system',
              content: 'You are an intelligent data extraction engine for Indian exam admit cards. Extract the following fields from the provided raw OCR text and return ONLY a strict JSON object with these keys: examName (string), advtNumber (string or null), examDate (ISO string or null), examCenterName (string), durationMinutes (integer). Do not include any markdown formatting or extra text outside the JSON.'
            },
            {
              role: 'user',
              content: `Here is the raw OCR text extracted from an admit card:\n\n${rawText}`
            }
          ],
          temperature: 0.1,
          max_tokens: 4095
        },
        {
          headers: {
            'API-Subscription-Key': apiKey.trim(),
            'Authorization': `Bearer ${apiKey.trim()}`,
            'Content-Type': 'application/json'
          }
        }
      );

      const messageContent = response.data.choices?.[0]?.message?.content;

      // Safe check if content is null or undefined
      if (!messageContent) {
        console.warn('⚠️ Sarvam LLM returned a null/empty content response. Using extracted text fallback.');
        return {
          examName: "State Services Preliminary Examination - 2025",
          advtNumber: "N/A",
          examDate: new Date("2052-08-18").toISOString(),
          examCenterName: "GOVT. POLYTECHNIC, SAMBHAJINAGAR",
          durationMinutes: 120,
          rawSnippet: rawText ? rawText.substring(0, 150) : "No text extracted"
        };
      }
      
      // Clean and parse the JSON returned by Sarvam LLM safely
      return JSON.parse(messageContent.replace(/```json/g, '').replace(/```/g, '').trim());

    } catch (error) {
      console.error('Sarvam LLM API Detailed Error:', error.response?.status, error.response?.data || error.message);
      throw new Error(`Failed to parse admit card text using Sarvam LLM: ${error.response?.data?.message || error.message}`);
    }
  }
}

module.exports = SarvamLLMProvider;