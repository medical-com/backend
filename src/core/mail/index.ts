import { Resend } from "resend";
import { config } from "@/core/config";
import { FileLogger } from "@/core/logger";

class MailService {
	private readonly resend: Resend;
	private readonly logger: FileLogger;

	constructor() {
		this.logger = new FileLogger("mail.log");
		this.resend = new Resend(config.mail.resend.apiKey);
	}

	async sendEmail(options: { to: string; subject: string; html: string; from?: string }): Promise<void> {
		this.throwIfDisabled();

		const { to, subject, html, from = config.mail.from } = options;

		if (!config.mail.sendDisabled) {
			const { error } = await this.resend.emails.send({
				from,
				to,
				subject,
				html,
			});

			if (error) {
				this.logger.error(`Failed to send email to ${to}: ${error.message}`, { to, subject, html, from });

				throw new Error(`Mail delivery failed: ${error.message}`);
			}
		}

		this.logger.info(`Email sent to ${to} — subject: "${subject}"`, { to, subject, html, from });
	}

	async sendEmailVerification(options: { email: string; token: string }): Promise<void> {
		const { email, token } = options;

		const subject = "Email Verification";
		const html = `
			<p>Thank you for registering. Please verify your email by using the following token:</p>
			<h2>${token}</h2>
			<p>This token will expire in 1 hour.</p>
		`;

		await this.sendEmail({ to: email, subject, html });
	}

	async sendDoctorInvitation(options: {
		email: string;
		token: string;
		temporaryPassword: string;
		firstName: string;
		lastName: string;
		pesel: string;
		phoneNumber: string;
		dateOfBirth: Date;
		licenseNumber: string;
		specialization: string;
	}): Promise<void> {
		const link = `${config.clientUrl}/auth/confirm-doctor?token=${encodeURIComponent(options.token)}`;
		const subject = "Doctor account invitation";
		const html = `
			<p>An administrator invited you to join the care team. Confirm your account using the link below:</p>
			<p><a href="${link}">${link}</a></p>
			<p><strong>Temporary password:</strong> ${options.temporaryPassword}</p>
			<p><strong>Security notice:</strong> This is a temporary password. Change it as soon as possible after your first login.</p>
			<h3>Submitted details</h3>
			<ul>
				<li>First name: ${options.firstName}</li>
				<li>Last name: ${options.lastName}</li>
				<li>PESEL: ${options.pesel}</li>
				<li>Email: ${options.email}</li>
				<li>Phone: ${options.phoneNumber}</li>
				<li>Date of birth: ${options.dateOfBirth.toISOString().slice(0, 10)}</li>
				<li>License number: ${options.licenseNumber}</li>
				<li>Specialization: ${options.specialization}</li>
			</ul>
			<p>This invitation expires in 1 hour.</p>
		`;

		await this.sendEmail({ to: options.email, subject, html });
	}

	async sendPasswordReset(options: { email: string; token: string }): Promise<void> {
		const { email, token } = options;

		const link = `${config.clientUrl}/auth/reset-password?token=${token}`;

		const subject = "Password Reset";
		const html = `
			<p>We received a request to reset your password. Click the link below to choose a new one:</p>
			<p><a href="${link}">${link}</a></p>
			<p>This link will expire in 1 hour. If you didn't request this, you can ignore this email.</p>
		`;

		await this.sendEmail({ to: email, subject, html });
	}

	private throwIfDisabled(): void {
		if (config.mail.resend.disabled) {
			this.logger.warn("Mail sending is disabled — skipping mail operation.");

			throw new Error("Mail sending is disabled");
		}

		if (!config.mail.resend.apiKey) {
			this.logger.error("Mail sending is enabled but RESEND_API_KEY is not set.");

			throw new Error("Mail sending is enabled but API key is missing");
		}
	}
}
export const mailService = new MailService();
