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
      <h2 style="color: #f97316;">Поръчката е готова!</h2>
      <p>Здравейте,</p>
      <p>
        Вашата поръчка <strong>${orderNumber}</strong> за
        <strong>${vehicleInfo}</strong> е готова за плащане.
      </p>
      <p>Моля, посетете автосервиза, за да получите автомобила си.</p>
      <br />
      <p>С уважение,<br />Екипът на AutoManager</p>
    </div>
  `,

  // ------------------------------------------
  // Order completed
  // ------------------------------------------
  orderCompleted: (orderNumber: string, vehicleInfo: string) => `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #10b981;">Поръчката е завършена!</h2>
      <p>Здравейте,</p>
      <p>
        Вашата поръчка <strong>${orderNumber}</strong> за
        <strong>${vehicleInfo}</strong> е завършена и платена.
      </p>
      <p>Благодарим ви, че използвате нашите услуги!</p>
      <br />
      <p>С уважение,<br />Екипът на AutoManager</p>
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
      <h2 style="color: #3b82f6;">Фактурата е готова!</h2>
      <p>Здравейте,</p>
      <p>
        Фактура <strong>${invoiceNumber}</strong> за поръчка
        <strong>${orderNumber}</strong> е готова.
      </p>
      <p style="font-size: 18px; color: #f97316;"><strong>Обща сума: ${total.toFixed(2)} €</strong></p>
      <p>📎 Фактурата е прикачена към този имейл като PDF файл.</p>
      <p>Моля, платете фактурата при получаване на автомобила.</p>
      <br />
      <p>С уважение,<br />Екипът на AutoManager</p>
    </div>
  `,

  // ------------------------------------------
  // Mechanic approved
  // ------------------------------------------
  mechanicApproved: (firstName: string, serviceCompanyName: string) => `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #10b981;">Регистрацията е одобрена!</h2>
      <p>Здравей, ${firstName}!</p>
      <p>
        Вашата заявка за работа в
        <strong>${serviceCompanyName}</strong> беше одобрена!
      </p>
      <p>Сега можете да влезете в системата и да започнете работа.</p>
      <br />
      <p>Успех!<br />Екипът на AutoManager</p>
    </div>
  `,

  // ------------------------------------------
  // Client approved
  // ------------------------------------------
  clientApproved: (firstName: string, serviceCompanyName: string) => `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #10b981;">Профилът ви е одобрен!</h2>
      <p>Здравей, ${firstName}!</p>
      <p>
        Вашата заявка за достъп като клиент към
        <strong>${serviceCompanyName}</strong> беше одобрена.
      </p>
      <p>Вече можете да влезете в системата и да използвате клиентския си профил.</p>
      <br />
      <p>С уважение,<br />Екипът на AutoManager</p>
    </div>
  `,

  // ------------------------------------------
  // Mechanic rejected
  // ------------------------------------------
  mechanicRejected: (firstName: string, serviceCompanyName: string) => `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #ef4444;">Регистрацията е отхвърлена</h2>
      <p>Здравей, ${firstName}!</p>
      <p>
        За съжаление, вашата заявка за работа в
        <strong>${serviceCompanyName}</strong> беше отхвърлена.
      </p>
      <p>Моля, свържете се с администратора на автосервиза за повече информация.</p>
      <br />
      <p>С уважение,<br />Екипът на AutoManager</p>
    </div>
  `,

  // ------------------------------------------
  // Email verification
  // ------------------------------------------
  emailVerification: (verificationLink: string, firstName?: string) => `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #f97316;">Потвърдете вашия имейл</h2>
      <p>Здравейте${firstName ? `, ${firstName}` : ''}!</p>
      <p>Благодарим ви за регистрацията в AutoManager!</p>
      <p>
        Моля, натиснете бутона по-долу, за да потвърдите вашия имейл адрес:
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
          Потвърди имейл
        </a>
      </div>
      <p style="color: #666; font-size: 14px;">
        Или копирайте този линк в браузъра си:
      </p>
      <p style="color: #666; font-size: 12px; word-break: break-all;">
        ${verificationLink}
      </p>
      <br />
      <p>С уважение,<br />Екипът на AutoManager</p>
    </div>
  `,
};
