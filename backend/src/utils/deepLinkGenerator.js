// Uber/Ola intent link generator
/**
 * Generate WhatsApp direct action link for rapid volunteer assignment alerts
 */
exports.generateWhatsAppAlertLink = (phone, examTitle, locationName, requestId) => {
  const cleanPhone = phone.replace(/[^0-9]/g, '');
  const text = encodeURIComponent(
    `🚨 *Emergency Scribe Request*\n\n` +
    `Exam: *${examTitle}*\n` +
    `Location: *${locationName}*\n\n` +
    `Click to accept this assignment:\n` +
    `https://scribeapp.com/requests/${requestId}/accept`
  );

  return `https://wa.me/${cleanPhone}?text=${text}`;
};