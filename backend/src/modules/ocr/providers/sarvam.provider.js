const axios = require('axios');
const FormData = require('form-data');

class SarvamProvider {
  static async extractText(fileBuffer, mimeType = 'image/jpeg') {
    const apiKey = process.env.SARVAM_API_KEY;
    if (!apiKey) {
      throw new Error("SARVAM_API_KEY is missing in environment variables");
    }

    try {
      // Sarvam Document Digitisation API integration payload setup
      const form = new FormData();
      form.append('file', fileBuffer, { filename: 'admit-card.jpg', contentType: mimeType });
      form.append('language', 'en-IN'); // Can be configured dynamically for regional exams

      const response = await axios.post('https://api.sarvam.ai/document-intelligence', form, {
        headers: {
          ...form.getHeaders(),
          'api-subscription-key': apiKey
        }
      });

      // Returns the structured text extracted by Sarvam Vision model
      return response.data.extracted_text || JSON.stringify(response.data);
    } catch (error) {
      console.error('Sarvam API Error:', error.response?.data || error.message);
      throw new Error('Failed to parse document via Sarvam AI production pipeline');
    }
  }
}

module.exports = SarvamProvider;