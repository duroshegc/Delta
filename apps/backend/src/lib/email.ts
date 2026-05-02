import nodemailer from "nodemailer";
import type { Transporter } from "nodemailer";
import { env } from "../config/env";
import { logger } from "../config/logger";

/**
 * Email service using Nodemailer with Zoho SMTP
 *
 * Handles:
 * - Email verification
 * - Password reset
 * - Account notifications
 */

let transporter: Transporter | null = null;

/**
 * Initialize email transporter with Zoho SMTP configuration
 */
function getTransporter(): Transporter {
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: env.SMTP_HOST,
      port: env.SMTP_PORT,
      secure: env.SMTP_SECURE, // true for 465, false for other ports
      auth: {
        user: env.SMTP_USER,
        pass: env.SMTP_PASSWORD,
      },
      // Additional Zoho-specific settings
      tls: {
        rejectUnauthorized: true,
      },
    });

    logger.info("Email transporter initialized with Zoho SMTP");
  }

  return transporter;
}

/**
 * Verify email transporter connection
 * @returns Promise resolving to true if connection is successful
 */
export async function verifyEmailConnection(): Promise<boolean> {
  try {
    const transport = getTransporter();
    await transport.verify();
    logger.info("Email connection verified successfully");
    return true;
  } catch (error) {
    logger.error({ error }, "Failed to verify email connection");
    return false;
  }
}

export interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

/**
 * Send an email
 * @param options - Email options (to, subject, html, text)
 * @returns Promise resolving to true if email was sent successfully
 */
export async function sendEmail(options: EmailOptions): Promise<boolean> {
  try {
    const transport = getTransporter();

    const info = await transport.sendMail({
      from: `"${env.SMTP_FROM_NAME}" <${env.SMTP_FROM_EMAIL}>`,
      to: options.to,
      subject: options.subject,
      html: options.html,
      text: options.text,
    });

    logger.info(
      { messageId: info.messageId, to: options.to },
      "Email sent successfully",
    );
    return true;
  } catch (error) {
    logger.error({ error, to: options.to }, "Failed to send email");
    return false;
  }
}

/**
 * Send email verification email
 * @param email - Recipient email address
 * @param verificationToken - Verification token
 * @param userName - User's name (optional)
 * @returns Promise resolving to true if email was sent
 */
export async function sendVerificationEmail(
  email: string,
  verificationToken: string,
  userName?: string,
): Promise<boolean> {
  const verificationUrl = `${env.BETTER_AUTH_URL}/auth/verify-email?token=${verificationToken}`;

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Verify Your Email</title>
    </head>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
        <h1 style="color: white; margin: 0;">Welcome to Delta!</h1>
      </div>
      
      <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
        <p style="font-size: 16px;">Hi ${userName || "there"},</p>
        
        <p style="font-size: 16px;">
          Thank you for signing up! Please verify your email address to complete your registration and start connecting with others.
        </p>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="${verificationUrl}" 
             style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
                    color: white; 
                    padding: 15px 40px; 
                    text-decoration: none; 
                    border-radius: 5px; 
                    font-weight: bold;
                    display: inline-block;">
            Verify Email Address
          </a>
        </div>
        
        <p style="font-size: 14px; color: #666;">
          Or copy and paste this link into your browser:<br>
          <a href="${verificationUrl}" style="color: #667eea; word-break: break-all;">${verificationUrl}</a>
        </p>
        
        <p style="font-size: 14px; color: #666; margin-top: 30px;">
          This verification link will expire in 24 hours.
        </p>
        
        <p style="font-size: 14px; color: #666;">
          If you didn't create an account with Delta, you can safely ignore this email.
        </p>
      </div>
      
      <div style="text-align: center; margin-top: 20px; color: #999; font-size: 12px;">
        <p>© ${new Date().getFullYear()} Delta. All rights reserved.</p>
      </div>
    </body>
    </html>
  `;

  const text = `
    Welcome to Delta!
    
    Hi ${userName || "there"},
    
    Thank you for signing up! Please verify your email address by clicking the link below:
    
    ${verificationUrl}
    
    This verification link will expire in 24 hours.
    
    If you didn't create an account with Delta, you can safely ignore this email.
    
    © ${new Date().getFullYear()} Delta. All rights reserved.
  `;

  return sendEmail({
    to: email,
    subject: "Verify Your Email - Delta",
    html,
    text,
  });
}

/**
 * Send password reset email
 * @param email - Recipient email address
 * @param resetToken - Password reset token
 * @param userName - User's name (optional)
 * @returns Promise resolving to true if email was sent
 */
export async function sendPasswordResetEmail(
  email: string,
  resetToken: string,
  userName?: string,
): Promise<boolean> {
  const resetUrl = `${env.BETTER_AUTH_URL}/auth/reset-password?token=${resetToken}`;

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Reset Your Password</title>
    </head>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
        <h1 style="color: white; margin: 0;">Password Reset Request</h1>
      </div>
      
      <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
        <p style="font-size: 16px;">Hi ${userName || "there"},</p>
        
        <p style="font-size: 16px;">
          We received a request to reset your password. Click the button below to create a new password:
        </p>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="${resetUrl}" 
             style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
                    color: white; 
                    padding: 15px 40px; 
                    text-decoration: none; 
                    border-radius: 5px; 
                    font-weight: bold;
                    display: inline-block;">
            Reset Password
          </a>
        </div>
        
        <p style="font-size: 14px; color: #666;">
          Or copy and paste this link into your browser:<br>
          <a href="${resetUrl}" style="color: #667eea; word-break: break-all;">${resetUrl}</a>
        </p>
        
        <p style="font-size: 14px; color: #666; margin-top: 30px;">
          This password reset link will expire in 1 hour.
        </p>
        
        <p style="font-size: 14px; color: #666;">
          If you didn't request a password reset, you can safely ignore this email. Your password will remain unchanged.
        </p>
      </div>
      
      <div style="text-align: center; margin-top: 20px; color: #999; font-size: 12px;">
        <p>© ${new Date().getFullYear()} Delta. All rights reserved.</p>
      </div>
    </body>
    </html>
  `;

  const text = `
    Password Reset Request
    
    Hi ${userName || "there"},
    
    We received a request to reset your password. Click the link below to create a new password:
    
    ${resetUrl}
    
    This password reset link will expire in 1 hour.
    
    If you didn't request a password reset, you can safely ignore this email. Your password will remain unchanged.
    
    © ${new Date().getFullYear()} Delta. All rights reserved.
  `;

  return sendEmail({
    to: email,
    subject: "Reset Your Password - Delta",
    html,
    text,
  });
}

/**
 * Send welcome email after successful verification
 * @param email - Recipient email address
 * @param userName - User's name
 * @returns Promise resolving to true if email was sent
 */
export async function sendWelcomeEmail(
  email: string,
  userName: string,
): Promise<boolean> {
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Welcome to Delta</title>
    </head>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
        <h1 style="color: white; margin: 0;">Welcome to Delta! 🎉</h1>
      </div>
      
      <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
        <p style="font-size: 16px;">Hi ${userName},</p>
        
        <p style="font-size: 16px;">
          Your email has been verified successfully! You're all set to start your journey with Delta.
        </p>
        
        <p style="font-size: 16px;">
          Here's what you can do next:
        </p>
        
        <ul style="font-size: 16px; line-height: 2;">
          <li>Complete your profile</li>
          <li>Upload your photos</li>
          <li>Set your preferences</li>
          <li>Start discovering matches</li>
        </ul>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="${env.BETTER_AUTH_URL}" 
             style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
                    color: white; 
                    padding: 15px 40px; 
                    text-decoration: none; 
                    border-radius: 5px; 
                    font-weight: bold;
                    display: inline-block;">
            Get Started
          </a>
        </div>
        
        <p style="font-size: 14px; color: #666; margin-top: 30px;">
          If you have any questions, feel free to reach out to our support team.
        </p>
      </div>
      
      <div style="text-align: center; margin-top: 20px; color: #999; font-size: 12px;">
        <p>© ${new Date().getFullYear()} Delta. All rights reserved.</p>
      </div>
    </body>
    </html>
  `;

  const text = `
    Welcome to Delta! 🎉
    
    Hi ${userName},
    
    Your email has been verified successfully! You're all set to start your journey with Delta.
    
    Here's what you can do next:
    - Complete your profile
    - Upload your photos
    - Set your preferences
    - Start discovering matches
    
    Visit ${env.BETTER_AUTH_URL} to get started.
    
    If you have any questions, feel free to reach out to our support team.
    
    © ${new Date().getFullYear()} Delta. All rights reserved.
  `;

  return sendEmail({
    to: email,
    subject: "Welcome to Delta! 🎉",
    html,
    text,
  });
}

// Made with Bob
