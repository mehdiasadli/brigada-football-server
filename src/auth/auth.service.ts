import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { UsersService } from 'src/users/users.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { Crypt } from 'src/_common/crypt';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from 'src/prisma/prisma.service';
import { v4 as uuidv4 } from 'uuid';
import { MailService } from 'src/mail/mail.service';
import { ResendVerificationEmailDto } from './dto/resend-verification-email.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { appConfig } from 'src/_common/config';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly prisma: PrismaService,
    private readonly mailService: MailService,
  ) {}

  private async createEmailVerificationToken(userId: string) {
    this.logger.log(
      `Creating email verification token for user with id ${userId}`,
    );

    await this.prisma.emailVerificationToken.deleteMany({
      where: {
        userId,
      },
    });
    this.logger.log('Deleted existing email verification tokens for user');

    const token = uuidv4();
    const expiresAt = new Date();
    expiresAt.setHours(
      expiresAt.getHours() + appConfig.EMAIL_VERIFICATION_TOKEN_EXP_IN_HOURS,
    );

    this.logger.log(
      `Generated token: ${token} AND expires at: ${expiresAt.toISOString()}`,
    );

    await this.prisma.emailVerificationToken.create({
      data: {
        userId,
        token,
        expiresAt,
      },
    });

    this.logger.log(
      `Created email verification token for user with id ${userId}`,
    );

    return token;
  }

  async verifyEmail(token?: string, email?: string) {
    this.logger.log(`Verifying email with token: ${token} and email: ${email}`);

    if (!token) throw new BadRequestException('Token is required');
    if (!email) throw new BadRequestException('Email is required');

    this.logger.log(`Finding verification token with token: ${token}`);

    const verificationToken =
      await this.prisma.emailVerificationToken.findUnique({
        where: { token },
        include: {
          user: {
            select: {
              email: true,
            },
          },
        },
      });

    if (!verificationToken) throw new NotFoundException('Invalid token');
    if (verificationToken.user.email !== email)
      throw new BadRequestException('Invalid token');

    this.logger.log(
      `Verification token found: ${verificationToken.id} AND user email: ${verificationToken.user.email}`,
    );

    if (verificationToken.expiresAt < new Date()) {
      this.logger.log(
        `Verification token has expired: ${verificationToken.id}`,
      );

      await this.prisma.emailVerificationToken.delete({
        where: { id: verificationToken.id },
      });

      throw new BadRequestException('Token has expired. Try to resend again.');
    }

    await this.usersService.markEmailAsVerified(verificationToken.userId);
    await this.prisma.emailVerificationToken.delete({
      where: { id: verificationToken.id },
    });

    this.logger.log(
      `Email verified for user with id ${verificationToken.userId}`,
    );

    return true;
  }

  async register(registerDto: RegisterDto) {
    this.logger.log(`Registering user with email: ${registerDto.email}`);

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { confirmPassword, ...createUserDto } = registerDto;
    const user = await this.usersService.create(createUserDto);
    const token = await this.createEmailVerificationToken(user.id);

    this.logger.log(
      `Sending verification email to user with username ${user.username}`,
    );

    const emailSent = await this.mailService.sendVerificationEmail(user, token);

    if (!emailSent) {
      await this.usersService.remove(user.id);

      throw new InternalServerErrorException(
        'Failed to send verification email. Please try registering again later.',
      );
    }

    this.logger.log(
      `User registered successfully with id ${user.id} and email ${user.email}`,
    );

    return {
      id: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      preferencesId: user.preferencesId,
    };
  }

  async resendVerificationEmail(
    resendVerificationEmailDto: ResendVerificationEmailDto,
  ) {
    const { email } = resendVerificationEmailDto;

    this.logger.log(
      `Resending verification email to user with email: ${email}`,
    );

    const user = await this.usersService.findByEmail(email);

    this.logger.log(`User found: ${user?.id}`);

    if (!user) throw new NotFoundException('User not found');

    if (user.emailVerifiedAt) {
      throw new BadRequestException('Email already verified');
    }

    const token = await this.createEmailVerificationToken(user.id);
    const emailSent = await this.mailService.sendVerificationEmail(user, token);

    this.logger.log(`Email sent: ${emailSent.success}`);

    if (!emailSent) {
      throw new InternalServerErrorException(
        'Failed to send verification email. Please try again later.',
      );
    }

    this.logger.log(
      `Email sent successfully to user with id ${user.id} and email ${user.email}`,
    );

    return true;
  }

  async login(loginDto: LoginDto) {
    this.logger.log(`Logging in user with email: ${loginDto.email}`);

    // Check if user with email exists
    const user = await this.usersService.findByEmail(loginDto.email);
    if (!user) throw new UnauthorizedException('Invalid credentials');

    this.logger.log(`User found: ${user?.id}`);

    // Check if password is valid
    const isPasswordValid = await Crypt.compare(
      loginDto.password,
      user.password,
    );

    this.logger.log(`Is password valid: ${isPasswordValid}`);

    if (!isPasswordValid) {
      this.logger.log(
        `Updating invalid password attempts for user with id ${user.id}`,
      );

      const updatedUser = await this.usersService.updateInvalidPasswordAttempts(
        user.id,
        1,
        'increment',
      );

      this.logger.log(
        `Updated invalid password attempts for user with id ${user.id}`,
      );

      if (
        updatedUser.invalidPasswordAttempts >=
        appConfig.MAX_ALLOWED_INVALID_PASSWORD_ATTEMPTS
      ) {
        this.logger.log(
          `Account blocked due to too many invalid password attempts for user with id ${user.id}`,
        );

        throw new UnauthorizedException(
          'Account blocked due to too many invalid password attempts',
        );
      }

      throw new UnauthorizedException('Invalid credentials');
    } else {
      this.logger.log(
        `Resetting invalid password attempts for user with id ${user.id}`,
      );

      await this.usersService.updateInvalidPasswordAttempts(user.id, 0, 'set');

      this.logger.log(
        `Reset invalid password attempts for user with id ${user.id}`,
      );
    }

    // Check if email is verified
    if (!user.emailVerifiedAt) {
      this.logger.log(
        `User with id ${user.id} is not verified, throwing unauthorized exception`,
      );

      throw new UnauthorizedException(
        'Please verify your email before logging in',
      );
    }

    // If user successfully logged in, we remove all password reset tokens
    await this.prisma.passwordResetToken.deleteMany({
      where: {
        userId: user.id,
      },
    });

    // Generate JWT token
    const token = await this.generateJwtToken(user.id);

    this.logger.log(`Generating JWT token for user with id ${user.id}`);

    return {
      accessToken: token,
      id: user.id,
      email: user.email,
      username: user.username,
      firstName: user.firstName,
      lastName: user.lastName,
      createdAt: user.createdAt,
      role: user.role,
      avatar: user.avatar,
    };
  }

  async forgotPassword(forgotPasswordDto: ForgotPasswordDto) {
    this.logger.log(
      `Forgot password for user with email: ${forgotPasswordDto.email}`,
    );

    const user = await this.usersService.findByEmail(forgotPasswordDto.email);

    this.logger.log(`User found: ${user?.username}`);

    if (!user) {
      // We do not throw error so that we don't leak information about that email
      // exists or not
      this.logger.log(
        `User with email ${forgotPasswordDto.email} not found, returning true`,
      );

      return true;
    }

    const resetToken = await this.createPasswordResetToken(user.id);

    this.logger.log(`Reset token: ${resetToken}`);

    const emailSent = await this.mailService.sendPasswordResetEmail(
      user,
      resetToken,
    );

    this.logger.log(`Email sent: ${emailSent.success}`);

    return true;
  }

  private async createPasswordResetToken(userId: string) {
    this.logger.log(`Creating password reset token for user with id ${userId}`);

    await this.prisma.passwordResetToken.deleteMany({
      where: {
        userId,
      },
    });

    this.logger.log(
      `Deleted existing password reset tokens for user with id ${userId}`,
    );

    const token = uuidv4();
    const expiresAt = new Date();
    expiresAt.setHours(
      expiresAt.getHours() + appConfig.PASSWORD_RESET_TOKEN_EXP_IN_HOURS,
    );

    this.logger.log(
      `Generated token: ${token} AND expires at: ${expiresAt.toISOString()}`,
    );

    await this.prisma.passwordResetToken.create({
      data: {
        userId,
        token,
        expiresAt,
      },
    });

    this.logger.log(`Created password reset token for user with id ${userId}`);

    return token;
  }

  async resetPassword(resetPasswordDto: ResetPasswordDto) {
    this.logger.log(
      `Resetting password for user with token: ${resetPasswordDto.token}`,
    );
    const { token, password } = resetPasswordDto;

    this.logger.log(`Finding reset token with token: ${token}`);

    const resetToken = await this.prisma.passwordResetToken.findUnique({
      where: { token },
    });

    if (!resetToken) {
      this.logger.log(
        `Reset token not found for user with token: ${token}, throwing not found exception`,
      );

      throw new NotFoundException('Invalid token');
    }

    if (resetToken.expiresAt < new Date()) {
      this.logger.log(
        `Reset token has expired for user with token: ${token}, deleting token and throwing bad request exception`,
      );

      await this.prisma.passwordResetToken.delete({
        where: { id: resetToken.id },
      });

      throw new BadRequestException('Token has expired. Try to reset again.');
    }

    this.logger.log(`Updating password for user with id ${resetToken.userId}`);

    await this.usersService.updatePassword(password, resetToken.userId);

    this.logger.log(
      `Deleted reset token for user with id ${resetToken.userId}`,
    );
    await this.prisma.passwordResetToken.delete({
      where: { id: resetToken.id },
    });

    this.logger.log(`Password updated for user with id ${resetToken.userId}`);

    return true;
  }

  private async generateJwtToken(userId: string) {
    this.logger.log(`Generating JWT token for user with id ${userId}`);

    return await this.jwtService.signAsync(
      {
        sub: userId,
      },
      {
        secret: appConfig.JWT_SECRET,
      },
    );
  }
}
