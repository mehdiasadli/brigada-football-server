import { Injectable, Logger } from '@nestjs/common';
import * as mailjet from 'node-mailjet';
import { UsersService } from 'src/users/users.service';
import { verificationEmailTemplate } from './templates/email-verification.template';
import { resetPasswordTemplate } from './templates/reset-password.template';
import { appConfig } from 'src/_common/config';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private client: mailjet.Client;
  private readonly sender: { Email: string; Name: string };

  constructor(private readonly usersService: UsersService) {
    this.client = mailjet.Client.apiConnect(
      appConfig.MAILJET_API_KEY,
      appConfig.MAILJET_API_SECRET,
    );

    this.sender = {
      Email: appConfig.MAIL_SENDER_ADDRESS,
      Name: appConfig.MAIL_SENDER_NAME,
    };
  }

  async sendVerificationEmail(
    user: { id: string; email: string; firstName: string; lastName: string },
    verificationToken: string,
  ) {
    const baseUrl = appConfig.CLIENT_URL;
    const verificationUrl = `${baseUrl}/auth/verify-email?token=${verificationToken}&email=${encodeURIComponent(user.email)}`;
    this.logger.log(
      `Sending verification email to ${user.email} with url: ${verificationUrl}`,
    );

    const result = await this.client.post('send', { version: 'v3.1' }).request({
      Messages: [
        {
          From: this.sender,
          Subject: 'Brigada Football - Verify your email address',
          CustomID: `email-verification-${user.id}-${Date.now()}`.substring(
            0,
            50,
          ),
          To: [
            {
              Email: user.email,
              Name: `${user.firstName} ${user.lastName}`,
            },
          ],
          HTMLPart: verificationEmailTemplate(user.firstName, verificationUrl),
        },
      ],
    });

    this.logger.log(
      `Mail result data: ${JSON.stringify(result.response.data)}`,
    );
    this.logger.log(
      `Mail result status: ${JSON.stringify(result.response.status)}`,
    );

    return {
      success: true,
      message: 'Verification email sent successfully',
    };
  }

  async sendPasswordResetEmail(
    user: {
      id: string;
      email: string;
      firstName: string;
      lastName: string;
    },
    resetToken: string,
  ) {
    const baseUrl = appConfig.CLIENT_URL;
    const verificationUrl = `${baseUrl}/auth/reset-password?token=${resetToken}`;

    this.logger.log(
      `Sending password reset email to ${user.email} with url: ${verificationUrl}`,
    );

    const result = await this.client.post('send', { version: 'v3.1' }).request({
      Messages: [
        {
          From: this.sender,
          Subject: 'Brigada Football - Reset your password',
          CustomID: `password-reset-${user.id}-${Date.now()}`.substring(0, 50),
          To: [
            {
              Email: user.email,
              Name: `${user.firstName} ${user.lastName}`,
            },
          ],
          HTMLPart: resetPasswordTemplate(user.firstName, verificationUrl),
        },
      ],
    });

    this.logger.log(
      `Mail result data: ${JSON.stringify(result.response.data)}`,
    );
    this.logger.log(
      `Mail result status: ${JSON.stringify(result.response.status)}`,
    );

    return {
      success: true,
      message: 'Password reset email sent successfully',
    };
  }
}
