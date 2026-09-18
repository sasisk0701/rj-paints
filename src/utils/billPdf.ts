export interface ShopBillBusiness {
  name: string;
  address?: string;
  phone?: string;
  email?: string;
  gstNumber?: string;
  website?: string;
  proprietor?: string;
}

export interface ShopBillLineItem {
  description: string;
  quantity?: number | string;
  rate?: number | string;
  amount: number | string;
}

export interface BillPdfOptions {
  title: string;
  billNumber: string;
  date: string;
  business: ShopBillBusiness;
  partyLabel?: string;
  partyName?: string;
  paymentMode?: string;
  reference?: string;
  notes?: string;
  items: ShopBillLineItem[];
  totalAmount: number;
  footerNote?: string;
  terms?: string;
  fileName?: string;
}

const toAscii = (value: unknown): string =>
  String(value ?? '')
    .replace(/₹/g, 'Rs. ')
    .replace(/[–—]/g, '-')
    .replace(/[“”]/g, '"')
    .replace(/[‘’]/g, "'")
    .normalize('NFKD')
    .replace(/[^\x20-\x7E]/g, '?');

const pdfEscape = (value: unknown) =>
  toAscii(value).replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)');

const safeFileName = (value: string) =>
  value.replace(/[^a-zA-Z0-9._-]+/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '') || 'bill';

const formatMoney = (value: number | string): string => {
  const parsed = typeof value === 'number' ? value : Number(String(value).replace(/[^0-9.-]/g, ''));
  if (!Number.isFinite(parsed)) return toAscii(value);
  return `Rs. ${parsed.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

const splitText = (value: unknown, maxChars: number): string[] => {
  const text = toAscii(value).trim();
  if (!text) return [''];
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let current = '';

  for (const word of words) {
    if (!current) {
      current = word;
      continue;
    }
    if (`${current} ${word}`.length <= maxChars) {
      current += ` ${word}`;
    } else {
      lines.push(current);
      current = word;
    }
  }
  if (current) lines.push(current);
  return lines.flatMap((line) => line.length <= maxChars
    ? [line]
    : line.match(new RegExp(`.{1,${maxChars}}`, 'g')) ?? [line]);
};

const ONES = [
  '', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten',
  'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen',
];
const TENS = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

const belowThousandToWords = (value: number): string => {
  let n = Math.floor(value);
  const parts: string[] = [];
  if (n >= 100) {
    parts.push(`${ONES[Math.floor(n / 100)]} Hundred`);
    n %= 100;
  }
  if (n >= 20) {
    parts.push(TENS[Math.floor(n / 10)]);
    n %= 10;
  }
  if (n > 0) parts.push(ONES[n]);
  return parts.join(' ');
};

const numberToIndianWords = (value: number): string => {
  const n = Math.floor(Math.abs(value));
  if (n === 0) return 'Zero';
  const parts: string[] = [];
  const groups: Array<[number, string]> = [
    [10000000, 'Crore'],
    [100000, 'Lakh'],
    [1000, 'Thousand'],
  ];
  let remaining = n;
  for (const [divisor, label] of groups) {
    const group = Math.floor(remaining / divisor);
    if (group > 0) {
      parts.push(`${belowThousandToWords(group)} ${label}`);
      remaining %= divisor;
    }
  }
  if (remaining > 0) parts.push(belowThousandToWords(remaining));
  return parts.join(' ');
};

const amountInWords = (value: number): string => {
  const safe = Number.isFinite(value) ? Math.abs(value) : 0;
  const rupees = Math.floor(safe);
  const paise = Math.round((safe - rupees) * 100);
  const paiseText = paise > 0 ? ` and ${numberToIndianWords(paise)} Paise` : '';
  return `Rupees ${numberToIndianWords(rupees)}${paiseText} Only`;
};

/**
 * Generates a clean A4 shop-style bill / receipt without a PDF dependency.
 * Company details come from the application's Settings screen and transaction
 * data is rendered as a proper bill with borders, particulars and totals.
 */
export function downloadBillPdf(options: BillPdfOptions) {
  const allItems = options.items.length > 0
    ? options.items
    : [{ description: 'Transaction', amount: options.totalAmount }];
  const itemsPerPage = 4;
  const pages = Array.from(
    { length: Math.max(1, Math.ceil(allItems.length / itemsPerPage)) },
    (_, pageIndex) => allItems.slice(pageIndex * itemsPerPage, (pageIndex + 1) * itemsPerPage)
  );

  const renderPage = (pageItems: ShopBillLineItem[], pageIndex: number): string => {
    const commands: string[] = [];
    const isLastPage = pageIndex === pages.length - 1;

    const text = (x: number, y: number, value: unknown, size = 10, bold = false) => {
      commands.push(`BT /${bold ? 'F2' : 'F1'} ${size} Tf ${x} ${y} Td (${pdfEscape(value)}) Tj ET`);
    };
    const line = (x1: number, y1: number, x2: number, y2: number, width = 0.7) => {
      commands.push(`${width} w ${x1} ${y1} m ${x2} ${y2} l S`);
    };
    const rect = (x: number, y: number, w: number, h: number, fillGray?: number, stroke = true) => {
      if (fillGray !== undefined) commands.push(`${fillGray} g ${x} ${y} ${w} ${h} re f 0 g`);
      if (stroke) commands.push(`${x} ${y} ${w} ${h} re S`);
    };
    const rightText = (rightX: number, y: number, value: unknown, size = 10, bold = false) => {
      const raw = toAscii(value);
      const estimatedWidth = raw.length * size * 0.50;
      text(Math.max(48, rightX - estimatedWidth), y, raw, size, bold);
    };

    // Outer bill border.
    rect(36, 46, 523, 750, undefined, true);

    // Header / shop identity.
    rect(36, 706, 523, 90, 0.96, true);
    text(52, 770, options.business.name || 'RJ PAINTS & STYLEO INTERIORS', 18, true);
    let headerY = 753;
    for (const addressLine of splitText(options.business.address || '', 76).slice(0, 2)) {
      if (addressLine) text(52, headerY, addressLine, 8.5);
      headerY -= 12;
    }
    const contact = [
      options.business.phone ? `Phone: ${options.business.phone}` : '',
      options.business.email ? `Email: ${options.business.email}` : '',
    ].filter(Boolean).join('   |   ');
    if (contact) text(52, headerY, contact, 8.2);
    if (options.business.gstNumber) text(52, headerY - 13, `GSTIN: ${options.business.gstNumber}`, 8.5, true);

    rightText(543, 770, options.title.toUpperCase(), 10, true);
    if (options.business.website) rightText(543, 748, options.business.website, 8.2);

    // Bill metadata.
    rect(36, 642, 523, 64, undefined, true);
    line(298, 642, 298, 706);
    text(50, 686, 'Bill / Ref No.', 8.5, true);
    text(135, 686, options.billNumber, 10.5, true);
    text(50, 662, 'Date', 8.5, true);
    text(135, 662, options.date, 10);
    text(312, 686, options.partyLabel || 'Party', 8.5, true);
    text(385, 686, options.partyName || '-', 10, true);
    text(312, 662, 'Payment Mode', 8.5, true);
    text(385, 662, options.paymentMode || '-', 10);

    // Particulars table.
    const tableTop = 622;
    const tableLeft = 50;
    const tableWidth = 495;
    const colX = [50, 82, 354, 400, 466, 545];
    const headerHeight = 26;
    const rowHeight = 42;
    rect(tableLeft, tableTop - headerHeight, tableWidth, headerHeight, 0.92, true);
    ['#', 'PARTICULARS', 'QTY', 'RATE', 'AMOUNT'].forEach((label, index) => {
      text(colX[index] + (index === 0 ? 10 : 7), tableTop - 17, label, 8.5, true);
    });
    for (let i = 1; i < colX.length - 1; i += 1) line(colX[i], tableTop - headerHeight, colX[i], tableTop);

    let rowTop = tableTop - headerHeight;
    pageItems.forEach((item, index) => {
      const rowBottom = rowTop - rowHeight;
      rect(tableLeft, rowBottom, tableWidth, rowHeight, undefined, true);
      for (let i = 1; i < colX.length - 1; i += 1) line(colX[i], rowBottom, colX[i], rowTop);

      const absoluteIndex = pageIndex * itemsPerPage + index + 1;
      text(62, rowTop - 17, absoluteIndex, 9);
      const descriptions = splitText(item.description, 43).slice(0, 2);
      descriptions.forEach((desc, lineIndex) => text(90, rowTop - 15 - lineIndex * 13, desc, 9));
      text(365, rowTop - 17, item.quantity ?? 1, 9);
      rightText(456, rowTop - 17, item.rate !== undefined ? formatMoney(item.rate) : '-', 8.5);
      rightText(536, rowTop - 17, formatMoney(item.amount), 9, true);
      rowTop = rowBottom;
    });

    // Keep a consistent printed bill layout by filling unused rows.
    while (rowTop > 404) {
      const fillerHeight = Math.min(30, rowTop - 404);
      const rowBottom = rowTop - fillerHeight;
      rect(tableLeft, rowBottom, tableWidth, fillerHeight, undefined, true);
      for (let i = 1; i < colX.length - 1; i += 1) line(colX[i], rowBottom, colX[i], rowTop);
      rowTop = rowBottom;
    }

    if (isLastPage) {
      // Total section is shown once on the final page so multi-record bills remain one logical bill.
      rect(50, 342, 495, 62, 0.97, true);
      text(64, 380, 'Amount in Words', 8.5, true);
      const words = splitText(amountInWords(options.totalAmount), 58).slice(0, 2);
      words.forEach((value, index) => text(64, 365 - index * 13, value, 9));
      line(350, 342, 350, 404);
      text(366, 380, 'GRAND TOTAL', 10, true);
      rightText(533, 357, formatMoney(options.totalAmount), 14, true);

      // Reference / notes box.
      rect(50, 257, 495, 70, undefined, true);
      text(64, 308, 'Payment / Transaction Details', 9, true);
      if (options.reference) text(64, 290, `Reference: ${options.reference}`, 8.5);
      const noteLines = splitText(options.notes || '-', 80).slice(0, 2);
      noteLines.forEach((value, index) => text(64, 274 - index * 12, `Note${index ? '' : 's'}: ${value}`, 8.5));

      // Terms + signature.
      rect(50, 126, 495, 116, undefined, true);
      text(64, 222, 'Terms / Note', 9, true);
      const footer = options.footerNote || 'Thank you for your business.';
      splitText(footer, 70).slice(0, 2).forEach((value, index) => text(64, 204 - index * 12, value, 8.2));
      if (options.terms) {
        splitText(options.terms, 70).slice(0, 2).forEach((value, index) => text(64, 174 - index * 12, value, 8.2));
      }
      line(362, 126, 362, 242);
      text(382, 216, `For ${options.business.name || 'Business'}`, 8.5, true);
      text(406, 150, 'Authorised Signatory', 8.5, true);
      line(390, 163, 525, 163, 0.5);
    } else {
      rect(50, 342, 495, 62, 0.97, true);
      text(64, 372, 'Continued on next page', 10, true);
      rightText(531, 372, `Items ${pageIndex * itemsPerPage + 1}-${pageIndex * itemsPerPage + pageItems.length}`, 8.5);
      rect(50, 126, 495, 201, undefined, true);
      text(64, 300, 'This is a continuation page of the same combined bill.', 9);
    }

    text(50, 90, 'Computer generated bill / receipt.', 7.5);
    if (options.business.proprietor) text(50, 76, `Proprietor: ${options.business.proprietor}`, 7.5);
    rightText(545, 90, `Page ${pageIndex + 1} of ${pages.length}`, 7.5, true);
    rightText(545, 76, 'Thank You!', 8.5, true);

    return commands.join('\n');
  };

  const pageContents = pages.map((pageItems, pageIndex) => renderPage(pageItems, pageIndex));

  // PDF object layout: 1 Catalog, 2 Pages, 3/4 Fonts, then Page/Content pairs.
  const pageObjectIds = pageContents.map((_, index) => 5 + index * 2);
  const objects: string[] = [
    '<< /Type /Catalog /Pages 2 0 R >>',
    `<< /Type /Pages /Kids [${pageObjectIds.map((id) => `${id} 0 R`).join(' ')}] /Count ${pageObjectIds.length} >>`,
    '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>',
    '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>',
  ];

  const encoder = new TextEncoder();
  pageContents.forEach((content, pageIndex) => {
    const pageObjectId = 5 + pageIndex * 2;
    const contentObjectId = pageObjectId + 1;
    objects.push(
      `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 3 0 R /F2 4 0 R >> >> /Contents ${contentObjectId} 0 R >>`
    );
    objects.push(`<< /Length ${encoder.encode(content).length} >>\nstream\n${content}\nendstream`);
  });

  let pdf = '%PDF-1.4\n';
  const offsets: number[] = [0];

  objects.forEach((object, index) => {
    offsets.push(encoder.encode(pdf).length);
    pdf += `${index + 1} 0 obj\n${object}\nendobj\n`;
  });

  const xrefOffset = encoder.encode(pdf).length;
  pdf += `xref\n0 ${objects.length + 1}\n`;
  pdf += '0000000000 65535 f \n';
  for (let i = 1; i <= objects.length; i += 1) {
    pdf += `${String(offsets[i]).padStart(10, '0')} 00000 n \n`;
  }
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`;

  const blob = new Blob([encoder.encode(pdf)], { type: 'application/pdf' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = `${safeFileName(options.fileName || options.billNumber || 'bill')}.pdf`;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
