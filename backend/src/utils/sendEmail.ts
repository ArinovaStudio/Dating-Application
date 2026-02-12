import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

export const sendEmail = async (to: string, subject: string, html: string): Promise<boolean> => {
  try {
    await transporter.sendMail({
      from: '"Dating App" <no-reply@datingapp.com>',
      to,
      subject,
      html,
    });

    return true;
  } catch (error) {
    console.error('Email failed:', error);
    return false;
  }
};