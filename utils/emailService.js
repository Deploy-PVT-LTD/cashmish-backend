import { Resend } from 'resend';
import keys from '../config/keys.js';

// Initialize Resend with API Key (skip if missing so a bare/dev .env doesn't crash startup)
const resend = keys.resendApiKey ? new Resend(keys.resendApiKey) : null;

// ✅ Verify presence of API Key on startup
if (!keys.resendApiKey) {
    console.error("❌ RESEND ERROR: API Key is missing in .env — emails will be skipped.");
} else {
    console.log("✅ RESEND INITIALIZED — Mails will be sent from", keys.emailFrom);
}

export const sendEmail = async (options) => {
  if (!resend) {
    console.warn(`[RESEND] Skipped — no API key configured. Would have emailed: ${options.email}`);
    return { skipped: true };
  }

  console.log(`[RESEND] Attempting to send email to: ${options.email}`);

  try {
    const { data, error } = await resend.emails.send({
      from: `CashMish Support <${keys.emailFrom}>`,
      to: [options.email],
      subject: options.subject,
      html: options.html,
    });

    if (error) {
      console.error(`[RESEND] API Error:`, error);
      throw new Error(error.message);
    }

    console.log(`[RESEND] Email sent successfully! ID: ${data.id}`);
    return data;
  } catch (err) {
    console.error(`[RESEND] Execution Error:`, err);
    throw err;
  }
};

// Public site + logo used in the newer, branded templates below (SVG renders
// fine in Gmail/Apple Mail; the "CashMish" text alt/heading covers Outlook,
// which doesn't render SVG in emails).
const SITE_URL = 'https://cashmish.com';
const LOGO_URL = `${SITE_URL}/logo.svg`;

const brandedHeader = () => `
  <div style="text-align: center; padding-bottom: 20px; border-bottom: 2px solid #f1f1f1;">
    <img src="${LOGO_URL}" alt="CashMish" height="36" style="height: 36px; display: inline-block;" />
  </div>
`;

// Templates remain exactly the same as they return HTML strings
export const getResetPasswordTemplate = (resetUrl, userName) => {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        .container {
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          max-width: 600px;
          margin: 0 auto;
          padding: 20px;
          border: 1px solid #e0e0e0;
          border-radius: 10px;
          background-color: #ffffff;
        }
        .header {
          text-align: center;
          padding-bottom: 20px;
        }
        .header h1 {
          color: #2c3e50;
          margin: 0;
        }
        .content {
          color: #34495e;
          line-height: 1.6;
        }
        .button-container {
          text-align: center;
          margin: 30px 0;
        }
        .button {
          background-color: #3498db;
          color: white !important;
          padding: 12px 25px;
          text-decoration: none;
          border-radius: 5px;
          font-weight: bold;
          display: inline-block;
        }
        .footer {
          text-align: center;
          font-size: 12px;
          color: #95a5a6;
          margin-top: 30px;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>CashMish</h1>
        </div>
        <div class="content">
          <p>Hello ${userName || 'User'},</p>
          <p>You are receiving this email because you (or someone else) have requested the reset of the password for your account.</p>
          <p>Please click on the button below to complete the process. This link is valid for 1 hour.</p>
        </div>
        <div class="button-container">
          <a href="${resetUrl}" class="button">Reset Password</a>
        </div>
        <div class="content">
          <p>If you did not request this, please ignore this email and your password will remain unchanged.</p>
        </div>
        <div class="footer">
          <p>&copy; ${new Date().getFullYear()} CashMish. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;
};

export const getFormConfirmationTemplate = (userName, deviceName, estimatedPrice) => {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        .container {
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          max-width: 600px;
          margin: 0 auto;
          padding: 20px;
          border: 1px solid #e0e0e0;
          border-radius: 10px;
          background-color: #ffffff;
        }
        .header {
          text-align: center;
          padding-bottom: 20px;
          border-bottom: 2px solid #f1f1f1;
        }
        .header h1 {
          color: #2c3e50;
          margin: 0;
        }
        .content {
          color: #34495e;
          line-height: 1.6;
          margin-top: 20px;
        }
        .details-box {
          background-color: #f9f9f9;
          padding: 15px;
          border-radius: 8px;
          margin: 20px 0;
        }
        .footer {
          text-align: center;
          font-size: 12px;
          color: #95a5a6;
          margin-top: 30px;
        }
        .success-badge {
          background-color: #27ae60;
          color: white;
          padding: 5px 15px;
          border-radius: 20px;
          display: inline-block;
          font-weight: bold;
          margin-bottom: 15px;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>CashMish</h1>
        </div>
        <div class="content">
          <div style="text-align: center;">
            <div class="success-badge">Submission Successful!</div>
          </div>
          <p>Hello ${userName || 'User'},</p>
          <p>Thank you for choosing CashMish! We have successfully received your request for selling your device.</p>
          <p>Our team will contact you soon to coordinate the next steps.</p>
          
          <div class="details-box">
            <h3 style="margin-top: 0; color: #2c3e50;">Request Details:</h3>
            <p><strong>Device:</strong> ${deviceName}</p>
            <p><strong>Estimated Price:</strong> $ ${estimatedPrice}</p>
          </div>
          
          <p>If you have any questions, feel free to reply to this email.</p>
        </div>
        <div class="footer">
          <p>&copy; ${new Date().getFullYear()} CashMish. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;
};

export const getBidStatusTemplate = (userName, deviceName, status, bidPrice) => {
  const isAccepted = status === 'accepted';
  const color = isAccepted ? '#27ae60' : '#e74c3c';
  const statusText = isAccepted ? 'Accepted' : 'Rejected';

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        .container {
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          max-width: 600px;
          margin: 0 auto;
          padding: 20px;
          border: 1px solid #e0e0e0;
          border-radius: 10px;
          background-color: #ffffff;
        }
        .header {
          text-align: center;
          padding-bottom: 20px;
          border-bottom: 2px solid #f1f1f1;
        }
        .header h1 {
          color: #2c3e50;
          margin: 0;
        }
        .content {
          color: #34495e;
          line-height: 1.6;
          margin-top: 20px;
        }
        .status-box {
          background-color: ${color};
          color: white;
          padding: 15px;
          border-radius: 8px;
          text-align: center;
          margin: 20px 0;
          font-weight: bold;
          font-size: 18px;
        }
        .details-box {
          background-color: #f9f9f9;
          padding: 15px;
          border-radius: 8px;
          margin: 20px 0;
          border-left: 4px solid ${color};
        }
        .footer {
          text-align: center;
          font-size: 12px;
          color: #95a5a6;
          margin-top: 30px;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>CashMish</h1>
        </div>
        <div class="content">
          <p>Hello ${userName || 'User'},</p>
          <p>Your trade-in request for <strong>${deviceName}</strong> has been reviewed by our team.</p>
          
          <div class="status-box">
            Status: ${statusText}
          </div>
          
          ${isAccepted ? `
          <div class="details-box">
            <p style="margin: 0;"><strong>Final Offer:</strong> $ ${bidPrice}</p>
            <p style="margin-top: 10px; font-size: 14px;">Our representative will be in touch shortly to finalize the pickup.</p>
          </div>
          ` : `
          <p>Unfortunately, we are unable to proceed with your request at this time. If you have any questions, feel free to contact our support.</p>
          `}
          
          <p>Thank you for using CashMish!</p>
        </div>
        <div class="footer">
          <p>&copy; ${new Date().getFullYear()} CashMish. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;
};

export const getAdminBidOfferTemplate = (userName, deviceName, bidPrice, formId) => {
  const acceptUrl = `https://cashmish.com/cart?id=${formId}&action=accept`;
  const rejectUrl = `https://cashmish.com/cart?id=${formId}&action=reject`;

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        .container {
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          max-width: 600px;
          margin: 0 auto;
          padding: 20px;
          border: 1px solid #e0e0e0;
          border-radius: 10px;
          background-color: #ffffff;
        }
        .header {
          text-align: center;
          padding-bottom: 20px;
          border-bottom: 2px solid #f1f1f1;
        }
        .header h1 {
          color: #2c3e50;
          margin: 0;
        }
        .content {
          color: #34495e;
          line-height: 1.6;
          margin-top: 20px;
        }
        .bid-box {
          background-color: #f1c40f;
          color: #2c3e50;
          padding: 20px;
          border-radius: 8px;
          text-align: center;
          margin: 20px 0;
          font-weight: bold;
        }
        .button-group {
          text-align: center;
          margin: 30px 0;
        }
        .button {
          padding: 12px 25px;
          text-decoration: none;
          border-radius: 5px;
          font-weight: bold;
          display: inline-block;
          margin: 0 10px;
        }
        .btn-accept {
          background-color: #27ae60;
          color: white !important;
        }
        .btn-reject {
          background-color: #e74c3c;
          color: white !important;
        }
        .footer {
          text-align: center;
          font-size: 12px;
          color: #95a5a6;
          margin-top: 30px;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>CashMish</h1>
        </div>
        <div class="content">
          <p>Hello ${userName || 'User'},</p>
          <p>We have reviewed your request for <strong>${deviceName}</strong>. Based on the conditions provided, we have a counter-offer for you:</p>
          
          <div class="bid-box">
            New Bid Price: $ ${bidPrice}
          </div>
          
          <p style="text-align: center;">Would you like to accept or reject this offer?</p>
          
          <div class="button-group">
            <a href="${acceptUrl}" class="button btn-accept">Accept Offer</a>
            <a href="${rejectUrl}" class="button btn-reject">Reject Offer</a>
          </div>
          
          <p>Thank you for choosing CashMish!</p>
        </div>
        <div class="footer">
          <p>&copy; ${new Date().getFullYear()} CashMish. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;
};

export const getAcceptPriceTemplate = (userName, deviceName, price) => {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        .container {
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          max-width: 600px;
          margin: 0 auto;
          padding: 20px;
          border: 1px solid #e0e0e0;
          border-radius: 10px;
          background-color: #ffffff;
        }
        .header {
          text-align: center;
          padding-bottom: 20px;
          border-bottom: 2px solid #f1f1f1;
        }
        .header h1 {
          color: #2c3e50;
          margin: 0;
        }
        .content {
          color: #34495e;
          line-height: 1.6;
          margin-top: 20px;
        }
        .success-box {
          background-color: #27ae60;
          color: white;
          padding: 20px;
          border-radius: 8px;
          text-align: center;
          margin: 20px 0;
          font-weight: bold;
        }
        .footer {
          text-align: center;
          font-size: 12px;
          color: #95a5a6;
          margin-top: 30px;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>CashMish</h1>
        </div>
        <div class="content">
          <p>Hello ${userName || 'User'},</p>
          <p>Great news! We have accepted your price for <strong>${deviceName}</strong>.</p>
          
          <div class="success-box">
            Price Accepted: $ ${price}
          </div>
          
          <p>Our team will contact you shortly to coordinate the pickup and final payment.</p>
          
          <p>Thank you for choosing CashMish!</p>
        </div>
        <div class="footer">
          <p>&copy; ${new Date().getFullYear()} CashMish. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;
};
export const getPayoutSentTemplate = (userName, amount) => {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        .container {
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          max-width: 600px;
          margin: 0 auto;
          padding: 20px;
          border: 1px solid #e0e0e0;
          border-radius: 10px;
          background-color: #ffffff;
        }
        .header {
          text-align: center;
          padding-bottom: 20px;
          border-bottom: 2px solid #f1f1f1;
        }
        .header h1 {
          color: #2c3e50;
          margin: 0;
        }
        .content {
          color: #34495e;
          line-height: 1.6;
          margin-top: 20px;
        }
        .success-box {
          background-color: #27ae60;
          color: white;
          padding: 20px;
          border-radius: 8px;
          text-align: center;
          margin: 20px 0;
          font-weight: bold;
        }
        .footer {
          text-align: center;
          font-size: 12px;
          color: #95a5a6;
          margin-top: 30px;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>CashMish</h1>
        </div>
        <div class="content">
          <p>Hello ${userName || 'User'},</p>
          <p>Great news! Your payment has been processed and sent to your bank account.</p>
          
          <div class="success-box">
            Amount Sent: $ ${amount}
          </div>
          
          <p>It may take some time to reflect in your account depending on your bank's processing time.</p>
          <p>Thank you for choosing CashMish!</p>
        </div>
        <div class="footer">
          <p>&copy; ${new Date().getFullYear()} CashMish. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;
};

// ── Payment-flow templates (Submissions review → counter offer → shipping) ──

// Sent the moment a price is confirmed for the customer to receive — either
// the admin's counter offer exactly matched the system estimate, or the
// customer just accepted a differing counter offer via the email below.
export const getPaymentConfirmedTemplate = (userName, deviceName, amount, { labelUrl, labelNumber, trackingUrl } = {}) => {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        .container { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 10px; background-color: #ffffff; }
        .content { color: #34495e; line-height: 1.6; margin-top: 20px; }
        .price-box { background-color: #27ae60; color: white; padding: 20px; border-radius: 8px; text-align: center; margin: 20px 0; font-weight: bold; font-size: 22px; }
        .details-box { background-color: #f9f9f9; padding: 15px; border-radius: 8px; margin: 20px 0; }
        .button-group { text-align: center; margin: 25px 0; }
        .button { padding: 12px 25px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block; margin: 6px; }
        .btn-label { background-color: #16a34a; color: white !important; }
        .btn-track { background-color: #2c3e50; color: white !important; }
        .footer { text-align: center; font-size: 12px; color: #95a5a6; margin-top: 30px; }
      </style>
    </head>
    <body>
      <div class="container">
        ${brandedHeader()}
        <div class="content">
          <p>Hello ${userName || 'there'},</p>
          <p>Your price for <strong>${deviceName}</strong> is confirmed:</p>
          <div class="price-box">$ ${amount}</div>
          <div class="details-box">
            <p style="margin: 0;">📦 Use the attached prepaid USPS label to ship your device to us — it's free.</p>
            ${labelNumber ? `<p style="margin-top: 10px;">🔖 USPS Tracking Number: <strong>${labelNumber}</strong></p>` : ''}
            <p style="margin-top: 10px;">💰 You'll receive your payment <strong>within 48 hours of us receiving your device</strong>.</p>
          </div>
          ${(labelUrl || trackingUrl) ? `
          <div class="button-group">
            ${labelUrl ? `<a href="${labelUrl}" class="button btn-label">Download Shipping Label</a>` : ''}
            ${trackingUrl ? `<a href="${trackingUrl}" class="button btn-track">Track Your Shipment</a>` : ''}
          </div>
          ` : ''}
          <p>Thank you for choosing CashMish!</p>
        </div>
        <div class="footer"><p>&copy; ${new Date().getFullYear()} CashMish. All rights reserved.</p></div>
      </div>
    </body>
    </html>
  `;
};

// Sent when the admin's counter offer differs from the system estimate — the
// customer must actively accept it (no login, just this link) before
// anything ships or gets paid.
export const getCounterOfferProposalTemplate = (userName, deviceName, estimatedPrice, counterOfferPrice, acceptUrl) => {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        .container { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 10px; background-color: #ffffff; }
        .content { color: #34495e; line-height: 1.6; margin-top: 20px; }
        .price-row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #eee; }
        .offer-box { background-color: #f1c40f; color: #2c3e50; padding: 20px; border-radius: 8px; text-align: center; margin: 20px 0; font-weight: bold; font-size: 22px; }
        .button-group { text-align: center; margin: 30px 0; }
        .button { padding: 14px 32px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block; }
        .btn-accept { background-color: #27ae60; color: white !important; }
        .footer { text-align: center; font-size: 12px; color: #95a5a6; margin-top: 30px; }
      </style>
    </head>
    <body>
      <div class="container">
        ${brandedHeader()}
        <div class="content">
          <p>Hello ${userName || 'there'},</p>
          <p>We've inspected your <strong>${deviceName}</strong> submission. Based on its actual condition, we'd like to offer you a counter offer:</p>
          <div class="offer-box">Counter Offer: $ ${counterOfferPrice}</div>
          <p style="text-align: center; color: #7f8c8d; font-size: 14px;">(Original estimate was $ ${estimatedPrice})</p>
          <p style="text-align: center;">Click below to accept this counter offer and receive your free shipping label:</p>
          <div class="button-group">
            <a href="${acceptUrl}" class="button btn-accept">Accept Counter Offer</a>
          </div>
          <p style="font-size: 13px; color: #7f8c8d;">If you have any questions about this offer, just reply to this email.</p>
        </div>
        <div class="footer"><p>&copy; ${new Date().getFullYear()} CashMish. All rights reserved.</p></div>
      </div>
    </body>
    </html>
  `;
};
