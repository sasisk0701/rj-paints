import { COMPANY_DETAILS } from '@/data/paintsData';
import type {
  ApiProduct,
  ApiPurchase,
  ApiSale,
  ApiCustomer,
  ApiSupplier,
} from '@/services/api';

interface PdfColumn {
  label: string;
  width: number;
  align?: 'left' | 'center' | 'right';
}
interface PdfItem {
  cells: string[];
}

interface PdfSummaryRow {
  label: string;
  value: number;
}

interface PdfDocument {
  title: string;
  number: string;
  date: string;
  partyLabel: string;
  party: string;
  address?: string;
  phone?: string;
  gstNumber?: string;
  paymentMode: string;
  gstMode?: string;
  status: string;
  notes?: string | null;
  columns: PdfColumn[];
  items: PdfItem[];
  summary: PdfSummaryRow[];
}

const PAGE_WIDTH = 842;
const PAGE_HEIGHT = 595;
const PURCHASE_PAGE_WIDTH = 1191;
const PURCHASE_PAGE_HEIGHT = 842;
const PAGE_MARGIN = 22;
const TABLE_WIDTH = PAGE_WIDTH - PAGE_MARGIN * 2;
const ITEMS_PER_PAGE = 12;
const currency = (value: number) =>
  `Rs. ${value.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

function ascii(value: unknown) {
  return String(value ?? '')
    .replace(/₹/g, 'Rs. ')
    .replace(/[–—]/g, '-')
    .replace(/[“”]/g, '"')
    .replace(/[‘’]/g, "'")
    .normalize('NFKD')
    .replace(/[^\x20-\x7E]/g, '?');
}

function pdfEscape(value: unknown) {
  return ascii(value).replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)');
}

function safeFileName(value: string) {
  return value.replace(/[^a-zA-Z0-9._-]+/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '') || 'export';
}

function formatDate(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString('en-IN');
}

function displayNumber(value: number) {
  return Number.isFinite(value) ? value.toLocaleString('en-IN', { maximumFractionDigits: 2 }) : '0';
}

function displayAmount(value: number) {
  return Number.isFinite(value)
    ? value.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
    : '0.00';
}

function truncate(value: string, maxCharacters: number) {
  const text = ascii(value);
  if (text.length <= maxCharacters) return text;
  return `${text.slice(0, Math.max(0, maxCharacters - 3))}...`;
}

function renderPage(
  document: PdfDocument,
  pageItems: PdfItem[],
  pageIndex: number,
  isLastPage: boolean,
  pageNumber: number,
  totalPages: number,
  businessName: string
) {
  const commands: string[] = [];
  const text = (x: number, y: number, value: unknown, size = 8, bold = false, align: PdfColumn['align'] = 'left') => {
    const content = ascii(value);
    const estimatedWidth = content.length * size * 0.5;
    const startX = align === 'right' ? x - estimatedWidth : align === 'center' ? x - estimatedWidth / 2 : x;
    commands.push(`BT /${bold ? 'F2' : 'F1'} ${size} Tf ${startX.toFixed(2)} ${y.toFixed(2)} Td (${pdfEscape(content)}) Tj ET`);
  };
  const line = (x1: number, y1: number, x2: number, y2: number, width = 0.55) => {
    commands.push(`${width} w ${x1} ${y1} m ${x2} ${y2} l S`);
  };
  const rect = (x: number, y: number, width: number, height: number, fill?: number) => {
    if (fill !== undefined) commands.push(`${fill} g ${x} ${y} ${width} ${height} re f 0 g`);
    commands.push(`${x} ${y} ${width} ${height} re S`);
  };

  rect(PAGE_MARGIN, 24, TABLE_WIDTH, PAGE_HEIGHT - 48);
  text(34, 556, businessName, 15, true);
  text(34, 540, COMPANY_DETAILS.address, 8);
  text(34, 527, `Phone: ${COMPANY_DETAILS.contactNumbers.join(' / ')}  |  GSTIN: ${COMPANY_DETAILS.gstNumber}`, 7.5);
  text(808, 556, document.title.toUpperCase(), 10, true, 'right');
  text(808, 540, COMPANY_DETAILS.website, 7.5, false, 'right');
  line(34, 516, 808, 516);

  text(34, 499, `${document.title === 'Tax Invoice' ? 'Invoice' : 'PO'} No: ${document.number}`, 8.5, true);
  text(410, 499, `Date: ${formatDate(document.date)}`, 8.5);
  text(808, 499, `Status: ${document.status}`, 8, true, 'right');
  text(34, 483, `${document.partyLabel}: ${document.party}`, 8.5, true);
  text(410, 483, `Payment: ${document.paymentMode}`, 8);
  if (document.gstMode) text(808, 483, `GST Mode: ${document.gstMode}`, 8, false, 'right');
  if (document.address) text(34, 468, `Address: ${truncate(document.address, 100)}`, 7.5);
  if (document.phone) text(34, 455, `Phone: ${document.phone}`, 7.5);
  if (document.gstNumber) text(410, 468, `GSTIN: ${document.gstNumber}`, 7.5);
  if (document.notes?.trim()) text(808, 468, `Notes: ${truncate(document.notes.trim(), 90)}`, 7.5, false, 'right');

  const tableTop = 440;
  const headerHeight = 31;
  const rowHeight = 19;
  const tableLeft = PAGE_MARGIN + 12;
  const tableWidth = TABLE_WIDTH - 24;
  const columnScale = tableWidth / document.columns.reduce((total, column) => total + column.width, 0);
  const widths = document.columns.map((column) => column.width * columnScale);
  const columnStarts = widths.reduce<number[]>((starts, width, index) => {
    starts.push(index === 0 ? tableLeft : starts[index - 1] + widths[index - 1]);
    return starts;
  }, []);

  rect(tableLeft, tableTop - headerHeight, tableWidth, headerHeight, 0.9);
  document.columns.forEach((column, index) => {
    const x = columnStarts[index];
    const maxChars = Math.max(5, Math.floor(widths[index] / 3.3));
    const words = column.label.split(' ');
    const headerLines: string[] = [];
    let currentLine = '';
    words.forEach((word) => {
      if (!currentLine || `${currentLine} ${word}`.length <= maxChars) {
        currentLine = currentLine ? `${currentLine} ${word}` : word;
      } else {
        headerLines.push(currentLine);
        currentLine = word;
      }
    });
    if (currentLine) headerLines.push(currentLine);
    headerLines.slice(0, 3).forEach((value, lineIndex) => {
      text(x + widths[index] / 2, tableTop - 11 - lineIndex * 8, value, 6.1, true, 'center');
    });
  });

  let rowTop = tableTop - headerHeight;
  pageItems.forEach((item) => {
    const rowBottom = rowTop - rowHeight;
    rect(tableLeft, rowBottom, tableWidth, rowHeight);
    item.cells.forEach((value, columnIndex) => {
      const column = document.columns[columnIndex];
      const start = columnStarts[columnIndex];
      const maxChars = Math.max(4, Math.floor((widths[columnIndex] - 8) / 3.3));
      const align = column.align ?? 'left';
      const x = align === 'right' ? start + widths[columnIndex] - 4
        : align === 'center' ? start + widths[columnIndex] / 2
          : start + 4;
      text(x, rowTop - 12, truncate(value, maxChars), 6.4, false, align);
    });
    rowTop = rowBottom;
  });

  let columnX = tableLeft;
  widths.slice(0, -1).forEach((width) => {
    columnX += width;
    line(columnX, rowTop, columnX, tableTop);
  });

  if (isLastPage) {
    const summaryX = 500;
    const summaryWidth = tableLeft + tableWidth - summaryX;
    const summaryY = 66;
    const summaryHeight = 96;
    rect(summaryX, summaryY, summaryWidth, summaryHeight, 0.97);
    document.summary.forEach((row, index) => {
      const y = summaryY + summaryHeight - 14 - index * 12;
      text(summaryX + 10, y, row.label, 7.5, index === document.summary.length - 1);
      text(summaryX + summaryWidth - 10, y, currency(row.value), 7.5, index === document.summary.length - 1, 'right');
    });
  } else {
    text(34, 76, 'Continued on next page', 8, true);
    text(808, 76, `Items ${pageIndex * ITEMS_PER_PAGE + 1}-${pageIndex * ITEMS_PER_PAGE + pageItems.length}`, 8, false, 'right');
  }

  text(808, 40, `Page ${pageNumber} of ${totalPages}`, 7.5, false, 'right');
  return commands.join('\n');
}

function savePdfPages(pageContents: string[], pageWidth: number, pageHeight: number, fileName: string) {
  const pageObjectIds = pageContents.map((_, index) => 5 + index * 2);
  const objects = [
    '<< /Type /Catalog /Pages 2 0 R >>',
    `<< /Type /Pages /Kids [${pageObjectIds.map((id) => `${id} 0 R`).join(' ')}] /Count ${pageObjectIds.length} >>`,
    '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>',
    '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>',
  ];
  const encoder = new TextEncoder();
  pageContents.forEach((content, index) => {
    const pageObjectId = 5 + index * 2;
    objects.push(
      `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${pageWidth} ${pageHeight}] /Resources << /Font << /F1 3 0 R /F2 4 0 R >> >> /Contents ${pageObjectId + 1} 0 R >>`,
      `<< /Length ${encoder.encode(content).length} >>\nstream\n${content}\nendstream`
    );
  });

  let pdf = '%PDF-1.4\n';
  const offsets = [0];
  objects.forEach((object, index) => {
    offsets.push(encoder.encode(pdf).length);
    pdf += `${index + 1} 0 obj\n${object}\nendobj\n`;
  });
  const xrefOffset = encoder.encode(pdf).length;
  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  offsets.slice(1).forEach((offset) => {
    pdf += `${String(offset).padStart(10, '0')} 00000 n \n`;
  });
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`;

  const blob = new Blob([encoder.encode(pdf)], { type: 'application/pdf' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = safeFileName(fileName) + '.pdf';
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function downloadPdf(documents: PdfDocument[], business: string, filePrefix: string) {
  if (!documents.length) throw new Error('There are no records to export');
  const businessName = business.toLowerCase() === 'interiors'
    ? COMPANY_DETAILS.interiorsName
    : COMPANY_DETAILS.name;
  const pageData = documents.flatMap((document) => {
    const descriptionIndex = document.columns.findIndex((column) => column.label === 'Description');
    const items = document.items.length
      ? document.items
      : [{ cells: document.columns.map((_, index) => index === descriptionIndex ? 'No items' : '') }];
    const pages = Array.from(
      { length: Math.ceil(items.length / ITEMS_PER_PAGE) },
      (_, index) => items.slice(index * ITEMS_PER_PAGE, (index + 1) * ITEMS_PER_PAGE)
    );
    return pages.map((pageItems, index) => ({ document, pageItems, pageIndex: index, isLastPage: index === pages.length - 1 }));
  });
  const pageContents = pageData.map((page, index) =>
    renderPage(page.document, page.pageItems, page.pageIndex, page.isLastPage, index + 1, pageData.length, businessName)
  );
  savePdfPages(
    pageContents,
    PAGE_WIDTH,
    PAGE_HEIGHT,
    `${filePrefix}-${business}-${new Date().toISOString().slice(0, 10)}`
  );
}

export function exportSalesToPdf(sales: ApiSale[], customers: ApiCustomer[], business: string) {
  const columns: PdfColumn[] = [
    { label: 'S.No', width: 36, align: 'center' },
    { label: 'HSN', width: 60 },
    { label: 'Description', width: 315 },
    { label: 'Qty', width: 65, align: 'right' },
    { label: 'Rate (Rs.)', width: 90, align: 'right' },
    { label: 'Tax %', width: 65, align: 'right' },
    { label: 'Amount (Rs.)', width: 167, align: 'right' },
  ];
  const documents = sales.map<PdfDocument>((sale) => {
    let subtotal = 0;
    let discount = 0;
    let taxable = 0;
    let gstAmount = 0;
    const items = (sale.items ?? []).map((item, index) => {
      const quantity = Number(item.quantity) || 0;
      const rate = Number(item.sellingPrice) || 0;
      const lineDiscount = Number(item.discount) || 0;
      const lineSubtotal = quantity * rate;
      const lineTaxable = Math.max(0, lineSubtotal - lineDiscount);
      const lineGst = lineTaxable * (Number(item.gstRate) || 0) / 100;
      subtotal += lineSubtotal;
      discount += lineDiscount;
      taxable += lineTaxable;
      gstAmount += lineGst;
      return {
        cells: [
          String(index + 1),
          item.hsn || '-',
          item.productName,
          displayNumber(quantity),
          currency(rate),
          `${displayNumber(Number(item.gstRate) || 0)}%`,
          currency(lineTaxable + lineGst),
        ],
      };
    });
    return {
      title: 'Tax Invoice',
      number: sale.invoiceNumber,
      date: sale.saleDate,
      partyLabel: 'Customer',
      party: sale.customerName,
      address: (() => {
        const customer = customers.find((entry) => entry.id === sale.customerId)
          ?? customers.find((entry) => entry.name === sale.customerName && entry.phone === sale.customerPhone);
        return [customer?.address, customer?.city].filter(Boolean).join(', ');
      })(),
      phone: sale.customerPhone,
      paymentMode: sale.paymentMode,
      gstMode: sale.gstMode ?? 'B2C',
      status: sale.status,
      notes: sale.notes,
      columns,
      items,
      summary: [
        { label: 'Subtotal', value: subtotal },
        { label: 'Discount', value: discount },
        { label: 'Taxable Amount', value: taxable },
        { label: 'GST Amount', value: gstAmount },
        { label: 'Net Amount', value: sale.totalAmount },
      ],
    };
  });
  downloadPdf(documents, business, 'sales');
}

function renderPurchaseInvoicePage(
  purchase: ApiPurchase,
  supplier: ApiSupplier | undefined,
  pageItems: string[][],
  pageIndex: number,
  totalPages: number,
  pageNumber: number,
  businessName: string,
  categoryLabel: string,
  totals: { value: number; inBill: number; cash: number; rebate: number; taxable: number; tax: number; total: number },
  includeTotals: boolean
) {
  const commands: string[] = [];
  const margin = 32;
  const tableWidth = PURCHASE_PAGE_WIDTH - margin * 2;
  const text = (x: number, y: number, value: unknown, size = 9, bold = false, align: PdfColumn['align'] = 'left') => {
    const content = ascii(value);
    const estimatedWidth = content.length * size * 0.5;
    const startX = align === 'right' ? x - estimatedWidth : align === 'center' ? x - estimatedWidth / 2 : x;
    commands.push(`BT /${bold ? 'F2' : 'F1'} ${size} Tf ${startX.toFixed(2)} ${y.toFixed(2)} Td (${pdfEscape(content)}) Tj ET`);
  };
  const line = (x1: number, y1: number, x2: number, y2: number, width = 0.6) => {
    commands.push(`${width} w ${x1} ${y1} m ${x2} ${y2} l S`);
  };
  const rect = (x: number, y: number, width: number, height: number, fill?: number) => {
    if (fill !== undefined) commands.push(`${fill} g ${x} ${y} ${width} ${height} re f 0 g`);
    commands.push(`${x} ${y} ${width} ${height} re S`);
  };

  rect(margin, 28, tableWidth, PURCHASE_PAGE_HEIGHT - 56);
  text(48, 790, businessName, 18, true);
  text(48, 772, COMPANY_DETAILS.address, 10);
  text(48, 756, `Phone: ${COMPANY_DETAILS.contactNumbers.join(' / ')}`, 9);
  text(48, 741, `GSTIN: ${COMPANY_DETAILS.gstNumber}`, 9);

  const infoX = 675;
  text(infoX, 790, 'INVOICE DETAILS', 12, true);
  text(infoX, 770, `Invoice No: ${purchase.poNumber}`, 10);
  text(infoX, 753, `Invoice Date: ${formatDate(purchase.purchaseDate)}`, 10);
  text(infoX, 736, `Category: ${categoryLabel || '-'}`, 10);
  text(infoX, 719, `Payment: ${purchase.paymentMode}  |  Status: ${purchase.status}`, 9);
  line(48, 706, PURCHASE_PAGE_WIDTH - 48, 706);

  const supplierAddress = [supplier?.address, supplier?.city].filter(Boolean).join(', ');
  text(48, 691, 'BILL TO PARTY', 10, true);
  text(48, 674, supplier?.name ?? purchase.supplierName, 11, true);
  text(48, 657, `Supplier Name: ${purchase.supplierContactName || '-'}`, 9);
  text(48, 640, `Address: ${supplierAddress || '-'}`, 9);
  text(48, 623, `Phone: ${supplier?.phone || '-'}`, 9);
  if (supplier?.gstNumber) text(48, 606, `GSTIN: ${supplier.gstNumber}`, 9);

  text(625, 691, 'SHIP TO PARTY', 10, true);
  text(625, 674, businessName, 11, true);
  text(625, 657, `Address: ${COMPANY_DETAILS.address}`, 9);
  text(625, 640, `Phone: ${COMPANY_DETAILS.contactNumbers[0]}`, 9);
  text(625, 623, `GSTIN: ${COMPANY_DETAILS.gstNumber}`, 9);

  const columns = [
    { label: 'Material', width: 112, align: 'left' as const },
    { label: 'Description', width: 202, align: 'left' as const },
    { label: 'Qty', width: 44, align: 'right' as const },
    { label: 'Packs', width: 48, align: 'right' as const },
    { label: 'Volume (kg/lt.M)', width: 72, align: 'left' as const },
    { label: 'Rate (INR / %)', width: 82, align: 'right' as const },
    { label: 'Value', width: 69, align: 'right' as const },
    { label: 'In Bill Disc', width: 79, align: 'right' as const },
    { label: 'Cash Disc', width: 76, align: 'right' as const },
    { label: 'Rebate Disc', width: 78, align: 'right' as const },
    { label: 'Taxable Amount', width: 80, align: 'right' as const },
    { label: 'Tax Amount', width: 72, align: 'right' as const },
    { label: 'Total Amount', width: 81, align: 'right' as const },
  ];
  const columnScale = tableWidth / columns.reduce((sum, column) => sum + column.width, 0);
  const widths = columns.map((column) => column.width * columnScale);
  const starts = widths.reduce<number[]>((result, width, index) => {
    result.push(index === 0 ? margin : result[index - 1] + widths[index - 1]);
    return result;
  }, []);
  const tableTop = 604;
  const headerHeight = 36;
  const rowHeight = 39;
  rect(margin, tableTop - headerHeight, tableWidth, headerHeight, 0.9);
  columns.forEach((column, index) => {
    const maxChars = Math.max(5, Math.floor(widths[index] / 4));
    const label = truncate(column.label, maxChars);
    text(starts[index] + widths[index] / 2, tableTop - 22, label, 7.3, true, 'center');
  });
  let rowTop = tableTop - headerHeight;
  pageItems.forEach((cells) => {
    const rowBottom = rowTop - rowHeight;
    rect(margin, rowBottom, tableWidth, rowHeight);
    cells.forEach((cell, index) => {
      const align = columns[index].align;
      const x = align === 'right' ? starts[index] + widths[index] - 4 : starts[index] + 4;
      cell.split('\n').slice(0, 3).forEach((value, lineIndex) => {
        text(x, rowTop - 11 - lineIndex * 11, truncate(value, Math.max(4, Math.floor((widths[index] - 8) / 4.2))), 7.1, lineIndex === 0, align);
      });
    });
    rowTop = rowBottom;
  });
  let separatorX = margin;
  widths.slice(0, -1).forEach((width) => {
    separatorX += width;
    line(separatorX, rowTop, separatorX, tableTop);
  });

  if (includeTotals) {
    const rows = [
      ['Value', totals.value],
      ['In Bill Discount', totals.inBill],
      ['Cash Discount', totals.cash],
      ['Rebate Discount', totals.rebate],
      ['Taxable Amount', totals.taxable],
      ['Tax Amount', totals.tax],
      ['Total Amount', totals.total],
    ];
    const summaryX = 755;
    const summaryY = 54;
    const summaryWidth = 390;
    const summaryHeight = 116;
    rect(summaryX, summaryY, summaryWidth, summaryHeight, 0.97);
    rows.forEach(([label, value], index) => {
      const y = summaryY + summaryHeight - 15 - index * 14;
      text(summaryX + 10, y, label, 8, index === rows.length - 1);
      text(summaryX + summaryWidth - 10, y, displayAmount(Number(value)), 8, index === rows.length - 1, 'right');
    });
  } else {
    text(48, 87, `Continued - ${purchase.poNumber}`, 9, true);
  }
  text(PURCHASE_PAGE_WIDTH - 48, 40, `Page ${pageNumber} of ${totalPages}`, 8, false, 'right');
  return commands.join('\n');
}

export function exportPurchasesToPdf(
  purchases: ApiPurchase[],
  suppliers: ApiSupplier[],
  products: ApiProduct[],
  business: string
) {
  if (!purchases.length) throw new Error('There are no records to export');
  const businessName = business.toLowerCase() === 'interiors'
    ? COMPANY_DETAILS.interiorsName
    : COMPANY_DETAILS.name;
  const prepared = purchases.map((purchase) => {
    const totals = { value: 0, inBill: 0, cash: 0, rebate: 0, taxable: 0, tax: 0, total: 0 };
    const categories = new Set<string>();
    const items = (purchase.items ?? []).map((item) => {
      const quantity = Number(item.quantity) || 0;
      const rate = Number(item.purchasePrice) || 0;
      const inBillDiscountPercent = Number(item.inBillDiscountPercent) || 0;
      const inBillDiscountAmount = Number(item.inBillDiscountAmount) || 0;
      const inBillDiscount2Percent = Number(item.inBillDiscount2Percent) || 0;
      const inBillDiscount2Amount = Number(item.inBillDiscount2Amount) || 0;
      const cashDiscountPercent = Number(item.cashDiscountPercent) || 0;
      const cashDiscountAmount = Number(item.cashDiscountAmount) || 0;
      const gstRate = Number(item.gstRate) || 0;
      const value = quantity * rate;
      const inBillDiscount = value * inBillDiscountPercent / 100 + inBillDiscountAmount;
      const afterFirstDiscount = Math.max(0, value - inBillDiscount);
      const inBillDiscount2 = afterFirstDiscount * inBillDiscount2Percent / 100 + inBillDiscount2Amount;
      const afterSecondDiscount = Math.max(0, afterFirstDiscount - inBillDiscount2);
      const cashDiscount = afterSecondDiscount * cashDiscountPercent / 100 + cashDiscountAmount;
      const taxable = Math.max(0, afterSecondDiscount - cashDiscount);
      const tax = taxable * gstRate / 100;
      totals.value += value;
      totals.inBill += inBillDiscount;
      totals.rebate += inBillDiscount2;
      totals.cash += cashDiscount;
      totals.taxable += taxable;
      totals.tax += tax;
      totals.total += taxable + tax;
      const product = products.find((entry) => entry.id === item.productId);
      if (product?.categoryName) categories.add(product.categoryName);
      const halfTaxRate = gstRate / 2;
      const formatDiscount = (amount: number, percent: number) => {
        if (amount === 0 && percent === 0) return '0.00';
        return percent > 0
          ? `${displayAmount(amount)} / ${displayAmount(percent)}%`
          : displayAmount(amount);
      };
      return {
        cells: [
          `${item.productName}\nHSN: ${item.hsn || '-'}`,
          `${product?.description?.trim() || item.productName}\nIN: Central GST OP\nIN: State GST OP`,
          displayNumber(quantity),
          displayNumber(item.packs ?? 0),
          item.volume || product?.unit || '-',
          `${displayAmount(rate)}\n${displayAmount(halfTaxRate)}\n${displayAmount(halfTaxRate)}`,
          displayAmount(value),
          formatDiscount(inBillDiscount, inBillDiscountPercent),
          formatDiscount(cashDiscount, cashDiscountPercent),
          formatDiscount(inBillDiscount2, inBillDiscount2Percent),
          displayAmount(taxable),
          displayAmount(tax),
          displayAmount(taxable + tax),
        ],
      };
    });
    return { purchase, totals, items, categoryLabel: [...categories].join(', ') };
  });
  const pages = prepared.flatMap((document) => {
    const rows = document.items.length
      ? document.items
      : [{ cells: Array(13).fill('').map((_, index) => index === 1 ? 'No items' : '') }];
    const chunks = Array.from(
      { length: Math.ceil(rows.length / 10) },
      (_, index) => rows.slice(index * 10, (index + 1) * 10)
    );
    return chunks.map((pageItems, pageIndex) => ({
      ...document,
      pageItems,
      pageIndex,
      isLastPage: pageIndex === chunks.length - 1,
    }));
  });
  const pageContents = pages.map((page, index) => renderPurchaseInvoicePage(
    page.purchase,
    suppliers.find((entry) => entry.id === page.purchase.supplierId),
    page.pageItems.map((item) => item.cells),
    page.pageIndex,
    pages.length,
    index + 1,
    businessName,
    page.categoryLabel,
    page.totals,
    page.isLastPage
  ));
  savePdfPages(
    pageContents,
    PURCHASE_PAGE_WIDTH,
    PURCHASE_PAGE_HEIGHT,
    `purchase-orders-${business}-${new Date().toISOString().replace(/[:.]/g, '-')}`
  );
}
