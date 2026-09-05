import { Resend } from "resend";
import { config } from "@/core/config";
import { FileLogger } from "@/core/logger";

class MailService {
	private readonly resend: Resend;
	private readonly logger: FileLogger;

	constructor() {
		this.logger = new FileLogger("logs/mail.log");
		this.resend = new Resend(config.mail.resend.apiKey);
	}

	async sendEmail(options: { to: string; subject: string; html: string; from?: string }): Promise<void> {
		this.throwIfDisabled();

		const { to, subject, html, from = config.mail.from } = options;

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
