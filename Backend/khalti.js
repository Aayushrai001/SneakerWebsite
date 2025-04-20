// khalti.js
const axios = require('axios');

async function initializeKhaltiPayment(details) {
  // Ensure all required fields are present
  if (!details.amount || !details.purchase_order_id || !details.purchase_order_name) {
    throw new Error('Missing required fields for Khalti payment');
  }

  // Format amount to ensure it's an integer (in paisa)
  const amount = Math.round(details.amount);

  const headersList = {
    "Authorization": `Key ${process.env.KHALTI_SECRET_KEY}`,
    "Content-Type": "application/json",
  };

  const paymentData = {
    ...details,
    amount: amount,
    // Use a different return URL that doesn't redirect to a success page
    return_url: details.return_url || `${process.env.FRONTEND_URL}/payment/complete`,
    website_url: details.website_url || process.env.FRONTEND_URL,
  };

  const reqOptions = {
    url: `${process.env.KHALTI_GATEWAY_URL}/api/v2/epayment/initiate/`,
    method: "POST",
    headers: headersList,
    data: paymentData,
  };

  try {
    const response = await axios(reqOptions);
    return response.data;
  } catch (error) {
    console.error('Khalti payment initialization error:', error.response?.data || error.message);
    throw new Error(error.response?.data?.detail || error.message);
  }
}

async function verifyKhaltiPayment(pidx) {
  const headersList = {
    "Authorization": `Key ${process.env.KHALTI_SECRET_KEY}`,
    "Content-Type": "application/json",
  };

  const reqOptions = {
    url: `${process.env.KHALTI_GATEWAY_URL}/api/v2/epayment/lookup/`,
    method: "POST",
    headers: headersList,
    data: { pidx },
  };

  try {
    const response = await axios(reqOptions);
    return response.data;
  } catch (error) {
    console.error('Khalti payment verification error:', error.response?.data || error.message);
    throw new Error(error.response?.data?.detail || error.message);
  }
}

module.exports = {
  initializeKhaltiPayment,
  verifyKhaltiPayment,
};