import type ExcelJS from 'exceljs';
import logo from '@/assets/logo.png';
import styleoLogo from '@/assets/styleoLogo.png';
import { COMPANY_DETAILS } from '@/data/paintsData';
import type { ApiProduct, ApiSale } from '@/services/api';

const currencyFormat = '"₹"#,##0.00';
const border: Partial<ExcelJS.Borders> = {
  top: { style: 'thin', color: { argb: 'FF9EADBA' } },
  left: { style: 'thin', color: { argb: 'FF9EADBA' } },
  bottom: { style: 'thin', color: { argb: 'FF9EADBA' } },
  right: { style: 'thin', color: { argb: 'FF9EADBA' } },
};
const headerFill: ExcelJS.Fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE5E7EB' } };
const titleFill: ExcelJS.Fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF3F4F6' } };

function safeSheetName(value: string, existing: Set<string>) {
  const base = (value.replace(/[\\/*?:[\]]/g, '-').trim() || 'Invoice').slice(0, 31);
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
      if (!response.ok) throw new Error('Could not load the company logo for the sales workbook');
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

function mergeLabelValue(sheet: ExcelJS.Worksheet, row: number, start: number, end: number, value: string, bold = false) {
  sheet.mergeCells(row, start, row, end);
  const cell = sheet.getCell(row, start);
  cell.value = value;
  cell.font = { name: 'Arial', size: 10, bold, color: { argb: 'FF111827' } };
  cell.alignment = { vertical: 'middle', wrapText: true };
  for (let column = start; column <= end; column += 1) sheet.getCell(row, column).border = border;
  sheet.getRow(row).height = 22;
}

function addSalesWorksheet(
  workbook: ExcelJS.Workbook,
  sale: ApiSale,
  products: ApiProduct[],
  companyLogo: string,
  business: string,
  usedNames: Set<string>
) {
  const sheet = workbook.addWorksheet(safeSheetName(sale.invoiceNumber, usedNames));
  sheet.columns = [
    { width: 7 }, { width: 14 }, { width: 34 }, { width: 9 },
    { width: 13 }, { width: 15 }, { width: 11 }, { width: 18 },
  ];
  sheet.pageSetup = {
    orientation: 'portrait',
    paperSize: 9,
    fitToPage: true,
    fitToWidth: 1,
    fitToHeight: 1,
    margins: { left: 0.25, right: 0.25, top: 0.4, bottom: 0.4, header: 0.15, footer: 0.15 },
  };

  const isInteriors = business.toLowerCase() === 'interiors';
  const companyName = isInteriors ? COMPANY_DETAILS.interiorsName : COMPANY_DETAILS.name;
  const imageId = workbook.addImage({ base64: companyLogo, extension: 'png' });
  sheet.addImage(imageId, 'A1:B4');

  mergeLabelValue(sheet, 1, 3, 8, companyName, true);
  sheet.getCell('C1').font = { name: 'Arial', size: 17, bold: true, color: { argb: 'FF111827' } };
  mergeLabelValue(sheet, 2, 3, 8, COMPANY_DETAILS.address);
  mergeLabelValue(sheet, 3, 3, 8, `Phone: ${COMPANY_DETAILS.contactNumbers.join(' / ')}`);
  mergeLabelValue(sheet, 4, 3, 8, `GSTIN: ${COMPANY_DETAILS.gstNumber}  |  ${COMPANY_DETAILS.website}`);
  sheet.mergeCells('A6:H6');
  sheet.getCell('A6').value = 'TAX INVOICE';
  sheet.getCell('A6').font = { name: 'Arial', size: 15, bold: true, color: { argb: 'FF111827' } };
  sheet.getCell('A6').alignment = { horizontal: 'center', vertical: 'middle' };
  sheet.getCell('A6').fill = titleFill;
  sheet.getRow(6).height = 30;

  mergeLabelValue(sheet, 8, 1, 4, `Customer: ${sale.customerName}`, true);
  mergeLabelValue(sheet, 8, 5, 8, `Invoice No: ${sale.invoiceNumber}`, true);
  mergeLabelValue(sheet, 9, 1, 4, `Phone: ${sale.customerPhone}`);
  mergeLabelValue(sheet, 9, 5, 8, `Date: ${formatDate(sale.saleDate)}`);
  mergeLabelValue(sheet, 10, 1, 4, `Payment Mode: ${sale.paymentMode}`);
  mergeLabelValue(sheet, 10, 5, 8, `Status: ${sale.status}`);

  const headers = ['S.No', 'HSN', 'Description', 'Qty', 'Unit', 'Rate (₹)', 'GST %', 'Amount (₹)'];
  const headerRow = 12;
  const header = sheet.getRow(headerRow);
  header.values = [undefined, ...headers];
  header.height = 26;
  header.eachCell((cell) => {
    cell.fill = headerFill;
    cell.font = { name: 'Arial', size: 9, bold: true, color: { argb: 'FF111827' } };
    cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
    cell.border = border;
  });

  const items = sale.items ?? [];
  let subtotal = 0;
  let discount = 0;
  let taxable = 0;
  let gstAmount = 0;
  items.forEach((item, index) => {
    const quantity = Number(item.quantity) || 0;
    const rate = Number(item.sellingPrice) || 0;
    const lineDiscount = Number(item.discount) || 0;
    const lineSubtotal = quantity * rate;
    const lineTaxable = Math.max(0, lineSubtotal - lineDiscount);
    const lineGst = lineTaxable * (Number(item.gstRate) || 0) / 100;
    const product = products.find((entry) => entry.id === item.productId);
    const row = sheet.getRow(headerRow + index + 1);
    row.values = [
      undefined,
      index + 1,
      product?.hsn || '—',
      item.productName,
      quantity,
      product?.unit || '—',
      rate,
      Number(item.gstRate) || 0,
      lineTaxable + lineGst,
    ];
    row.height = 22;
    row.eachCell((cell, column) => {
      cell.font = { name: 'Arial', size: 9, color: { argb: 'FF111827' } };
      cell.alignment = { vertical: 'middle', horizontal: [1, 2, 4, 5, 7].includes(column) ? 'center' : 'left', wrapText: true };
      cell.border = border;
      if (column === 7 || column === 9) cell.numFmt = currencyFormat;
      if (column === 8) cell.numFmt = '0.##"%"';
    });
    subtotal += lineSubtotal;
    discount += lineDiscount;
    taxable += lineTaxable;
    gstAmount += lineGst;
  });

  const summaryStart = headerRow + Math.max(items.length, 1) + 2;
  const summary = [
    ['Subtotal', subtotal],
    ['Discount', discount],
    ['Taxable Amount', taxable],
    ['GST Amount', gstAmount],
    ['Net Amount', sale.totalAmount],
  ];
  summary.forEach(([label, value], index) => {
    const row = summaryStart + index;
    sheet.mergeCells(row, 5, row, 7);
    sheet.getCell(row, 5).value = label;
    sheet.getCell(row, 8).value = value as number;
    sheet.getCell(row, 8).numFmt = currencyFormat;
    for (let column = 5; column <= 8; column += 1) {
      const cell = sheet.getCell(row, column);
      cell.border = border;
      cell.font = { name: 'Arial', size: 10, bold: index === summary.length - 1 };
      if (index === summary.length - 1) cell.fill = titleFill;
    }
  });

  const notesRow = summaryStart + summary.length + 1;
  mergeLabelValue(sheet, notesRow, 1, 8, `Notes: ${sale.notes?.trim() || 'Thank you for your business.'}`);
  sheet.getCell(`A${notesRow}`).alignment = { vertical: 'middle', wrapText: true };
  sheet.getRow(notesRow).height = 32;
  mergeLabelValue(sheet, notesRow + 2, 1, 8, 'For ' + companyName, true);
  sheet.getCell(`A${notesRow + 2}`).alignment = { horizontal: 'right', vertical: 'middle' };
  sheet.pageSetup.printArea = `A1:H${notesRow + 2}`;
  sheet.views = [{ state: 'frozen', ySplit: headerRow }];
}

export async function exportSalesToExcel(sales: ApiSale[], products: ApiProduct[], business: string) {
  const ExcelJS = (await import('exceljs')).default;
  const workbook = new ExcelJS.Workbook();
  workbook.creator = COMPANY_DETAILS.name;
  workbook.subject = 'Sales invoices';
  workbook.title = `Sales invoices - ${business}`;
  workbook.created = new Date();

  const companyLogo = await loadImageAsBase64(business.toLowerCase() === 'interiors' ? styleoLogo : logo);
  const usedNames = new Set<string>();
  sales.forEach((sale) => addSalesWorksheet(workbook, sale, products, companyLogo, business, usedNames));

  const content = await workbook.xlsx.writeBuffer();
  const blob = new Blob([content as BlobPart], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = `sales-${business}-${new Date().toISOString().slice(0, 10)}.xlsx`;
  anchor.click();
  URL.revokeObjectURL(url);
}
