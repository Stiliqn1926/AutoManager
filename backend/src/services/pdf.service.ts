import PDFDocument from 'pdfkit';
import fs from 'fs';
import path from 'path';

interface OrderItem {
  type: string;
  name: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

interface InvoiceData {
  orderNumber: string;
  invoiceNumber: string;
  issueDate: Date;
  clientName: string;
  clientPhone: string;
  clientEmail: string;
  vehicleInfo: string;
  orderItems: OrderItem[];
  totalPrice: number;
  serviceCompanyName: string;
  serviceCompanyAddress: string;
  serviceCompanyPhone: string;
  serviceCompanyEmail: string;
}

export const generateInvoicePDF = async (
  data: InvoiceData,
  outputPath: string
): Promise<void> => {
  return new Promise((resolve, reject) => {
    try {
      // Регистрираме шрифт който поддържа кирилица (DejaVu Sans)
      const fontPath = path.join(__dirname, '../../fonts/DejaVuSans.ttf');
      const fontBoldPath = path.join(__dirname, '../../fonts/DejaVuSans-Bold.ttf');

      const doc = new PDFDocument({ margin: 50 });
      const stream = fs.createWriteStream(outputPath);

      doc.pipe(stream);

      // Регистрираме шрифтовете
      doc.registerFont('DejaVu', fontPath);
      doc.registerFont('DejaVu-Bold', fontBoldPath);

      // Използваме DejaVu шрифт за кирилица
      doc.font('DejaVu-Bold');

      // Header
      doc.fontSize(20).text('ФАКТУРА', { align: 'center' });
      doc.moveDown();

      // Invoice Info
      doc.font('DejaVu').fontSize(10);
      doc.text(`Фактура №: ${data.invoiceNumber}`, { align: 'right' });
      doc.text(`Поръчка №: ${data.orderNumber}`, { align: 'right' });
      doc.text(`Дата: ${data.issueDate.toLocaleDateString('bg-BG')}`, { align: 'right' });
      doc.moveDown();

      // Service Company Info
      doc.font('DejaVu-Bold').fontSize(12).text('От:', { underline: true });
      doc.font('DejaVu').fontSize(10);
      doc.text(data.serviceCompanyName);
      doc.text(data.serviceCompanyAddress);
      doc.text(`Телефон: ${data.serviceCompanyPhone}`);
      doc.text(`Email: ${data.serviceCompanyEmail}`);
      doc.moveDown();

      // Client Info
      doc.font('DejaVu-Bold').fontSize(12).text('За:', { underline: true });
      doc.font('DejaVu').fontSize(10);
      doc.text(data.clientName);
      doc.text(`Телефон: ${data.clientPhone}`);
      doc.text(`Email: ${data.clientEmail}`);
      doc.text(`Автомобил: ${data.vehicleInfo}`);
      doc.moveDown(2);

      // Table Header
      const tableTop = doc.y;
      doc.fontSize(10).font('DejaVu-Bold');

      doc.text('Описание', 50, tableTop, { width: 200 });
      doc.text('Кол.', 260, tableTop, { width: 50, align: 'right' });
      doc.text('Ед. цена', 320, tableTop, { width: 80, align: 'right' });
      doc.text('Общо', 410, tableTop, { width: 100, align: 'right' });

      doc.moveTo(50, tableTop + 15).lineTo(550, tableTop + 15).stroke();

      // Table Rows
      doc.font('DejaVu');
      let y = tableTop + 25;

      data.orderItems.forEach((item) => {
        const itemType = item.type === 'PART' ? 'Част' : item.type === 'LABOR' ? 'Труд' : 'Консуматив';
        const description = `${item.name} (${itemType})`;

        doc.text(description, 50, y, { width: 200 });
        doc.text(item.quantity.toString(), 260, y, { width: 50, align: 'right' });
        doc.text(`${Number(item.unitPrice).toFixed(2)} €`, 320, y, { width: 80, align: 'right' });
        doc.text(`${Number(item.totalPrice).toFixed(2)} €`, 410, y, { width: 100, align: 'right' });

        y += 25;
      });

      doc.moveTo(50, y).lineTo(550, y).stroke();
      y += 15;

      // Total
      doc.font('DejaVu-Bold').fontSize(12);
      doc.text('ОБЩА СУМА:', 320, y);
      doc.text(`${Number(data.totalPrice).toFixed(2)} €`, 410, y, { width: 100, align: 'right' });

      // Footer
      doc.fontSize(8).font('DejaVu').text(
        'Благодарим Ви за доверието!',
        50,
        doc.page.height - 50,
        { align: 'center' }
      );

      doc.end();

      stream.on('finish', () => resolve());
      stream.on('error', (err) => reject(err));
    } catch (error) {
      reject(error);
    }
  });
};

// Generate unique invoice number
export const generateInvoiceNumber = (): string => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const timestamp = Date.now();
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');

  return `INV-${year}${month}-${timestamp}-${random}`;
};