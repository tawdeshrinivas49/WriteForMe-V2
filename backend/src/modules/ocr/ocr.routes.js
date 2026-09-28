const express = require('express');
const router = express.Router();
const multer = require('multer');
const ocrController = require('./ocr.controller');

// Store file temporarily in memory buffer using multer
const upload = multer({ storage: multer.memoryStorage() });

// POST /api/v1/ocr/upload-admit-card
router.post('/upload-admit-card', upload.single('admitCard'), ocrController.processAdmitCard);

module.exports = router;