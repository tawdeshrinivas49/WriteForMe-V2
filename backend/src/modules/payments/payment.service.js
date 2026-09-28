const Razorpay = require('razorpay');
const crypto = require('crypto');
const prisma = require('../../config/database');

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

const DEFAULT_HONORARIUM = parseInt(process.env.DEFAULT_HONORARIUM_INR || '500', 10);
const DEFAULT_TRANSPORT = parseInt(process.env.DEFAULT_TRANSPORT_ALLOWANCE_INR || '250', 10);

class PaymentService {
  /**
   * 1. Create Razorpay order for escrow, store transaction as PENDING
   */
  static async createEscrowOrder(requestId, adminOverrideHonorarium = null) {
    const request = await prisma.examRequest.findUnique({
      where: { id: requestId },
      include: {
        candidate: { include: { user: true } },
        masterExam: true,
      },
    });
    if (!request) throw new Error('Request not found');

    let settings = await prisma.systemSetting.findUnique({ where: { id: 'GLOBAL' } });
    const honorarium = adminOverrideHonorarium
      || request.masterExam?.honorariumAmount
      || settings?.defaultHonorariumINR
      || DEFAULT_HONORARIUM;
    const transport = request.requiresTransport
      ? (settings?.transportAllowanceINR || DEFAULT_TRANSPORT)
      : 0;
    const totalINR = honorarium + transport;
    const totalPaise = Math.round(totalINR * 100);

    const order = await razorpay.orders.create({
      amount: totalPaise,
      currency: 'INR',
      receipt: `rcpt_${requestId.substring(0, 12)}`,
      payment_capture: 0,
      notes: {
        requestId,
        candidateName: request.candidate.user.name,
        examName: request.examName,
      },
    });

    const tx = await prisma.paymentTransaction.create({
      data: {
        requestId,
        amount: totalINR,
        type: 'PLATFORM_FEE_INBOUND',
        status: 'PENDING',
        pgOrderId: order.id,
      },
    });

    return {
      orderId: order.id,
      keyId: process.env.RAZORPAY_KEY_ID,
      amount: totalPaise,
      currency: 'INR',
      transactionId: tx.id,
      breakdown: { honorarium, transport, totalINR },
    };
  }

  /**
   * 2. Verify payment signature, capture, update status to ESCROWED, and set request to CREATED
   */
  static async verifyAndLockEscrow(payload) {
    const { requestId, razorpayOrderId, razorpayPaymentId, razorpaySignature } = payload;

    const tx = await prisma.paymentTransaction.findFirst({
      where: { requestId, pgOrderId: razorpayOrderId, type: 'PLATFORM_FEE_INBOUND' },
    });
    if (!tx) throw new Error('Transaction not found');

    if (!razorpayOrderId.startsWith('order_mock_')) {
      const secret = process.env.RAZORPAY_KEY_SECRET;
      const generatedSignature = crypto
        .createHmac('sha256', secret)
        .update(`${razorpayOrderId}|${razorpayPaymentId}`)
        .digest('hex');
      if (generatedSignature !== razorpaySignature) {
        throw new Error('Invalid signature');
      }
    }

    let capture;
    try {
      capture = await razorpay.payments.capture(razorpayPaymentId, tx.amount * 100);
      if (capture.status !== 'captured') throw new Error('Capture failed');
    } catch (err) {
      if (process.env.NODE_ENV === 'development') {
        capture = { status: 'captured' };
      } else {
        throw err;
      }
    }

    await prisma.paymentTransaction.update({
      where: { id: tx.id },
      data: {
        status: 'ESCROWED',
        pgPaymentId: razorpayPaymentId,
      },
    });

    const updatedRequest = await prisma.examRequest.update({
      where: { id: requestId },
      data: { status: 'CREATED' },
    });

    return {
      success: true,
      message: 'Payment verified and escrowed. Request is now active for matching.',
      requestId: updatedRequest.id,
    };
  }

  /**
   * 3. Release payout to volunteer after exam completion
   */
  static async releaseEscrowPayout(requestId) {
    console.log(`[Payout] Starting for request ${requestId}`);

    const request = await prisma.examRequest.findUnique({
      where: { id: requestId },
      include: {
        volunteer: { include: { user: true } },
        payments: {
          where: { type: 'PLATFORM_FEE_INBOUND', status: 'ESCROWED' },
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
    });
    if (!request) {
      console.error(`[Payout] Request ${requestId} not found`);
      throw new Error('Request not found');
    }
    if (request.status !== 'COMPLETED') {
      console.error(`[Payout] Request ${requestId} status is ${request.status}, not COMPLETED`);
      throw new Error(`Cannot payout: status is ${request.status}, must be COMPLETED`);
    }
    if (!request.volunteer) {
      console.error(`[Payout] No volunteer assigned to request ${requestId}`);
      throw new Error('No volunteer assigned');
    }
    if (!request.volunteer.upiId) {
      console.warn(`[Payout] Volunteer UPI missing for request ${requestId} – pending UPI configuration`);
    }

    const tx = request.payments[0];
    if (!tx) {
      console.error(`[Payout] No escrow transaction found for request ${requestId}`);
      throw new Error('No escrow transaction found');
    }

    const accountNumber = process.env.RAZORPAYX_ACCOUNT_NUMBER;

    let payoutId = `payout_mock_${requestId.substring(0, 8)}`;
    try {
      if (accountNumber && request.volunteer.upiId) {
        const payoutPayload = {
          account_number: accountNumber,
          fund_account: {
            account_type: 'vpa',
            vpa: { address: request.volunteer.upiId },
          },
          amount: Math.round(tx.amount * 100),
          currency: 'INR',
          mode: 'UPI',
          purpose: 'payout',
          reference_id: `payout_${requestId}`,
          notes: {
            requestId,
            volunteerName: request.volunteer.user.name,
          },
        };
        const payout = await razorpay.payouts.create(payoutPayload);
        payoutId = payout.id;
        console.log(`[Payout] RazorpayX Payout successful: ${payoutId}`);
      } else {
        console.log(`[Payout] Test/Simulated Payout successful for request ${requestId} to ${request.volunteer.user.name}`);
      }

      // Mark inbound student fee as SUCCESS (fully settled)
      await prisma.paymentTransaction.update({
        where: { id: tx.id },
        data: {
          status: 'SUCCESS',
          payoutRefId: payoutId,
        },
      });

      // Create outbound payout transaction record
      await prisma.paymentTransaction.create({
        data: {
          requestId,
          amount: tx.amount,
          type: 'SCRIBE_PAYOUT_OUTBOUND',
          status: 'SUCCESS',
          payoutRefId: payoutId,
        },
      });
    } catch (err) {
      console.error(`[Payout] RazorpayX call error (fallback to pending payout):`, err.message);
      // Create outbound failed record for admin retry without corrupting candidate inbound fee
      await prisma.paymentTransaction.create({
        data: {
          requestId,
          amount: tx.amount,
          type: 'SCRIBE_PAYOUT_OUTBOUND',
          status: 'FAILED',
          failureReason: err.message,
        },
      });
    }

    // Update volunteer stats
    await prisma.volunteerProfile.update({
      where: { id: request.volunteerId },
      data: {
        totalExams: { increment: 1 },
        xpPoints: { increment: 100 },
      },
    });

    console.log(`[Payout] Stats updated for volunteer ${request.volunteerId}`);

    return {
      success: true,
      payoutId: payout.id,
      amount: tx.amount,
      recipientUpi: request.volunteer.upiId,
    };
  }

  /**
   * 4. Refund escrow to student (full amount)
   */
  static async refundEscrow(requestId) {
    const request = await prisma.examRequest.findUnique({
      where: { id: requestId },
      include: {
        payments: {
          where: { type: 'PLATFORM_FEE_INBOUND', status: { in: ['ESCROWED', 'CAPTURED'] } },
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
    });
    if (!request) throw new Error('Request not found');
    const tx = request.payments[0];
    if (!tx) throw new Error('No escrow payment found to refund');

    try {
      const refund = await razorpay.payments.refund(tx.pgPaymentId, {
        amount: Math.round(tx.amount * 100),
      });
      await prisma.paymentTransaction.update({
        where: { id: tx.id },
        data: { status: 'REFUNDED' },
      });
      await prisma.examRequest.update({
        where: { id: requestId },
        data: { status: 'REFUNDED' },
      });
      return { success: true, refundId: refund.id };
    } catch (err) {
      throw new Error(`Refund failed: ${err.message}`);
    }
  }

  /**
   * 5. Retry a failed payout
   */
  static async retryFailedPayout(requestId) {
    const tx = await prisma.paymentTransaction.findFirst({
      where: { requestId, type: 'PLATFORM_FEE_INBOUND', status: 'FAILED' },
      orderBy: { createdAt: 'desc' },
    });
    if (!tx) throw new Error('No failed payout found for this request');

    const request = await prisma.examRequest.findUnique({
      where: { id: requestId },
      include: { volunteer: { include: { user: true } } },
    });
    if (!request.volunteer.upiId) {
      throw new Error('Volunteer UPI still missing');
    }

    const payoutPayload = {
      account_number: process.env.RAZORPAYX_ACCOUNT_NUMBER || '1234567890',
      fund_account: {
        account_type: 'vpa',
        vpa: { address: request.volunteer.upiId },
      },
      amount: Math.round(tx.amount * 100),
      currency: 'INR',
      mode: 'UPI',
      purpose: 'payout',
      reference_id: `payout_retry_${requestId}`,
    };
    const payout = await razorpay.payouts.create(payoutPayload);
    await prisma.paymentTransaction.update({
      where: { id: tx.id },
      data: { status: 'SUCCESS', payoutRefId: payout.id, failureReason: null },
    });
    return { success: true, payoutId: payout.id };
  }

  /**
   * 6. Check for expired IN_PROGRESS exams (6 hours) and refund
   */
  static async checkTimeoutRefunds() {
    const sixHoursAgo = new Date(Date.now() - 6 * 60 * 60 * 1000);
    const expiredRequests = await prisma.examRequest.findMany({
      where: {
        status: 'IN_PROGRESS',
        pinVerifiedAt: { lt: sixHoursAgo },
      },
      include: {
        payments: {
          where: { type: 'PLATFORM_FEE_INBOUND', status: 'ESCROWED' },
          take: 1,
        },
      },
    });

    const results = [];
    for (const req of expiredRequests) {
      try {
        const result = await PaymentService.refundEscrow(req.id);
        results.push({ requestId: req.id, status: 'refunded', result });
      } catch (err) {
        results.push({ requestId: req.id, status: 'failed', error: err.message });
      }
    }
    return results;
  }
}

module.exports = PaymentService;