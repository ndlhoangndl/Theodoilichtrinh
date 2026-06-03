import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

let transporter = null;
if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
  transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    }
  });
  console.log('Nodemailer SMTP transporter initialized.');
} else {
  console.log('Nodemailer SMTP not configured (missing EMAIL_USER or EMAIL_PASS in .env). Email reset codes will print to server logs.');
}

export default transporter;
