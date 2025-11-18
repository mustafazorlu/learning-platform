import nodemailer, { type Transporter } from "nodemailer";
import type SMTPTransport from "nodemailer/lib/smtp-transport/index.js";
import ejs from "ejs";
import path from "path";
import { fileURLToPath } from "url";
import "dotenv/config";

interface EmailOptions {
    email: string;
    subject: string;
    template: string;
    data: { [key: string]: any };
}

const sendMail = async (options: EmailOptions) => {
    const smtpUser = process.env.SMTP_USER || process.env.SMTP_MAIL;
    const smtpPass = process.env.SMTP_PASSWORD;

    if (!smtpUser || !smtpPass) {
        throw new Error("SMTP credentials are missing");
    }

    const port = parseInt(process.env.SMTP_PORT || "587", 10);
    const secure = port === 465;

    const transportOptions: SMTPTransport.Options = {
        host: process.env.SMTP_HOST,
        port,
        secure,
        service: process.env.SMTP_SERVICE,
        auth: {
            user: smtpUser,
            pass: smtpPass,
        },
    };

    const transporter: Transporter =
        nodemailer.createTransport(transportOptions);

    const { email, subject, template, data } = options;

    const __filename = fileURLToPath(import.meta.url);
    const __dirname = path.dirname(__filename);

    const templatePath = path.join(__dirname, "../mails", template);

    const html: string = await ejs.renderFile(templatePath, data);

    const mailOptions = {
        from: process.env.SMTP_MAIL,
        to: email,
        subject,
        html,
    };

    await transporter.sendMail(mailOptions);
};

export default sendMail;
