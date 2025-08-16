import nodemailer from 'nodemailer'
import dotenv from 'dotenv'
dotenv.config()
export const sendEmail = async (to, subject, text) => {
    const transporter = nodemailer.createTransport({
        service: "gmail",
        secure: true,
        port: 465,
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS
        }
    });
    const mailOptions = {
        from: process.env.EMAIL_USER,
        to,
        subject,
        text
    };
    const mailresponse=await transporter.sendMail(mailOptions);
    if(!mailresponse){
        throw new Error('Failed to send email');
    }
    return res.status(200).json({
        message: 'Email sent successfully',
        mailresponse
    });
}