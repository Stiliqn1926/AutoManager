import fs from 'fs/promises';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

// ============================================
// SEND EMAIL
// ============================================
interface EmailAttachment {
  filename: string;
  path: string;
}

export const sendEmail = async (
  to: string,
  subject: string,
  html: string,
  attachments?: EmailAttachment[]
): Promise<void> => {
  try {
    const resolvedAttachments = attachments
      ? await Promise.all(
          attachments.map(async (attachment) => {
            const fileBuffer = await fs.readFile(attachment.path);
            return {
              filename: attachment.filename,
              content: fileBuffer.toString('base64'),
            };
          })
        )
      : undefined;

    await resend.emails.send({
      from: process.env.EMAIL_FROM || 'onboarding@resend.dev',
      to,
      subject,
      html,
      attachments: resolvedAttachments,
    });
    console.log(`Email sent to ${to}`);
  } catch (error) {
    console.error('Email sending failed:', error);
    throw error;
  }
};

// ============================================
// EMAIL TEMPLATES
// ============================================
export const emailTemplates = {
  // ------------------------------------------
  // Order ready for payment
  // ------------------------------------------
  orderReady: (orderNumber: string, vehicleInfo: string) => `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #f97316;">ÐŸÐ¾Ñ€ÑŠÑ‡ÐºÐ°Ñ‚Ð° Ðµ Ð³Ð¾Ñ‚Ð¾Ð²Ð°!</h2>
      <p>Ð—Ð´Ñ€Ð°Ð²ÐµÐ¹Ñ‚Ðµ,</p>
      <p>
        Ð’Ð°ÑˆÐ°Ñ‚Ð° Ð¿Ð¾Ñ€ÑŠÑ‡ÐºÐ° <strong>${orderNumber}</strong> Ð·Ð°
        <strong>${vehicleInfo}</strong> Ðµ Ð³Ð¾Ñ‚Ð¾Ð²Ð° Ð·Ð° Ð¿Ð»Ð°Ñ‰Ð°Ð½Ðµ.
      </p>
      <p>ÐœÐ¾Ð»Ñ, Ð¿Ð¾ÑÐµÑ‚ÐµÑ‚Ðµ Ð°Ð²Ñ‚Ð¾ÑÐµÑ€Ð²Ð¸Ð·Ð°, Ð·Ð° Ð´Ð° Ð¿Ð¾Ð»ÑƒÑ‡Ð¸Ñ‚Ðµ Ð°Ð²Ñ‚Ð¾Ð¼Ð¾Ð±Ð¸Ð»Ð° ÑÐ¸.</p>
      <br />
      <p>Ð¡ ÑƒÐ²Ð°Ð¶ÐµÐ½Ð¸Ðµ,<br />Ð•ÐºÐ¸Ð¿ÑŠÑ‚ Ð½Ð° AutoManager</p>
    </div>
  `,

  // ------------------------------------------
  // Order completed
  // ------------------------------------------
  orderCompleted: (orderNumber: string, vehicleInfo: string) => `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #10b981;">ÐŸÐ¾Ñ€ÑŠÑ‡ÐºÐ°Ñ‚Ð° Ðµ Ð·Ð°Ð²ÑŠÑ€ÑˆÐµÐ½Ð°!</h2>
      <p>Ð—Ð´Ñ€Ð°Ð²ÐµÐ¹Ñ‚Ðµ,</p>
      <p>
        Ð’Ð°ÑˆÐ°Ñ‚Ð° Ð¿Ð¾Ñ€ÑŠÑ‡ÐºÐ° <strong>${orderNumber}</strong> Ð·Ð°
        <strong>${vehicleInfo}</strong> Ðµ Ð·Ð°Ð²ÑŠÑ€ÑˆÐµÐ½Ð° Ð¸ Ð¿Ð»Ð°Ñ‚ÐµÐ½Ð°.
      </p>
      <p>Ð‘Ð»Ð°Ð³Ð¾Ð´Ð°Ñ€Ð¸Ð¼ Ð²Ð¸, Ñ‡Ðµ Ð¸Ð·Ð¿Ð¾Ð»Ð·Ð²Ð°Ñ‚Ðµ Ð½Ð°ÑˆÐ¸Ñ‚Ðµ ÑƒÑÐ»ÑƒÐ³Ð¸!</p>
      <br />
      <p>Ð¡ ÑƒÐ²Ð°Ð¶ÐµÐ½Ð¸Ðµ,<br />Ð•ÐºÐ¸Ð¿ÑŠÑ‚ Ð½Ð° AutoManager</p>
    </div>
  `,

  // ------------------------------------------
  // Invoice ready
  // ------------------------------------------
  invoiceReady: (
    invoiceNumber: string,
    total: number,
    orderNumber: string
  ) => `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #3b82f6;">Ð¤Ð°ÐºÑ‚ÑƒÑ€Ð°Ñ‚Ð° Ðµ Ð³Ð¾Ñ‚Ð¾Ð²Ð°!</h2>
      <p>Ð—Ð´Ñ€Ð°Ð²ÐµÐ¹Ñ‚Ðµ,</p>
      <p>
        Ð¤Ð°ÐºÑ‚ÑƒÑ€Ð° <strong>${invoiceNumber}</strong> Ð·Ð° Ð¿Ð¾Ñ€ÑŠÑ‡ÐºÐ°
        <strong>${orderNumber}</strong> Ðµ Ð³Ð¾Ñ‚Ð¾Ð²Ð°.
      </p>
      <p style="font-size: 18px; color: #f97316;"><strong>ÐžÐ±Ñ‰Ð° ÑÑƒÐ¼Ð°: ${total.toFixed(2)} â‚¬</strong></p>
      <p>ðŸ“Ž Ð¤Ð°ÐºÑ‚ÑƒÑ€Ð°Ñ‚Ð° Ðµ Ð¿Ñ€Ð¸ÐºÐ°Ñ‡ÐµÐ½Ð° ÐºÑŠÐ¼ Ñ‚Ð¾Ð·Ð¸ Ð¸Ð¼ÐµÐ¹Ð» ÐºÐ°Ñ‚Ð¾ PDF Ñ„Ð°Ð¹Ð».</p>
      <p>ÐœÐ¾Ð»Ñ, Ð¿Ð»Ð°Ñ‚ÐµÑ‚Ðµ Ñ„Ð°ÐºÑ‚ÑƒÑ€Ð°Ñ‚Ð° Ð¿Ñ€Ð¸ Ð¿Ð¾Ð»ÑƒÑ‡Ð°Ð²Ð°Ð½Ðµ Ð½Ð° Ð°Ð²Ñ‚Ð¾Ð¼Ð¾Ð±Ð¸Ð»Ð°.</p>
      <br />
      <p>Ð¡ ÑƒÐ²Ð°Ð¶ÐµÐ½Ð¸Ðµ,<br />Ð•ÐºÐ¸Ð¿ÑŠÑ‚ Ð½Ð° AutoManager</p>
    </div>
  `,

  // ------------------------------------------
  // Mechanic approved
  // ------------------------------------------
  mechanicApproved: (firstName: string, serviceCompanyName: string) => `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #10b981;">Ð ÐµÐ³Ð¸ÑÑ‚Ñ€Ð°Ñ†Ð¸ÑÑ‚Ð° Ðµ Ð¾Ð´Ð¾Ð±Ñ€ÐµÐ½Ð°!</h2>
      <p>Ð—Ð´Ñ€Ð°Ð²ÐµÐ¹, ${firstName}!</p>
      <p>
        Ð’Ð°ÑˆÐ°Ñ‚Ð° Ð·Ð°ÑÐ²ÐºÐ° Ð·Ð° Ñ€Ð°Ð±Ð¾Ñ‚Ð° Ð²
        <strong>${serviceCompanyName}</strong> Ð±ÐµÑˆÐµ Ð¾Ð´Ð¾Ð±Ñ€ÐµÐ½Ð°!
      </p>
      <p>Ð¡ÐµÐ³Ð° Ð¼Ð¾Ð¶ÐµÑ‚Ðµ Ð´Ð° Ð²Ð»ÐµÐ·ÐµÑ‚Ðµ Ð² ÑÐ¸ÑÑ‚ÐµÐ¼Ð°Ñ‚Ð° Ð¸ Ð´Ð° Ð·Ð°Ð¿Ð¾Ñ‡Ð½ÐµÑ‚Ðµ Ñ€Ð°Ð±Ð¾Ñ‚Ð°.</p>
      <br />
      <p>Ð£ÑÐ¿ÐµÑ…!<br />Ð•ÐºÐ¸Ð¿ÑŠÑ‚ Ð½Ð° AutoManager</p>
    </div>
  `,

  // ------------------------------------------
  // Client approved
  // ------------------------------------------
  clientApproved: (firstName: string, serviceCompanyName: string) => `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #10b981;">ÐŸÑ€Ð¾Ñ„Ð¸Ð»ÑŠÑ‚ Ð²Ð¸ Ðµ Ð¾Ð´Ð¾Ð±Ñ€ÐµÐ½!</h2>
      <p>Ð—Ð´Ñ€Ð°Ð²ÐµÐ¹, ${firstName}!</p>
      <p>
        Ð’Ð°ÑˆÐ°Ñ‚Ð° Ð·Ð°ÑÐ²ÐºÐ° Ð·Ð° Ð´Ð¾ÑÑ‚ÑŠÐ¿ ÐºÐ°Ñ‚Ð¾ ÐºÐ»Ð¸ÐµÐ½Ñ‚ ÐºÑŠÐ¼
        <strong>${serviceCompanyName}</strong> Ð±ÐµÑˆÐµ Ð¾Ð´Ð¾Ð±Ñ€ÐµÐ½Ð°.
      </p>
      <p>Ð’ÐµÑ‡Ðµ Ð¼Ð¾Ð¶ÐµÑ‚Ðµ Ð´Ð° Ð²Ð»ÐµÐ·ÐµÑ‚Ðµ Ð² ÑÐ¸ÑÑ‚ÐµÐ¼Ð°Ñ‚Ð° Ð¸ Ð´Ð° Ð¸Ð·Ð¿Ð¾Ð»Ð·Ð²Ð°Ñ‚Ðµ ÐºÐ»Ð¸ÐµÐ½Ñ‚ÑÐºÐ¸Ñ ÑÐ¸ Ð¿Ñ€Ð¾Ñ„Ð¸Ð».</p>
      <br />
      <p>Ð¡ ÑƒÐ²Ð°Ð¶ÐµÐ½Ð¸Ðµ,<br />Ð•ÐºÐ¸Ð¿ÑŠÑ‚ Ð½Ð° AutoManager</p>
    </div>
  `,

  // ------------------------------------------
  // Mechanic rejected
  // ------------------------------------------
  mechanicRejected: (firstName: string, serviceCompanyName: string) => `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #ef4444;">Ð ÐµÐ³Ð¸ÑÑ‚Ñ€Ð°Ñ†Ð¸ÑÑ‚Ð° Ðµ Ð¾Ñ‚Ñ…Ð²ÑŠÑ€Ð»ÐµÐ½Ð°</h2>
      <p>Ð—Ð´Ñ€Ð°Ð²ÐµÐ¹, ${firstName}!</p>
      <p>
        Ð—Ð° ÑÑŠÐ¶Ð°Ð»ÐµÐ½Ð¸Ðµ, Ð²Ð°ÑˆÐ°Ñ‚Ð° Ð·Ð°ÑÐ²ÐºÐ° Ð·Ð° Ñ€Ð°Ð±Ð¾Ñ‚Ð° Ð²
        <strong>${serviceCompanyName}</strong> Ð±ÐµÑˆÐµ Ð¾Ñ‚Ñ…Ð²ÑŠÑ€Ð»ÐµÐ½Ð°.
      </p>
      <p>ÐœÐ¾Ð»Ñ, ÑÐ²ÑŠÑ€Ð¶ÐµÑ‚Ðµ ÑÐµ Ñ Ð°Ð´Ð¼Ð¸Ð½Ð¸ÑÑ‚Ñ€Ð°Ñ‚Ð¾Ñ€Ð° Ð½Ð° Ð°Ð²Ñ‚Ð¾ÑÐµÑ€Ð²Ð¸Ð·Ð° Ð·Ð° Ð¿Ð¾Ð²ÐµÑ‡Ðµ Ð¸Ð½Ñ„Ð¾Ñ€Ð¼Ð°Ñ†Ð¸Ñ.</p>
      <br />
      <p>Ð¡ ÑƒÐ²Ð°Ð¶ÐµÐ½Ð¸Ðµ,<br />Ð•ÐºÐ¸Ð¿ÑŠÑ‚ Ð½Ð° AutoManager</p>
    </div>
  `,

  // ------------------------------------------
  // Email verification
  // ------------------------------------------
  emailVerification: (verificationLink: string, firstName?: string) => `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #f97316;">ÐŸÐ¾Ñ‚Ð²ÑŠÑ€Ð´ÐµÑ‚Ðµ Ð²Ð°ÑˆÐ¸Ñ Ð¸Ð¼ÐµÐ¹Ð»</h2>
      <p>Ð—Ð´Ñ€Ð°Ð²ÐµÐ¹Ñ‚Ðµ${firstName ? `, ${firstName}` : ''}!</p>
      <p>Ð‘Ð»Ð°Ð³Ð¾Ð´Ð°Ñ€Ð¸Ð¼ Ð²Ð¸ Ð·Ð° Ñ€ÐµÐ³Ð¸ÑÑ‚Ñ€Ð°Ñ†Ð¸ÑÑ‚Ð° Ð² AutoManager!</p>
      <p>
        ÐœÐ¾Ð»Ñ, Ð½Ð°Ñ‚Ð¸ÑÐ½ÐµÑ‚Ðµ Ð±ÑƒÑ‚Ð¾Ð½Ð° Ð¿Ð¾-Ð´Ð¾Ð»Ñƒ, Ð·Ð° Ð´Ð° Ð¿Ð¾Ñ‚Ð²ÑŠÑ€Ð´Ð¸Ñ‚Ðµ Ð²Ð°ÑˆÐ¸Ñ Ð¸Ð¼ÐµÐ¹Ð» Ð°Ð´Ñ€ÐµÑ:
      </p>
      <div style="text-align: center; margin: 30px 0;">
        <a
          href="${verificationLink}"
          style="
            background-color: #f97316;
            color: white;
            padding: 12px 30px;
            text-decoration: none;
            border-radius: 5px;
            display: inline-block;
            font-weight: bold;
          "
        >
          ÐŸÐ¾Ñ‚Ð²ÑŠÑ€Ð´Ð¸ Ð¸Ð¼ÐµÐ¹Ð»
        </a>
      </div>
      <p style="color: #666; font-size: 14px;">
        Ð˜Ð»Ð¸ ÐºÐ¾Ð¿Ð¸Ñ€Ð°Ð¹Ñ‚Ðµ Ñ‚Ð¾Ð·Ð¸ Ð»Ð¸Ð½Ðº Ð² Ð±Ñ€Ð°ÑƒÐ·ÑŠÑ€Ð° ÑÐ¸:
      </p>
      <p style="color: #666; font-size: 12px; word-break: break-all;">
        ${verificationLink}
      </p>
      <br />
      <p>Ð¡ ÑƒÐ²Ð°Ð¶ÐµÐ½Ð¸Ðµ,<br />Ð•ÐºÐ¸Ð¿ÑŠÑ‚ Ð½Ð° AutoManager</p>
    </div>
  `,
};

