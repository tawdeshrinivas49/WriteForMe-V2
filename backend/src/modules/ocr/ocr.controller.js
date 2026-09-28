const OCRService = require('./ocr.service');

exports.processAdmitCard = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No admit card file uploaded' });
    }

    // Process document using the modular OCR service & LLM pipeline
    const parsedDetails = await OCRService.processDocument(req.file.buffer, req.file.mimetype);

    res.status(200).json({
      message: `Admit card successfully processed using [${process.env.OCR_PROVIDER || 'tesseract'}] engine`,
      data: parsedDetails
    });
  } catch (error) {
    console.error('OCR Controller Error:', error);
    res.status(500).json({ error: error.message || 'Internal server error during OCR' });
  }
};