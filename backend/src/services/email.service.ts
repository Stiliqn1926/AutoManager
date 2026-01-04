import nodemailer from 'nodemailer';

// ============================================
// EMAIL TRANSPORTER CONFIG
// ============================================
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER, // Gmail адрес
    pass: process.env.EMAIL_PASSWORD, // Gmail App Password
  },
});

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
    await transporter.sendMail({
      from: `"AutoManager" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      html,
      attachments,
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
      <p style="font-size: 18px; color: #f97316;"><strong>Обща сума: ${total.toFixed(2)} лв</strong></p>
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
