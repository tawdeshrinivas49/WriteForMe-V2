const PaymentService = require('./payment.service');

exports.createEscrowOrder = async (req, res) => {
  try {
    const { requestId, adminHonorariumOverride } = req.body;
    if (!requestId) {
      return res.status(400).json({ success: false, error: 'requestId required' });
    }
    const orderData = await PaymentService.createEscrowOrder(requestId, adminHonorariumOverride);
    res.status(200).json({ success: true, data: orderData });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

exports.verifyEscrow = async (req, res) => {
  try {
    const { requestId, razorpayOrderId, razorpayPaymentId, razorpaySignature } = req.body;
    if (!requestId || !razorpayOrderId) {
      return res.status(400).json({ success: false, error: 'Missing required fields' });
    }
    const result = await PaymentService.verifyAndLockEscrow({
      requestId,
      razorpayOrderId,
      razorpayPaymentId,
      razorpaySignature,
    });
    res.status(200).json({ success: true, data: result });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

exports.releasePayout = async (req, res) => {
  try {
    const { requestId } = req.body;
    if (!requestId) return res.status(400).json({ success: false, error: 'requestId required' });
    const result = await PaymentService.releaseEscrowPayout(requestId);
    res.status(200).json({ success: true, data: result });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

exports.refundEscrow = async (req, res) => {
  try {
    const { requestId } = req.body;
    if (!requestId) return res.status(400).json({ success: false, error: 'requestId required' });
    const result = await PaymentService.refundEscrow(requestId);
    res.status(200).json({ success: true, data: result });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

exports.retryPayout = async (req, res) => {
  try {
    const { requestId } = req.body;
    if (!requestId) return res.status(400).json({ success: false, error: 'requestId required' });
    const result = await PaymentService.retryFailedPayout(requestId);
    res.status(200).json({ success: true, data: result });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

exports.checkTimeouts = async (req, res) => {
  try {
    const results = await PaymentService.checkTimeoutRefunds();
    res.status(200).json({ success: true, data: results });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};