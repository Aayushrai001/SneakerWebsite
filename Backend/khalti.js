// khalti.js
const axios = require('axios');

async function initializeKhaltiPayment(details) {
  const headersList = {
    "Authorization": `Key ${process.env.KHALTI_SECRET_KEY}`,
    "Content-Type": "application/json",
  };

  const reqOptions = {
    url: `${process.env.KHALTI_GATEWAY_URL}/api/v2/epayment/initiate/`,
    method: "POST",
    headers: headersList,
    data: details,
  };

  try {
    console.log('Initiating Khalti payment with details:', details);
    const response = await axios.request(reqOptions);
    console.log('Khalti API Response:', response.data);
    return response.data;
  } catch (error) {
    console.error("Error initializing Khalti payment:", {
      message: error.message,
      status: error.response?.status,
      data: error.response?.data,
      requestData: details,
    });
    let errorMessage = `Khalti API error: ${error.response?.status || 'Unknown'} - ${error.response?.data?.message || error.message}`;
    if (error.response?.status === 401) {
      errorMessage = 'Khalti API error: 401 - Invalid or unauthorized Khalti API key';
    }
    throw new Error(errorMessage);
  }
}

async function verifyKhaltiPayment(pidx) {
  const headersList = {
    "Authorization": `Key ${process.env.KHALTI_SECRET_KEY}`,
    "Content-Type": "application/json",
  };

  const bodyContent = { pidx };

  const reqOptions = {
    url: `${process.env.KHALTI_GATEWAY_URL}/api/v2/epayment/lookup/`,
    method: "POST",
    headers: headersList,
    data: bodyContent,
  };

  try {
    console.log('Verifying Khalti payment with pidx:', pidx);
    const response = await axios.request(reqOptions);
    console.log('Khalti Verification Response:', response.data);
    return response.data;
  } catch (error) {
    console.error("Error verifying Khalti payment:", {
      message: error.message,
      status: error.response?.status,
      data: error.response?.data,
      requestData: bodyContent,
    });
    let errorMessage = `Khalti API error: ${error.response?.status || 'Unknown'} - ${error.response?.data?.message || error.message}`;
    if (error.response?.status === 401) {
      errorMessage = 'Khalti API error: 401 - Invalid or unauthorized Khalti API key';
    }
    throw new Error(errorMessage);
  }
}

module.exports = { initializeKhaltiPayment, verifyKhaltiPayment };