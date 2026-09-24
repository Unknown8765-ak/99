import nodemailer from "nodemailer";
import {env} from "./env.js";


interface SendEmailOptions {
  to: string;
  subject: string;
  text: string;
}

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: env.EMAIL_USER,
    pass: env.EMAIL_PASS,
  },
});

const sendEmail = async ({
  to,
  subject,
  text,
}: SendEmailOptions): Promise<void> => {
  await transporter.sendMail({
    from: `"99 Support" <${env.EMAIL_USER}>`,
    to,
    subject,
    text,
  });
};

export default sendEmail;