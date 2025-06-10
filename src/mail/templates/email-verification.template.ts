export const verificationEmailTemplate = (
  firstName: string,
  verificationUrl: string,
) => {
  const exp = Number(process.env.EMAIL_VERIFICATION_TOKEN_EXP_IN_HOURS || '24');

  return `
  <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>Verify Your Email Address - Brigada Football</title>
          <style>
            body { 
              font-family: Arial, sans-serif; 
              line-height: 1.6;
              color: #333;
              max-width: 600px;
              margin: 0 auto;
            }
            .container { padding: 20px; }
            .header { 
              background-color: #4a69bd;
              color: white;
              padding: 20px;
              text-align: center;
              border-radius: 5px 5px 0 0;
            }
            .content { 
              padding: 20px;
              border: 1px solid #ddd;
              border-top: none;
              border-radius: 0 0 5px 5px;
            }
            .button {
              display: inline-block;
              background-color: #4a69bd;
              color: white;
              text-decoration: none;
              padding: 10px 20px;
              border-radius: 5px;
              margin-top: 15px;
            }
            .footer {
              margin-top: 20px;
              text-align: center;
              font-size: 12px;
              color: #777;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Verify Your Email Address</h1>
            </div>
            <div class="content">
              <h2>Hello ${firstName},</h2>
              <p>Thank you for registering! Please verify your email address to complete your registration.</p>
              <p>This verification link will expire in ${exp} hour${exp === 1 ? '' : 's'}.</p>
              <a href="${verificationUrl}" class="button">Verify Email Address</a>
              <p style="margin-top: 20px;">If you did not create an account, you can safely ignore this email.</p>
            </div>
            <div class="footer">
              <p>&copy; ${new Date().getFullYear()} Brigada Football. All rights reserved.</p>
            </div>
          </div>
        </body>
      </html>
  `;
};
