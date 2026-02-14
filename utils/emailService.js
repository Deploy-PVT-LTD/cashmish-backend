import nodemailer from 'nodemailer';
import keys from '../config/keys.js';

export const sendEmail = async (options) => {
    const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: keys.emailUser,
            pass: keys.emailPass,
        },
    });

    const mailOptions = {
        from: `"CashMish Support" <${keys.emailUser}>`,
        to: options.email,
        subject: options.subject,
        html: options.html,
    };

    await transporter.sendMail(mailOptions);
};

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
    const acceptUrl = `http://localhost:5174/cart?id=${formId}&action=accept`;
    const rejectUrl = `http://localhost:5174/cart?id=${formId}&action=reject`;

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
