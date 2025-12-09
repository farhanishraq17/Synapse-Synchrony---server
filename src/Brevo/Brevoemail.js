// import express from 'express';
import axios from 'axios';
import { VERIFICATION_EMAIL_TEMPLATE, WELCOME_EMAIL_TEMPLATE } from '../mailtrap/emailTemplates.js';

export const sendVerificationEmail = async (email, verificationToken) => {
  const apiKey =
    process.env.BREVO_API_KEY;
  const url = 'https://api.brevo.com/v3/smtp/email';

  const emailData = {
    sender: {
      name: 'Farhan Tahsin Khan',
      email: 'farhankhan@iut-dhaka.edu',
    },
    to: [
      {
        email: email, // Fix: Directly pass the email here, not an object
      },
    ],
    subject: 'Test Email',
    htmlContent: VERIFICATION_EMAIL_TEMPLATE.replace(
      '{verificationCode}',
      verificationToken
    ),
  };

  try {
    const response = await axios.post(url, emailData, {
      headers: {
        'Content-Type': 'application/json',
        'api-Key': apiKey,
      },
    });
    console.log('Email sent successfully:', response.data);
  } catch (error) {
    console.error('Error sending test email:', error);
  }
};



// Send Welcome Email via Brevo (Sendinblue)
export const sendWelcomeEmail = async (email, name) => {
  const apiKey =
    process.env.BREVO_API_KEY;
  const url = 'https://api.brevo.com/v3/smtp/email';

  // Hardcoded company information
  const companyInfo = {
    name: 'Synchronous Synapse',
    address: 'Islamic University of Technology, IUT',
    city: 'Gazipur',
    zipCode: '1207',
    country: 'Bangladesh',
  };

  // Replace the placeholders in the template with actual values
  const emailData = {
    sender: {
      name: 'Farhan Tahsin Khan',
      email: 'farhankhan@iut-dhaka.edu',
    },
    to: [
      {
        email: email,
      },
    ],
    subject: 'Welcome to Our App!',
    htmlContent: WELCOME_EMAIL_TEMPLATE.replace('{name}', name)
      .replace('{company_info_name}', companyInfo.name)
      .replace('{company_info_address}', companyInfo.address)
      .replace('{company_info_city}', companyInfo.city)
      .replace('{company_info_zip_code}', companyInfo.zipCode)
      .replace('{company_info_country}', companyInfo.country),
  };

  try {
    const response = await axios.post(url, emailData, {
      headers: {
        'Content-Type': 'application/json',
        'api-Key': apiKey,
      },
    });
    console.log('Welcome email sent successfully:', response.data);
  } catch (error) {
    console.error('Error sending welcome email:', error);
    throw new Error(`Error sending welcome email: ${error}`);
  }
};

// Call the function with example email and verification token
sendWelcomeEmail('ayon55928@gmail.com', 'Farhan Tahsin Khan');
