const nodemailer = require('nodemailer');
const config = require('../config');
const logger = require('../utils/logger');

const transporter = nodemailer.createTransport({
    host: config.emailHost,
    port: config.emailPort,
    secure: config.emailPort === 465, 
    auth: {
        user: config.emailUser,
        pass: config.emailPass,
    },
    tls: {
      
        rejectUnauthorized: process.env.NODE_ENV === 'production' 
    }
});

const sendEmail = async (to, subject, htmlContent, textContent = '') => {
    const mailOptions = {
        from: `"${process.env.APP_NAME || 'RentalApp'}" <${config.emailFrom}>`,
        to: to, // list of receivers
        subject: subject, // Subject line
        text: textContent || htmlContent.replace(/<[^>]*>?/gm, ''), // plain text body
        html: htmlContent, // html body
    };

    try {
        let info = await transporter.sendMail(mailOptions);
        logger.info(`Email sent to ${to}: ${info.messageId}`);
        return info;
    } catch (error) {
        logger.error(`Error sending email to ${to}:`, error);
        throw error;
    }
};

const sendRentReminderEmail = async (tenantEmail, tenantName, dueDate, amount) => {
    const subject = 'Rent Payment Reminder';
    const htmlContent = `
        <p>Dear ${tenantName},</p>
        <p>This is a friendly reminder that your rent payment of $${amount} is due on ${new Date(dueDate).toLocaleDateString()}.</p>
        <p>Please make your payment on time to avoid any late fees.</p>
        <p>Thank you,<br/>Your Property Management</p>
    `;
    return sendEmail(tenantEmail, subject, htmlContent);
};

const sendOverdueRentEmail = async (tenantEmail, tenantName, dueDate, amount) => {
    const subject = 'ACTION REQUIRED: Overdue Rent Payment';
    const htmlContent = `
        <p>Dear ${tenantName},</p>
        <p>Our records indicate that your rent payment of $${amount}, which was due on ${new Date(dueDate).toLocaleDateString()}, is overdue.</p>
        <p>Please make the payment as soon as possible to avoid further action.</p>
        <p>If you have already made the payment, please disregard this notice or contact us.</p>
        <p>Thank you,<br/>Your Property Management</p>
    `;
    return sendEmail(tenantEmail, subject, htmlContent);
};

const sendLeaseExpiryNotification = async (email, name, leaseEndDate, type = 'tenant') => {
    const subject = 'Lease Expiration Notice';
    let messageIntro = type === 'tenant' ?
        `This is a reminder that your lease agreement is set to expire on ${new Date(leaseEndDate).toLocaleDateString()}.` :
        `The lease agreement for tenant ${name} is set to expire on ${new Date(leaseEndDate).toLocaleDateString()}.`;
    
    const htmlContent = `
        <p>Dear ${name},</p>
        <p>${messageIntro}</p>
        <p>Please contact us to discuss renewal options or move-out procedures.</p>
        <p>Thank you,<br/>Your Property Management</p>
    `;
    return sendEmail(email, subject, htmlContent);
};

const sendMaintenanceStatusUpdateEmail = async (email, name, requestId, status, notes = '') => {
    const subject = `Maintenance Request #${requestId} Status Update: ${status}`;
    const htmlContent = `
        <p>Dear ${name},</p>
        <p>The status of your maintenance request #${requestId} has been updated to: <strong>${status}</strong>.</p>
        ${notes ? `<p><strong>Notes:</strong> ${notes}</p>` : ''}
        <p>You can view the details of your request in your tenant portal.</p>
        <p>Thank you,<br/>Your Property Management</p>
    `;
    return sendEmail(email, subject, htmlContent);
};



module.exports = {
    sendEmail,
    sendRentReminderEmail,
    sendOverdueRentEmail,
    sendLeaseExpiryNotification,
    sendMaintenanceStatusUpdateEmail,
    // sendSms
};