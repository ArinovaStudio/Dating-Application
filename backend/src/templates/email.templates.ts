export const emailTemplates = {
  verification: (otp: string) => `
    <div style="font-family: Arial, sans-serif; padding: 20px;">
      <h2>Verify your Email</h2>
      <p>Your verification code for the Dating App is:</p>
      <h1 style="color: #4A90E2; letter-spacing: 5px;">${otp}</h1>
      <p>This code expires in 10 minutes.</p>
    </div>
  `
};