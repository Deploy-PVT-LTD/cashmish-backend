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
            <p><strong>Estimated Price:</strong> Rs. ${estimatedPrice}</p>
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

