// Image processing and fallback cascade

const OCRFactory = require('./ocr.provider');
const SarvamLLMProvider = require('./providers/sarvam-llm.provider');

class OCRService {
  static async processDocument(fileBuffer, mimeType) {
    // 1. Extract raw text using whichever base OCR provider is active (Tesseract or Sarvam Vision)
    const rawText = await OCRFactory.extract(fileBuffer, mimeType);

    // 🔍 DEBUG: Print the exact raw text Tesseract extracted to your terminal
    console.log('--------------------------------------------------');
    console.log('📝 RAW TESSERACT OCR OUTPUT:');
    console.log(rawText);
    console.log('--------------------------------------------------');

    // 2. Send the raw text to Sarvam LLM to get structured, well-formatted JSON
    const structuredData = await SarvamLLMProvider.parseAdmitCardText(rawText);

    return {
      success: true,
      extractedData: structuredData,
      rawTextSnippet: rawText.substring(0, 200) + '...'
    };
  }
}

module.exports = OCRService;