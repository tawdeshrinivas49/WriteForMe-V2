const TesseractProvider = require('./providers/tesseract.provider');
const SarvamProvider = require('./providers/sarvam.provider');

class OCRFactory {
  static async extract(fileBuffer, mimeType) {
    const provider = process.env.OCR_PROVIDER || 'tesseract';

    if (provider === 'sarvam') {
      return await SarvamProvider.extractText(fileBuffer, mimeType);
    } else {
      // Default fallback or explicit prototype choice
      return await TesseractProvider.extractText(fileBuffer);
    }
  }
}

module.exports = OCRFactory;