import nodemailer from "nodemailer";
import { env } from "../config/env";

const hasEmailConfig = Boolean(env.emailHost && env.emailUser && env.emailPass);

const transporter = hasEmailConfig
  ? nodemailer.createTransport({
      host: env.emailHost,
      port: env.emailPort,
      secure: env.emailPort === 465,
      auth: { user: env.emailUser, pass: env.emailPass }
    })
  : null;

export const sendEmail = async (to: string, subject: string, html: string): Promise<void> => {
  if (!transporter) {
    console.log(`Email skipped (${subject}) to ${to}`);
    return;
  }
  await transporter.sendMail({ from: env.emailFrom, to, subject, html });
};

export const sendPasswordResetEmail = async (to: string, token: string): Promise<void> => {
  const url = `${env.clientUrl}/reset-password/${token}`;
  await sendEmail(to, "Reset your Grid Stores password", `<p>Reset your password here: <a href="${url}">${url}</a></p>`);
};
