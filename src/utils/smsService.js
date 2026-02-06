import axios from 'axios';

/**
 * Send SMS using SMS Net BD service
 * @param {string} phoneNumber - Phone number (with or without 880 prefix)
 * @param {string} message - SMS message content
 * @returns {Promise<{success: boolean, data?: any, error?: string}>}
 */
export const sendSMS = async (phoneNumber, message) => {
  try {
    // Ensure phone has 880 prefix (Bangladesh country code)
    const formattedPhone = phoneNumber.startsWith('880') 
      ? phoneNumber 
      : `880${phoneNumber.replace(/^0+/, '')}`;

    const options = {
      method: 'POST',
      url: 'https://api.sms.net.bd/sendsms',
      data: {
        api_key: process.env.SMS_NET_BD,
        msg: message,
        to: formattedPhone,
      },
    };

    const response = await axios(options);
    console.log('SMS sent successfully:', response.data);
    return { success: true, data: response.data };
  } catch (error) {
    console.error('SMS sending failed:', error.message);
    return { success: false, error: error.message };
  }
};
