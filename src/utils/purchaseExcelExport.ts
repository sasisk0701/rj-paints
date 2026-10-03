import type ExcelJS from 'exceljs';
import logo from '@/assets/logo.png';
import styleoLogo from '@/assets/styleoLogo.png';
import { COMPANY_DETAILS } from '@/data/paintsData';
import type { ApiProduct, ApiPurchase, ApiSupplier } from '@/services/api';

const COLUMNS = [
  'HSN',
  'Description',
  'Qty',
  'Volume / Unit',
  'Rate (INR)',
  'Cash Disc (%)',
  'Cash Disc (INR)',
  'Taxable Amount',
  'Tax Rate (%)',
  'Tax Amount',
  'Total Amount',
];

const currencyFormat = '"₹"#,##0.00';
const headerFill: ExcelJS.Fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF17365D' } };
const sectionFill: ExcelJS.Fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFD9EAF7' } };
const border: Partial<ExcelJS.Borders> = {
  top: { style: 'thin', color: { argb: 'FFB7C9D6' } },
  left: { style: 'thin', color: { argb: 'FFB7C9D6' } },
  bottom: { style: 'thin', color: { argb: 'FFB7C9D6' } },
  right: { style: 'thin', color: { argb: 'FFB7C9D6' } },
};

function safeSheetName(value: string, existing: Set<string>) {
  const base = (value.replace(/[\\/*?:[\]]/g, '-').trim() || 'Purchase').slice(0, 31);
  let candidate = base;
  let suffix = 1;
  while (existing.has(candidate.toLowerCase())) {
    const ending = `-${suffix++}`;
    candidate = `${base.slice(0, 31 - ending.length)}${ending}`;
  }
  existing.add(candidate.toLowerCase());
  return candidate;
}

function loadImageAsBase64(path: string): Promise<string> {
  return fetch(path)
    .then((response) => {
      if (!response.ok) throw new Error('Could not load the company logo for the purchase workbook');
      return response.blob();
    })
    .then((blob) => new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result));
      reader.onerror = () => reject(reader.error || new Error('Could not read the company logo'));
      reader.readAsDataURL(blob);
    }));
}

function formatDate(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString('en-IN');
}

function styleMergedRow(
  sheet: ExcelJS.Worksheet,
  row: number,
  startColumn: number,
  endColumn: number,
  value: string,
  fill?: ExcelJS.Fill,
  bold = false
) {
  sheet.mergeCells(row, startColumn, row, endColumn);
  const cell = sheet.getCell(row, startColumn);
  cell.value = value;
  cell.font = { name: 'Arial', size: 10, bold, color: { argb: 'FF1F2937' } };
  cell.alignment = { vertical: 'middle', wrapText: true };
  cell.border = border;
  if (fill) cell.fill = fill;
  sheet.getRow(row).height = 22;
}

function addPurchaseWorksheet(
  workbook: ExcelJS.Workbook,
  purchase: ApiPurchase,
  suppliers: ApiSupplier[],
  products: ApiProduct[],
  companyLogo: string,
  usedSheetNames: Set<string>
) {
  const sheet = workbook.addWorksheet(safeSheetName(purchase.poNumber, usedSheetNames));
  sheet.columns = [
    { width: 13 }, { width: 30 }, { width: 10 }, { width: 15 }, { width: 15 },
    { width: 14 }, { width: 16 }, { width: 17 }, { width: 13 }, { width: 16 }, { width: 17 },
  ];
  sheet.views = [{ state: 'frozen', ySplit: 15 }];
  sheet.pageSetup = { orientation: 'landscape', fitToPage: true, fitToWidth: 1, fitToHeight: 0, paperSize: 9 };

  const businessName = purchase.business.toLowerCase() === 'interiors'
    ? COMPANY_DETAILS.interiorsName
    : COMPANY_DETAILS.name;
  const imageId = workbook.addImage({ base64: companyLogo, extension: 'png' });
  sheet.addImage(imageId, 'A1:B4');
  styleMergedRow(sheet, 1, 3, 11, businessName, undefined, true);
  sheet.getCell('C1').font = { name: 'Arial', size: 18, bold: true, color: { argb: 'FF17365D' } };
  styleMergedRow(sheet, 2, 3, 11, COMPANY_DETAILS.address);
  styleMergedRow(sheet, 3, 3, 11, `Phone: ${COMPANY_DETAILS.contactNumbers.join(' / ')}  |  Email: ${COMPANY_DETAILS.email}`);
  styleMergedRow(sheet, 4, 3, 11, `GSTIN: ${COMPANY_DETAILS.gstNumber}  |  ${COMPANY_DETAILS.website}`);
  styleMergedRow(sheet, 5, 1, 11, 'PURCHASE ORDER', headerFill, true);
  sheet.getCell('A5').font = { name: 'Arial', size: 14, bold: true, color: { argb: 'FFFFFFFF' } };
  sheet.getCell('A5').alignment = { horizontal: 'center', vertical: 'middle' };
  sheet.getRow(5).height = 28;

  styleMergedRow(sheet, 7, 1, 5, 'BILL TO PARTY', sectionFill, true);
  styleMergedRow(sheet, 7, 6, 11, 'SHIP TO PARTY', sectionFill, true);
  styleMergedRow(sheet, 8, 1, 5, businessName, undefined, true);
  styleMergedRow(sheet, 8, 6, 11, businessName, undefined, true);
  styleMergedRow(sheet, 9, 1, 5, COMPANY_DETAILS.address);
  styleMergedRow(sheet, 9, 6, 11, COMPANY_DETAILS.address);
  styleMergedRow(sheet, 10, 1, 5, `Phone: ${COMPANY_DETAILS.contactNumbers.join(' / ')}`);
  styleMergedRow(sheet, 10, 6, 11, `Phone: ${COMPANY_DETAILS.contactNumbers.join(' / ')}`);
  styleMergedRow(sheet, 11, 1, 5, `GSTIN: ${COMPANY_DETAILS.gstNumber}`);
  styleMergedRow(sheet, 11, 6, 11, `GSTIN: ${COMPANY_DETAILS.gstNumber}`);

  const supplier = suppliers.find((item) => item.id === purchase.supplierId);
  styleMergedRow(sheet, 13, 1, 5, `Supplier / Vendor: ${supplier?.name ?? purchase.supplierName}`, sectionFill, true);
  styleMergedRow(sheet, 13, 6, 11, `PO Number: ${purchase.poNumber}  |  HSN Code: ${purchase.hsn || '—'}`, sectionFill, true);
  styleMergedRow(sheet, 14, 1, 5, `Address: ${[supplier?.address, supplier?.city].filter(Boolean).join(', ') || '—'}`);
  styleMergedRow(sheet, 14, 6, 11, `Purchase Date: ${formatDate(purchase.purchaseDate)}`);
  styleMergedRow(sheet, 15, 1, 5, `Supplier GSTIN: ${supplier?.gstNumber ?? '—'}`);
  styleMergedRow(sheet, 15, 6, 11, `Payment Mode: ${purchase.paymentMode}  |  Status: ${purchase.status}  |  Stock Received: ${purchase.received ? 'Yes' : 'No'}`);
  styleMergedRow(sheet, 16, 1, 5, `Supplier Phone: ${supplier?.phone ?? '—'}`);
  styleMergedRow(sheet, 16, 6, 11, `Terms of Payment: ${purchase.paymentMode}`);
  styleMergedRow(sheet, 17, 1, 11, `Remarks: ${purchase.notes?.trim() || '—'}`);

  const headerRow = 19;
  const header = sheet.getRow(headerRow);
  header.values = [undefined, ...COLUMNS];
  header.height = 34;
  header.eachCell((cell) => {
    cell.fill = headerFill;
    cell.font = { name: 'Arial', size: 9, bold: true, color: { argb: 'FFFFFFFF' } };
    cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
    cell.border = border;
  });

  let taxableTotal = 0;
  let cashDiscountTotal = 0;
  let taxTotal = 0;
  const items = purchase.items ?? [];
  items.forEach((item, index) => {
    const quantity = Number(item.quantity) || 0;
    const rate = Number(item.purchasePrice) || 0;
    const discountPercent = Number(item.cashDiscountPercent) || 0;
    const gross = quantity * rate;
    const cashDiscount = gross * discountPercent / 100;
    const taxable = gross - cashDiscount;
    const tax = taxable * (Number(item.gstRate) || 0) / 100;
    const product = products.find((entry) => entry.id === item.productId);
    const row = sheet.getRow(headerRow + index + 1);
    row.values = [
      undefined,
      item.hsn || '—',
      item.productName,
      quantity,
      product?.unit || '—',
      rate,
      discountPercent,
      cashDiscount,
      taxable,
      Number(item.gstRate) || 0,
      tax,
      taxable + tax,
    ];
    row.eachCell((cell, column) => {
      cell.font = { name: 'Arial', size: 9, color: { argb: 'FF1F2937' } };
      cell.border = border;
      cell.alignment = { vertical: 'middle', wrapText: column === 2 };
      if ([5, 7, 8, 10, 11].includes(column)) cell.numFmt = currencyFormat;
      if (column === 3) cell.numFmt = '0.##';
      if (column === 6 || column === 9) {
        cell.numFmt = '0.##"%"';
      }
      if ([3, 4, 6, 9].includes(column)) {
        cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
      }
    });
    taxableTotal += taxable;
    cashDiscountTotal += cashDiscount;
    taxTotal += tax;
  });

  const summaryStart = headerRow + Math.max(items.length, 1) + 2;
  const summaryRows = [
    ['Gross Value', cashDiscountTotal + taxableTotal],
    ['Cash Discount', cashDiscountTotal],
    ['Taxable Amount', taxableTotal],
    ['Tax Amount', taxTotal],
    ['Grand Total', taxableTotal + taxTotal],
  ];
  summaryRows.forEach(([label, value], index) => {
    const rowNumber = summaryStart + index;
    sheet.mergeCells(rowNumber, 8, rowNumber, 10);
    sheet.getCell(rowNumber, 8).value = label;
    sheet.getCell(rowNumber, 11).value = value as number;
    sheet.getCell(rowNumber, 11).numFmt = currencyFormat;
    for (let column = 8; column <= 11; column += 1) {
      const cell = sheet.getCell(rowNumber, column);
      cell.border = border;
      cell.font = { name: 'Arial', size: 10, bold: index === summaryRows.length - 1 };
      if (index === summaryRows.length - 1) cell.fill = sectionFill;
    }
  });

  sheet.autoFilter = {
    from: { row: headerRow, column: 1 },
    to: { row: headerRow + Math.max(items.length, 1), column: COLUMNS.length },
  };
  sheet.pageSetup.printArea = `A1:K${summaryStart + summaryRows.length - 1}`;
}

export async function exportPurchasesToExcel(
  purchases: ApiPurchase[],
  suppliers: ApiSupplier[],
  products: ApiProduct[],
  business: string
) {
  const ExcelJS = (await import('exceljs')).default;
  const workbook = new ExcelJS.Workbook();
  workbook.creator = COMPANY_DETAILS.name;
  workbook.subject = 'Purchase records';
  workbook.title = `Purchases - ${business}`;
  workbook.created = new Date();

  const companyLogo = await loadImageAsBase64(business.toLowerCase() === 'interiors' ? styleoLogo : logo);
  const usedSheetNames = new Set<string>();
  purchases.forEach((purchase) => addPurchaseWorksheet(
    workbook,
    purchase,
    suppliers,
    products,
    companyLogo,
    usedSheetNames
  ));

  const content = await workbook.xlsx.writeBuffer();
  const blob = new Blob([content as BlobPart], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = `purchases-${business}-${new Date().toISOString().slice(0, 10)}.xlsx`;
  anchor.click();
  URL.revokeObjectURL(url);
}
