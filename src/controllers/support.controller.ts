import type { Request, Response } from "express";
import sendEmail from "../config/mailConfig.js";
import { env } from "../config/env.js";

interface ContactMessageBody {
  name: string;
  email: string;
  phone: string;
  subject: string;
  message: string;
}

export const sendContactMessage = async (
  req: Request<{}, {}, ContactMessageBody>,
  res: Response
): Promise<void> => {
  try {
    const {
      name,
      email,
      phone,
      subject,
      message,
    } = req.body;

    // Validation
    if (
      !name?.trim() ||
      !email?.trim() ||
      !phone?.trim() ||
      !subject?.trim() ||
      !message?.trim()
    ) {
      res.status(400).json({
        success: false,
        message: "All fields are required.",
      });

      return;
    }

    // Send contact message to support email
    await sendEmail({
      to: env.EMAIL_USER,
      subject: `New Contact Form - ${subject.trim()}`,
      text: `
New Contact Form Submission

Name: ${name.trim()}
Email: ${email.trim()}
Phone: ${phone.trim()}
Subject: ${subject.trim()}

Message:
${message.trim()}
      `,
    });

    res.status(200).json({
      success: true,
      message: "Message sent successfully.",
    });
  } catch (error) {
    console.error("Send contact message error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to send message.",
    });
  }
};