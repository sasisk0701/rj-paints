import type ExcelJS from 'exceljs';
import logo from '@/assets/logo.png';
import styleoLogo from '@/assets/styleoLogo.png';
import { COMPANY_DETAILS } from '@/data/paintsData';
import type { ApiProduct, ApiPurchase, ApiSupplier } from '@/services/api';

const COLUMNS = [
  'HSN',
  'Description',
  'Qty',
  'Packs',
  'Volume (kg/lt/M)',
  'Rate (INR)',
  'Rate (%)',
  'Value',
  'In Bill Disc (%)',
  'In Bill Disc (INR)',
  'In-Bill Disc - 2 (%)',
  'In-Bill Disc - 2 (INR)',
  'Cash Disc (%)',
  'Cash Disc (INR)',
  'Taxable Amount',
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
  sheet.columns = [12, 30, 9, 9, 18, 14, 10, 15, 14, 16, 15, 17, 13, 16, 17, 15, 17]
    .map((width) => ({ width }));
  sheet.views = [{ state: 'frozen', ySplit: 15 }];
  sheet.pageSetup = { orientation: 'landscape', fitToPage: true, fitToWidth: 1, fitToHeight: 0, paperSize: 9 };

  const businessName = purchase.business.toLowerCase() === 'interiors'
    ? COMPANY_DETAILS.interiorsName
    : COMPANY_DETAILS.name;
  const imageId = workbook.addImage({ base64: companyLogo, extension: 'png' });
  sheet.addImage(imageId, 'A1:B4');
  styleMergedRow(sheet, 1, 3, 17, businessName, undefined, true);
  sheet.getCell('C1').font = { name: 'Arial', size: 18, bold: true, color: { argb: 'FF17365D' } };
  styleMergedRow(sheet, 2, 3, 17, COMPANY_DETAILS.address);
  styleMergedRow(sheet, 3, 3, 17, `Phone: ${COMPANY_DETAILS.contactNumbers.join(' / ')}  |  Email: ${COMPANY_DETAILS.email}`);
  styleMergedRow(sheet, 4, 3, 17, `GSTIN: ${COMPANY_DETAILS.gstNumber}  |  ${COMPANY_DETAILS.website}`);
  styleMergedRow(sheet, 5, 1, 17, 'PURCHASE ORDER', headerFill, true);
  sheet.getCell('A5').font = { name: 'Arial', size: 14, bold: true, color: { argb: 'FFFFFFFF' } };
  sheet.getCell('A5').alignment = { horizontal: 'center', vertical: 'middle' };
  sheet.getRow(5).height = 28;

  styleMergedRow(sheet, 7, 1, 8, 'BILL TO PARTY', sectionFill, true);
  styleMergedRow(sheet, 7, 9, 17, 'SHIP TO PARTY', sectionFill, true);
  styleMergedRow(sheet, 8, 1, 8, businessName, undefined, true);
  styleMergedRow(sheet, 8, 9, 17, businessName, undefined, true);
  styleMergedRow(sheet, 9, 1, 8, COMPANY_DETAILS.address);
  styleMergedRow(sheet, 9, 9, 17, COMPANY_DETAILS.address);
  styleMergedRow(sheet, 10, 1, 8, `Phone: ${COMPANY_DETAILS.contactNumbers.join(' / ')}`);
  styleMergedRow(sheet, 10, 9, 17, `Phone: ${COMPANY_DETAILS.contactNumbers.join(' / ')}`);
  styleMergedRow(sheet, 11, 1, 8, `GSTIN: ${COMPANY_DETAILS.gstNumber}`);
  styleMergedRow(sheet, 11, 9, 17, `GSTIN: ${COMPANY_DETAILS.gstNumber}`);

  const supplier = suppliers.find((item) => item.id === purchase.supplierId);
  styleMergedRow(sheet, 13, 1, 8, `Supplier / Vendor: ${supplier?.name ?? purchase.supplierName}`, sectionFill, true);
  styleMergedRow(sheet, 13, 9, 17, `PO Number: ${purchase.poNumber}  |  HSN Code: ${purchase.hsn || '—'}`, sectionFill, true);
  styleMergedRow(sheet, 14, 1, 8, `Address: ${[supplier?.address, supplier?.city].filter(Boolean).join(', ') || '—'}`);
  styleMergedRow(sheet, 14, 9, 17, `Purchase Date: ${formatDate(purchase.purchaseDate)}`);
  styleMergedRow(sheet, 15, 1, 8, `Supplier GSTIN: ${supplier?.gstNumber ?? '—'}`);
  styleMergedRow(sheet, 15, 9, 17, `Payment Mode: ${purchase.paymentMode}  |  Status: ${purchase.status}  |  Stock Received: ${purchase.received ? 'Yes' : 'No'}`);
  styleMergedRow(sheet, 16, 1, 8, `Supplier Phone: ${supplier?.phone ?? '—'}`);
  styleMergedRow(sheet, 16, 9, 17, `Terms of Payment: ${purchase.paymentMode}`);
  styleMergedRow(sheet, 17, 1, 17, `Remarks: ${purchase.notes?.trim() || '—'}`);

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

  let valueTotal = 0;
  let inBillDiscountTotal = 0;
  let inBillDiscount2Total = 0;
  let taxableTotal = 0;
  let cashDiscountTotal = 0;
  let taxTotal = 0;
  const items = purchase.items ?? [];
  items.forEach((item, index) => {
    const quantity = Number(item.quantity) || 0;
    const rate = Number(item.purchasePrice) || 0;
    const inBillDiscountPercent = Number(item.inBillDiscountPercent) || 0;
    const inBillDiscountAmount = Number(item.inBillDiscountAmount) || 0;
    const inBillDiscount2Percent = Number(item.inBillDiscount2Percent) || 0;
    const inBillDiscount2Amount = Number(item.inBillDiscount2Amount) || 0;
    const cashDiscountPercent = Number(item.cashDiscountPercent) || 0;
    const gstRate = Number(item.gstRate) || 0;
    const value = quantity * rate;
    const inBillDiscount = value * inBillDiscountPercent / 100 + inBillDiscountAmount;
    const afterFirstDiscount = value - inBillDiscount;
    const inBillDiscount2 = afterFirstDiscount * inBillDiscount2Percent / 100 + inBillDiscount2Amount;
    const afterSecondDiscount = afterFirstDiscount - inBillDiscount2;
    const cashDiscount = afterSecondDiscount * cashDiscountPercent / 100;
    const taxable = afterSecondDiscount - cashDiscount;
    const tax = taxable * gstRate / 100;
    const product = products.find((entry) => entry.id === item.productId);
    const row = sheet.getRow(headerRow + index + 1);
    row.values = [
      undefined,
      item.hsn || '—',
      product?.description?.trim() || item.productName,
      quantity,
      item.packs ?? 0,
      item.volume || product?.unit || '—',
      rate,
      gstRate,
      value,
      inBillDiscountPercent,
      inBillDiscount,
      inBillDiscount2Percent,
      inBillDiscount2,
      cashDiscountPercent,
      cashDiscount,
      taxable,
      tax,
      taxable + tax,
    ];
    row.eachCell((cell, column) => {
      cell.font = { name: 'Arial', size: 9, color: { argb: 'FF1F2937' } };
      cell.border = border;
      cell.alignment = { vertical: 'middle', wrapText: column === 2 };
      if ([6, 8, 10, 12, 14, 15, 16, 17].includes(column)) cell.numFmt = currencyFormat;
      if ([3, 4].includes(column)) cell.numFmt = '0.##';
      if ([7, 9, 11, 13].includes(column)) {
        cell.numFmt = '0.##"%"';
      }
      if ([3, 4, 5, 7, 9, 11, 13].includes(column)) {
        cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
      }
    });
    valueTotal += value;
    inBillDiscountTotal += inBillDiscount;
    inBillDiscount2Total += inBillDiscount2;
    taxableTotal += taxable;
    cashDiscountTotal += cashDiscount;
    taxTotal += tax;
  });

  const summaryStart = headerRow + Math.max(items.length, 1) + 2;
  const summaryRows = [
    ['Gross Value', valueTotal],
    ['In-Bill Discount', inBillDiscountTotal],
    ['In-Bill Discount - 2', inBillDiscount2Total],
    ['Cash Discount', cashDiscountTotal],
    ['Taxable Amount', taxableTotal],
    ['Tax Amount', taxTotal],
    ['Grand Total', taxableTotal + taxTotal],
  ];
  summaryRows.forEach(([label, value], index) => {
    const rowNumber = summaryStart + index;
    sheet.mergeCells(rowNumber, 14, rowNumber, 16);
    sheet.getCell(rowNumber, 14).value = label;
    sheet.getCell(rowNumber, 17).value = value as number;
    sheet.getCell(rowNumber, 17).numFmt = currencyFormat;
    for (let column = 14; column <= 17; column += 1) {
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
  sheet.pageSetup.printArea = `A1:Q${summaryStart + summaryRows.length - 1}`;
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
