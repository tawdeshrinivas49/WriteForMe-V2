const Tesseract = require('tesseract.js');

class TesseractProvider {
  static async extractText(fileBuffer) {
    try {
      const { data: { text } } = await Tesseract.recognize(
        fileBuffer,
        'eng',
        { logger: m => {} } // Suppress logs
      );
      return text;
    } catch (error) {
      throw new Error(`Tesseract OCR failed: ${error.message}`);
    }
  }
}

module.exports = TesseractProvider;