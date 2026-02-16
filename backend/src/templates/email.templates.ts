export const emailTemplates = {
  verification: (otp: string) => `
    <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 600px; margin: 0 auto; border: 1px solid #e0e0e0; border-radius: 8px;">
      <h2 style="color: #333;">Verify your Email</h2>
      <p style="font-size: 16px; color: #555;">Your verification code for the Dating App is:</p>
      <div style="background-color: #f4f8fb; padding: 15px; text-align: center; border-radius: 5px; margin: 20px 0;">
        <h1 style="color: #4A90E2; letter-spacing: 5px; margin: 0;">${otp}</h1>
      </div>
      <p style="font-size: 14px; color: #888;">This code expires in 10 minutes. If you didn't request this, please ignore this email.</p>
    </div>
  `,

  forgotPassword: (otp: string) => `
    <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 600px; margin: 0 auto; border: 1px solid #e0e0e0; border-radius: 8px;">
      <h2 style="color: #D0021B;">Reset Your Password</h2>
      <p style="font-size: 16px; color: #555;">We received a request to reset your password. Use the code below to proceed:</p>
      <div style="background-color: #fff0f0; padding: 15px; text-align: center; border-radius: 5px; margin: 20px 0;">
        <h1 style="color: #D0021B; letter-spacing: 5px; margin: 0;">${otp}</h1>
      </div>
      <p style="font-size: 14px; color: #888;">This code expires in 10 minutes. <br>If you didn't request a password reset, your account is safe and you can ignore this email.</p>
    </div>
  `
};