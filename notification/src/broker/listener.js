const { subscribeToQueue } = require("../broker/broker");
const { sendEmail } = require("../email");

module.exports = function () {
  subscribeToQueue("AUTH_NOTIFICATION.USER_QUEUE", async (data) => {
    // console.log("Received data from queue: ", data);
    const emailHTMLTemplate = `<p>Dear ${data.fullName.firstName + " " + (data.fullName.lastName || " ")},</p>
<p>ThankYou for registering with us . we are excited to have you on board!</p>
<p>Best regards,<br/>The Team</p>
`;

    await sendEmail(
      data.email,
      "Welcome to Our Service!",
      "Thank you for registering with us.",
      emailHTMLTemplate,
    );
  });

  subscribeToQueue("PAYMENT_NOTIFICATION.PAYMENT_COMPLETED", async (data) => {
    // console.log("Received data from queue: ", data);
    const emailHTMLTemplate = `<p>Dear ${data.username},</p>
<p>Your payment of ${data.currency} ${data.amount} has been successfully processed. Thank you for your purchase!</p>
<p>Best regards,<br/>The Team</p>
`;

    await sendEmail(
      data.email,
      "Payment Confirmation",
      "Your payment has been successfully processed.",
      emailHTMLTemplate,
    );
  });

  subscribeToQueue("PAYMENT_NOTIFICATION.PAYMENT_FAILED", async (data) => {
    // console.log("Received data from queue: ", data);
    const emailHTMLTemplate = `<p>Dear ${data.username},</p>
<p>We regret to inform you that your recent payment of ${data.orderId} has failed. Please check your payment details and try again.</p>
<p>Best regards,<br/>The Team</p>
`;

    await sendEmail(
      data.email,
      "Payment Failed",
      "Your recent payment has failed.",
      emailHTMLTemplate,
    );
  });
};
