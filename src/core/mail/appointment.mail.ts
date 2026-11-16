import { mailService } from ".";

export const sendAppointmentCreatedEmail = async (data: {
	firstName: string;
	lastName: string;
	email: string;
	date: Date;
	serviceName: string;
	duration: number;
	doctorName: string;
}) => {
	const { firstName, lastName, email, date, serviceName, duration, doctorName } = data;

	const subject = "Appointment Created";
	const html = `
        <p>Dear ${firstName} ${lastName},</p>
        <p>Your appointment has been successfully created.</p>
        <p><strong>Appointment Details:</strong></p>
        <ul>
            <li>Date: ${date.toISOString().slice(0, 10)}</li>
            <li>Time: ${date.toISOString().slice(11, 16)}</li>
            <li>Doctor: ${doctorName}</li>
            <li>Service: ${serviceName}</li>
            <li>Duration: ${duration} minutes</li>
        </ul>
        <p>Please make sure to arrive 10 minutes before your scheduled time.</p>
        <p>Thank you for choosing our services.</p>
    `;

	await mailService.sendEmail({ to: email, subject, html });
};

export const sendAppointmentReminderEmail = async (data: {
	firstName: string;
	lastName: string;
	email: string;
	date: Date;
	serviceName: string;
	duration: number;
	doctorName: string;
}) => {
	const { firstName, lastName, email, date, serviceName, duration, doctorName } = data;

	const subject = "Appointment Reminder";
	const html = `
        <p>Dear ${firstName} ${lastName},</p>
        <p>This is a reminder about your upcoming appointment.</p>
        <p><strong>Appointment Details:</strong></p>
        <ul>
            <li>Date: ${date.toISOString().slice(0, 10)}</li>
            <li>Time: ${date.toISOString().slice(11, 16)}</li>
            <li>Doctor: ${doctorName}</li>
            <li>Service: ${serviceName}</li>
            <li>Duration: ${duration} minutes</li>
        </ul>
        <p>Please make sure to arrive 10 minutes before your scheduled time.</p>
        <p>Thank you for choosing our services.</p>
    `;

	await mailService.sendEmail({ to: email, subject, html });
};
