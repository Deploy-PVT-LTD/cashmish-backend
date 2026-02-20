import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

const testEmail = async () => {
    console.log('Testing Email Configuration...');
    console.log('Email User:', process.env.EMAIL_USER);
    console.log('Email Pass exists:', !!process.env.EMAIL_PASS);

    const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS,
        },
    });

    try {
        const info = await transporter.sendMail({
            from: `"Test Sender" <${process.env.EMAIL_USER}>`,
            to: process.env.EMAIL_USER, // Send to self
            subject: "Test Email from CashMish Debugger",
            text: "If you receive this, email configuration is working correctly.",
            html: "<b>If you receive this, email configuration is working correctly.</b>",
        });

        console.log("Message sent: %s", info.messageId);
        console.log("Email sent successfully!");
    } catch (error) {
        console.error("Error sending email:", error);
    }
};

testEmail();
