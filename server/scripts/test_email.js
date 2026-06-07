require('dotenv').config();
const nodemailer = require('nodemailer');

const test = async () => {
  const host = process.env.SMTP_HOST;
  const port = parseInt(process.env.SMTP_PORT || '587', 10);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  console.log('SMTP Credentials loaded:');
  console.log(`Host: ${host}`);
  console.log(`Port: ${port}`);
  console.log(`User: ${user}`);
  console.log(`Pass length: ${pass ? pass.length : 0}`);

  const transporter = nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: {
      user,
      pass,
    },
  });

  try {
    console.log('Verifying connection...');
    await transporter.verify();
    console.log('SMTP connection successful!');
  } catch (error) {
    console.error('SMTP connection failed:', error);
  }
};

test();
