import nodemailer from "nodemailer";
import { env } from "./env";

export const mailTransporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: env.EMAIL_USER,
    pass: env.EMAIL_PASS,
  },
});

export async function sendEmail(to: string, subject: string, html: string) {
  await mailTransporter.sendMail({
    from: `SajiloFix <${env.EMAIL_USER}>`,
    to,
    subject,
    html,
  });
}
