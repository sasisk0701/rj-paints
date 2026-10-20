// import { COMPANY_DETAILS } from '@/data/paintsData';
// import { jsPDF } from 'jspdf';
// import autoTable from 'jspdf-autotable';
// import type {
//   ApiProduct,
//   ApiPurchase,
//   ApiSale,
//   ApiCustomer,
//   ApiSupplier,
// } from '@/services/api';

// interface PdfColumn {
//   label: string;
//   width: number;
//   align?: 'left' | 'center' | 'right';
// }

// interface PdfItem {
//   cells: string[];
// }

// interface PdfSummaryRow {
//   label: string;
//   value: number;
// }

// interface PdfDocument {
//   title: string;
//   number: string;
//   date: string;
//   partyLabel: string;
//   party: string;
//   address?: string;
//   phone?: string;
//   gstNumber?: string;
//   paymentMode: string;
//   gstMode?: string;
//   status: string;
//   notes?: string | null;
//   columns: PdfColumn[];
//   items: PdfItem[];
//   summary: PdfSummaryRow[];
// }

// const ITEMS_PER_PAGE = 12;
// const PRODUCT_ROWS_PER_PAGE = 10;

// const currency = (value: number) =>
//   `Rs. ${value.toLocaleString('en-IN', {
//     minimumFractionDigits: 2,
//     maximumFractionDigits: 2,
//   })}`;


// function ascii(value: unknown) {
//   return String(value ?? '')
//     .replace(/₹/g, 'Rs. ')
//     .replace(/[–—]/g, '-')
//     .replace(/[“”]/g, '"')
//     .replace(/[‘’]/g, "'")
//     .normalize('NFKD')
//     // Preserve newlines inside PDF table cells.
//     .replace(/[^\x20-\x7E\n\r\t]/g, '?');
// }


// function safeFileName(value: string) {
//   return (
//     value
//       .replace(/[^a-zA-Z0-9._-]+/g, '-')
//       .replace(/-+/g, '-')
//       .replace(/^-|-$/g, '') || 'export'
//   );
// }

// function formatDate(value: string) {
//   const date = new Date(value);

//   return Number.isNaN(date.getTime())
//     ? value
//     : date.toLocaleDateString('en-IN');
// }

// function displayNumber(value: number) {
//   return Number.isFinite(value)
//     ? value.toLocaleString('en-IN', {
//         maximumFractionDigits: 2,
//       })
//     : '0';
// }

// function displayAmount(value: number) {
//   return Number.isFinite(value)
//     ? value.toLocaleString('en-IN', {
//         minimumFractionDigits: 2,
//         maximumFractionDigits: 2,
//       })
//     : '0.00';
// }

// function formatPurchaseVolume(
//   value: unknown,
//   quantity: number,
//   fallbackUnit?: string
// ) {
//   const rawValue = String(value ?? '').trim();

//   if (!rawValue) return '-';

//   const match = rawValue.match(/^([\d,]+(?:\.\d+)?)\s*(.*?)$/);

//   if (!match) return rawValue;

//   const volume = Number(match[1].replace(/,/g, ''));

//   if (!Number.isFinite(volume) || !Number.isFinite(quantity)) {
//     return rawValue;
//   }

//   // Assumes item.volume is the volume per unit.
//   const total = volume * quantity;
//   const unit = match[2].trim() || fallbackUnit?.trim() || '';

//   return `${displayNumber(total)}${unit ? ` ${unit}` : ''}`;
// }

// function truncate(value: string, maxCharacters: number) {
//   const text = ascii(value);

//   if (text.length <= maxCharacters) return text;

//   return `${text.slice(0, Math.max(0, maxCharacters - 3))}...`;
// }

// function downloadPdf(
//   documents: PdfDocument[],
//   business: string,
//   filePrefix: string
// ) {
//   if (!documents.length) {
//     throw new Error('There are no records to export');
//   }

//   const businessName =
//     business.toLowerCase() === 'interiors'
//       ? COMPANY_DETAILS.interiorsName
//       : COMPANY_DETAILS.name;

//   const pageData = documents.flatMap((document) => {
//     const descriptionIndex = document.columns.findIndex(
//       (column) => column.label === 'Description'
//     );

//     const items = document.items.length
//       ? document.items
//       : [
//           {
//             cells: document.columns.map((_, index) =>
//               index === descriptionIndex ? 'No items' : ''
//             ),
//           },
//         ];

//     const pages = Array.from(
//       { length: Math.ceil(items.length / ITEMS_PER_PAGE) },
//       (_, index) =>
//         items.slice(
//           index * ITEMS_PER_PAGE,
//           (index + 1) * ITEMS_PER_PAGE
//         )
//     );

//     return pages.map((pageItems, index) => ({
//       document,
//       pageItems,
//       pageIndex: index,
//       isLastPage: index === pages.length - 1,
//     }));
//   });

//   const doc = new jsPDF({
//     orientation: 'landscape',
//     unit: 'mm',
//     format: 'a4',
//   });

//   pageData.forEach((page, index) => {
//     if (index > 0) doc.addPage('a4', 'landscape');

//     const record = page.document;

//     doc.setFont('helvetica', 'bold');
//     doc.setFontSize(14);
//     doc.text(ascii(businessName), 12, 12);

//     doc.setFontSize(9);
//     doc.text(ascii(record.title.toUpperCase()), 285, 12, {
//       align: 'right',
//     });

//     doc.setFont('helvetica', 'normal');
//     doc.setFontSize(7);

//     doc.text(ascii(COMPANY_DETAILS.address), 12, 18);

//     doc.text(
//       ascii(
//         `Phone: ${COMPANY_DETAILS.contactNumbers.join(' / ')} | GSTIN: ${COMPANY_DETAILS.gstNumber}`
//       ),
//       12,
//       23
//     );

//     doc.text(ascii(COMPANY_DETAILS.website), 285, 18, {
//       align: 'right',
//     });

//     doc.setDrawColor(100);
//     doc.line(12, 27, 285, 27);

//     doc.setFontSize(7.5);
//     doc.setFont('helvetica', 'bold');

//     doc.text(
//       ascii(
//         `${record.title === 'Tax Invoice' ? 'Invoice' : 'PO'} No: ${record.number}`
//       ),
//       12,
//       34
//     );

//     doc.setFont('helvetica', 'normal');

//     doc.text(ascii(`Date: ${formatDate(record.date)}`), 145, 34);

//     doc.setFont('helvetica', 'bold');

//     doc.text(ascii(`Status: ${record.status}`), 285, 34, {
//       align: 'right',
//     });

//     doc.text(
//       ascii(`${record.partyLabel}: ${record.party}`),
//       12,
//       40
//     );

//     doc.setFont('helvetica', 'normal');

//     doc.text(ascii(`Payment: ${record.paymentMode}`), 145, 40);

//     if (record.gstMode) {
//       doc.text(ascii(`GST Mode: ${record.gstMode}`), 285, 40, {
//         align: 'right',
//       });
//     }

//     if (record.address) {
//       doc.text(
//         ascii(`Address: ${truncate(record.address, 100)}`),
//         12,
//         46
//       );
//     }

//     if (record.phone) {
//       doc.text(ascii(`Phone: ${record.phone}`), 12, 51);
//     }

//     if (record.gstNumber) {
//       doc.text(ascii(`GSTIN: ${record.gstNumber}`), 145, 46);
//     }

//     if (record.notes?.trim()) {
//       doc.text(
//         ascii(`Notes: ${truncate(record.notes.trim(), 90)}`),
//         285,
//         46,
//         { align: 'right' }
//       );
//     }

//     const columnWidthTotal = record.columns.reduce(
//       (total, column) => total + column.width,
//       0
//     );

//     const availableWidth = 273;

//     const columnStyles = Object.fromEntries(
//       record.columns.map((column, columnIndex) => [
//         columnIndex,
//         {
//           cellWidth:
//             (availableWidth * column.width) / columnWidthTotal,
//           halign: column.align ?? 'left',
//         },
//       ])
//     );

//     autoTable(doc, {
//       head: [record.columns.map((column) => ascii(column.label))],
//       body: page.pageItems.map((item) => item.cells.map(ascii)),
//       startY: 56,
//       margin: { left: 12, right: 12, bottom: 45 },

//       styles: {
//         font: 'helvetica',
//         fontSize: 6.5,
//         cellPadding: 1.5,
//         overflow: 'linebreak',
//         valign: 'middle',
//       },

//       headStyles: {
//         fillColor: [230, 230, 230],
//         textColor: [25, 25, 25],
//         fontStyle: 'bold',
//       },

//       columnStyles,
//       rowPageBreak: 'avoid',

//       didDrawPage: () => {
//         if (!page.isLastPage) {
//           doc.setFontSize(7);

//           doc.text(
//             ascii(
//               `Continued on next page - Items ${
//                 page.pageIndex * ITEMS_PER_PAGE + 1
//               }-${
//                 page.pageIndex * ITEMS_PER_PAGE +
//                 page.pageItems.length
//               }`
//             ),
//             12,
//             199
//           );
//         }
//       },
//     });

//     if (page.isLastPage) {
//       autoTable(doc, {
//         body: record.summary.map((row) => [
//           ascii(row.label),
//           currency(row.value),
//         ]),
//         startY: 153,
//         margin: { left: 176, right: 12 },
//         tableWidth: 109,

//         styles: {
//           font: 'helvetica',
//           fontSize: 7,
//           cellPadding: 1.2,
//         },

//         columnStyles: {
//           0: { cellWidth: 70 },
//           1: { halign: 'right' },
//         },

//         theme: 'grid',
//       });
//     }

//     doc.setFont('helvetica', 'normal');
//     doc.setFontSize(7);

//     doc.text(`Page ${index + 1} of ${pageData.length}`, 285, 203, {
//       align: 'right',
//     });
//   });

//   doc.save(
//     `${safeFileName(
//       `${filePrefix}-${business}-${new Date().toISOString().slice(0, 10)}`
//     )}.pdf`
//   );
// }

// export function exportProductsToPdf(
//   products: ApiProduct[],
//   business: string,
//   filePrefix = 'products'
// ) {
//   if (!products.length) {
//     throw new Error('There are no products to export');
//   }

//   const businessName =
//     business.toLowerCase() === 'interiors'
//       ? COMPANY_DETAILS.interiorsName
//       : COMPANY_DETAILS.name;

//   const doc = new jsPDF({
//     orientation: 'landscape',
//     unit: 'mm',
//     format: 'a3',
//   });

//   const columns = [
//     'Product',
//     'Category',
//     'HSN Code',
//     'Color',
//     'Brand',
//     'Unit',
//     'Purchase Price',
//     'Selling Price',
//     'GST %',
//     'Stock',
//     'Min Stock',
//     'Status',
//   ];

//   const chunks = Array.from(
//     { length: Math.ceil(products.length / PRODUCT_ROWS_PER_PAGE) },
//     (_, index) =>
//       products.slice(
//         index * PRODUCT_ROWS_PER_PAGE,
//         (index + 1) * PRODUCT_ROWS_PER_PAGE
//       )
//   );

//   chunks.forEach((pageProducts, index) => {
//     if (index > 0) doc.addPage('a3', 'landscape');

//     doc.setFont('helvetica', 'bold');
//     doc.setFontSize(16);
//     doc.text(ascii(businessName), 12, 13);

//     doc.setFontSize(11);
//     doc.text('Product Catalog', 12, 21);

//     doc.setFont('helvetica', 'normal');
//     doc.setFontSize(8);

//     doc.text(
//       `Generated: ${new Date().toLocaleDateString('en-IN')}`,
//       408,
//       13,
//       { align: 'right' }
//     );

//     autoTable(doc, {
//       head: [columns],

//       body: pageProducts.map((product) =>
//         [
//           product.name,
//           product.categoryName,
//           product.hsn ?? '',
//           product.color ?? '',
//           product.brand,
//           product.unit,
//           displayAmount(product.purchasePrice),
//           displayAmount(product.sellingPrice),
//           `${displayNumber(product.gstRate)}%`,
//           displayNumber(product.stock),
//           displayNumber(product.minStock),
//           product.status,
//         ].map(ascii)
//       ),

//       startY: 27,
//       margin: { left: 12, right: 12 },

//       styles: {
//         font: 'helvetica',
//         fontSize: 7,
//         cellPadding: 2,
//         overflow: 'linebreak',
//         halign: 'center',
//       },

//       headStyles: {
//         fillColor: [230, 230, 230],
//         textColor: [30, 30, 30],
//         fontStyle: 'bold',
//         halign: 'center',
//       },

//       tableWidth: 'auto',
//     });

//     doc.setFontSize(8);

//     doc.text(`Page ${index + 1} of ${chunks.length}`, 408, 288, {
//       align: 'right',
//     });
//   });

//   doc.save(
//     `${safeFileName(
//       `${filePrefix}-${business}-${new Date().toISOString().slice(0, 10)}`
//     )}.pdf`
//   );
// }

// export function exportSalesToPdf(
//   sales: ApiSale[],
//   customers: ApiCustomer[],
//   business: string
// ) {
//   const columns: PdfColumn[] = [
//     { label: 'S.No', width: 36, align: 'center' },
//     { label: 'HSN', width: 60 },
//     { label: 'Description', width: 315 },
//     { label: 'Qty', width: 65, align: 'right' },
//     { label: 'Rate (Rs.)', width: 90, align: 'right' },
//     { label: 'Tax %', width: 65, align: 'right' },
//     { label: 'Amount (Rs.)', width: 167, align: 'right' },
//   ];

//   const documents = sales.map<PdfDocument>((sale) => {
//     let subtotal = 0;
//     let discount = 0;
//     let taxable = 0;
//     let gstAmount = 0;

//     const items = (sale.items ?? []).map((item, index) => {
//       const quantity = Number(item.quantity) || 0;
//       const rate = Number(item.sellingPrice) || 0;
//       const lineDiscount = Number(item.discount) || 0;

//       const lineSubtotal = quantity * rate;
//       const lineTaxable = Math.max(0, lineSubtotal - lineDiscount);

//       const lineGst =
//         (lineTaxable * (Number(item.gstRate) || 0)) / 100;

//       subtotal += lineSubtotal;
//       discount += lineDiscount;
//       taxable += lineTaxable;
//       gstAmount += lineGst;

//       return {
//         cells: [
//           String(index + 1),
//           item.hsn || '-',
//           item.productName,
//           displayNumber(quantity),
//           currency(rate),
//           `${displayNumber(Number(item.gstRate) || 0)}%`,
//           currency(lineTaxable + lineGst),
//         ],
//       };
//     });

//     const customer =
//       customers.find((entry) => entry.id === sale.customerId) ??
//       customers.find(
//         (entry) =>
//           entry.name === sale.customerName &&
//           entry.phone === sale.customerPhone
//       );

//     return {
//       title: 'Tax Invoice',
//       number: sale.invoiceNumber,
//       date: sale.saleDate,
//       partyLabel: 'Customer',
//       party: sale.customerName,

//       address: [customer?.address, customer?.city]
//         .filter(Boolean)
//         .join(', '),

//       phone: sale.customerPhone,
//       paymentMode: sale.paymentMode,
//       gstMode: sale.gstMode ?? 'B2C',
//       status: sale.status,
//       notes: sale.notes,
//       columns,
//       items,

//       summary: [
//         { label: 'Subtotal', value: subtotal },
//         { label: 'Discount', value: discount },
//         { label: 'Taxable Amount', value: taxable },
//         { label: 'GST Amount', value: gstAmount },
//         { label: 'Net Amount', value: sale.totalAmount },
//       ],
//     };
//   });

//   downloadPdf(documents, business, 'sales');
// }

// function drawPurchaseInvoicePage(
//   doc: jsPDF,
//   purchase: ApiPurchase,
//   supplier: ApiSupplier | undefined,
//   pageItems: string[][],
//   totalPages: number,
//   pageNumber: number,
//   businessName: string,
//   categoryLabel: string,
//   isLastPage: boolean
// ) {
//   doc.setFont('helvetica', 'bold');
//   doc.setFontSize(18);
//   doc.text(ascii(businessName), 12, 18);

//   doc.setFont('helvetica', 'normal');
//   doc.setFontSize(10);
//   doc.text(ascii(COMPANY_DETAILS.address), 12, 25);

//   doc.setFontSize(9);

//   doc.text(
//     ascii(`Phone: ${COMPANY_DETAILS.contactNumbers.join(' / ')}`),
//     12,
//     30
//   );

//   doc.text(ascii(`GSTIN: ${COMPANY_DETAILS.gstNumber}`), 12, 35);

//   doc.setFont('helvetica', 'bold');
//   doc.setFontSize(12);
//   doc.text('INVOICE DETAILS', 169, 18);

//   doc.setFont('helvetica', 'normal');
//   doc.setFontSize(9);

//   doc.text(
//     ascii(`Invoice No: ${purchase.invoiceNo || '-'}`),
//     169,
//     25
//   );

//   doc.text(ascii(`PO No: ${purchase.poNumber || '-'}`), 169, 30);

//   doc.text(
//     ascii(`Invoice Date: ${formatDate(purchase.purchaseDate)}`),
//     169,
//     35
//   );

//   doc.text(
//     ascii(`Category: ${categoryLabel || '-'}`),
//     169,
//     40
//   );

//   doc.text(
//     ascii(`Payment: ${purchase.paymentMode} | Status: ${purchase.status}`),
//     169,
//     45
//   );

//   doc.setDrawColor(80);
//   doc.line(12, 50, 408, 50);

//   const supplierAddress = [supplier?.address, supplier?.city]
//     .filter(Boolean)
//     .join(', ');

//   doc.setFont('helvetica', 'bold');
//   doc.setFontSize(10);

//   doc.text('BILL TO PARTY', 12, 56);

//   doc.text(
//     ascii(supplier?.name ?? purchase.supplierName),
//     12,
//     62
//   );

//   doc.setFont('helvetica', 'normal');
//   doc.setFontSize(8);

//   doc.text(
//     ascii(`Supplier Name: ${purchase.supplierContactName || '-'}`),
//     12,
//     68
//   );

//   doc.text(
//     ascii(`Address: ${supplierAddress || '-'}`),
//     12,
//     73
//   );

//   doc.text(
//     ascii(`Phone: ${supplier?.phone || '-'}`),
//     12,
//     78
//   );

//   if (supplier?.gstNumber) {
//     doc.text(ascii(`GSTIN: ${supplier.gstNumber}`), 12, 83);
//   }

//   doc.setFont('helvetica', 'bold');
//   doc.setFontSize(10);

//   const shipToX = 170;

//   doc.text('SHIP TO PARTY', shipToX, 56);
//   doc.text(ascii(businessName), shipToX, 62);

//   doc.setFont('helvetica', 'normal');
//   doc.setFontSize(8);

//   doc.text(
//     ascii(truncate(`Address: ${COMPANY_DETAILS.address}`, 85)),
//     shipToX,
//     68
//   );

//   doc.text(
//     ascii(`Phone: ${COMPANY_DETAILS.contactNumbers[0]}`),
//     shipToX,
//     73
//   );

//   doc.text(
//     ascii(`GSTIN: ${COMPANY_DETAILS.gstNumber}`),
//     shipToX,
//     78
//   );

//   const headers = [
//     'Material\nHSN',
//     'Description',
//     'Qty',
//     'Packs',
//     'Volume\n(Kg/Lt/M)',
//     'Rate\n(INR / %)',
//     'Value',
//     'In-Bill\nDisc.',
//     'In-Bill\nDisc. 2',
//     'Cash\nDisc.',
//     'Taxable\nAmount',
//     'Tax\nAmount',
//     'Total\nAmount',
//   ];

//   autoTable(doc, {
//     head: [headers],
//     body: pageItems.map((cells) => cells.map(ascii)),

//     startY: 89,
//     margin: { left: 11, right: 11, bottom: 22 },
//     tableWidth: 388,

//     styles: {
//       font: 'helvetica',
//       fontSize: 7,
//       cellPadding: 2,
//       overflow: 'linebreak',
//       valign: 'top',
//       minCellHeight: 20,
//       halign: 'center',
//       lineWidth: 0.1,
//       lineColor: [120, 120, 120],
//     },

//     headStyles: {
//       fillColor: [230, 230, 230],
//       textColor: [25, 25, 25],
//       fontStyle: 'bold',
//       halign: 'left',
//       valign: 'middle',
//     },

//     columnStyles: {
//       0: { cellWidth: 54, halign: 'left' },
//       1: { cellWidth: 52, halign: 'left' },
//       2: { cellWidth: 14, halign: 'right' },
//       3: { cellWidth: 18, halign: 'center' },
//       4: { cellWidth: 25, halign: 'right' },
//       5: { cellWidth: 30, halign: 'right' },
//       6: { cellWidth: 26, halign: 'right' },
//       7: { cellWidth: 26, halign: 'right' },
//       8: { cellWidth: 26, halign: 'right' },
//       9: { cellWidth: 26, halign: 'right' },
//       10: { cellWidth: 32, halign: 'right' },
//       11: { cellWidth: 29, halign: 'right' },
//       12: { cellWidth: 30, halign: 'right' },
//     },

//     rowPageBreak: 'avoid',

//     didDrawPage: () => {
//       doc.setFont('helvetica', 'normal');
//       doc.setFontSize(8);

//       if (!isLastPage) {
//         doc.text(
//           ascii(`Continued - ${purchase.poNumber}`),
//           12,
//           288
//         );
//       }

//       doc.text(
//         `Page ${pageNumber} of ${totalPages}`,
//         408,
//         288,
//         { align: 'right' }
//       );
//     },
//   });
// }

// export function exportPurchasesToPdf(
//   purchases: ApiPurchase[],
//   suppliers: ApiSupplier[],
//   products: ApiProduct[],
//   business: string,
//   filePrefix = 'purchase-orders'
// ) {
//   if (!purchases.length) {
//     throw new Error('There are no records to export');
//   }

//   const businessName =
//     business.toLowerCase() === 'interiors'
//       ? COMPANY_DETAILS.interiorsName
//       : COMPANY_DETAILS.name;

//   const prepared = purchases.map((purchase) => {
//     const categories = new Set<string>();

//     const items = (purchase.items ?? []).map((item) => {
//       const quantity = Number(item.quantity) || 0;
//       const rate = Number(item.purchasePrice) || 0;

//       const inBillDiscountPercent =
//         Number(item.inBillDiscountPercent) || 0;

//       const inBillDiscountAmount =
//         Number(item.inBillDiscountAmount) || 0;

//       const inBillDiscount2Percent =
//         Number(item.inBillDiscount2Percent) || 0;

//       const inBillDiscount2Amount =
//         Number(item.inBillDiscount2Amount) || 0;

//       const cashDiscountPercent =
//         Number(item.cashDiscountPercent) || 0;

//       const cashDiscountAmount =
//         Number(item.cashDiscountAmount) || 0;

//       const gstRate = Number(item.gstRate) || 0;

//       const value = quantity * rate;

//       const inBillDiscount =
//         (value * inBillDiscountPercent) / 100 +
//         inBillDiscountAmount;

//       const afterFirstDiscount = Math.max(
//         0,
//         value - inBillDiscount
//       );

//       const inBillDiscount2 =
//         (afterFirstDiscount * inBillDiscount2Percent) / 100 +
//         inBillDiscount2Amount;

//       const afterSecondDiscount = Math.max(
//         0,
//         afterFirstDiscount - inBillDiscount2
//       );

//       const cashDiscount =
//         (afterSecondDiscount * cashDiscountPercent) / 100 +
//         cashDiscountAmount;

//       const taxable = Math.max(
//         0,
//         afterSecondDiscount - cashDiscount
//       );

//       const tax = (taxable * gstRate) / 100;
//       const halfTaxRate = gstRate / 2;

//       const product = products.find(
//         (entry) => entry.id === item.productId
//       );

//       if (product?.categoryName) {
//         categories.add(product.categoryName);
//       }

//       const volumeDisplay = formatPurchaseVolume(
//         item.volume,
//         quantity,
//         product?.unit
//       );

//       const formatDiscount = (
//         amount: number,
//         percent: number
//       ) => {
//         if (amount === 0 && percent === 0) return '0.00';

//         return percent > 0
//           ? `${displayAmount(amount)}\n${displayAmount(percent)}%`
//           : displayAmount(amount);
//       };

//       // IMPORTANT:
//       // Each product produces ONE table row.
//       // Newlines create multiple lines inside the same cell.

//       const itemRow = [
//         // Material + HSN
//         `${item.productName}\nHSN - ${item.hsn || '-'}`,

//         // Description + GST labels
//         `${product?.description?.trim() || item.productName}\n` +
//           `IN: Central GST OP\n` +
//           `IN: State GST OP`,

//         // Quantity
//         displayNumber(quantity),

//         // Packs
//         displayNumber(item.packs ?? 0),

//         // Total volume
//         volumeDisplay,

//         // Rate + GST rates
//         `${displayAmount(rate)}\n` +
//           `${displayAmount(halfTaxRate)}\n` +
//           `${displayAmount(halfTaxRate)}`,

//         // Value
//         displayAmount(value),

//         // In-Bill Discount 1
//         formatDiscount(
//           inBillDiscount,
//           inBillDiscountPercent
//         ),

//         // In-Bill Discount 2
//         formatDiscount(
//           inBillDiscount2,
//           inBillDiscount2Percent
//         ),

//         // Cash Discount
//         formatDiscount(
//           cashDiscount,
//           cashDiscountPercent
//         ),

//         // Taxable Amount
//         displayAmount(taxable),

//         // CGST and SGST amounts
//         `${displayAmount(tax / 2)}\n${displayAmount(tax / 2)}`,

//         // Total Amount
//         displayAmount(taxable + tax),
//       ];

//       return {
//         rows: [itemRow],
//       };
//     });

//     return {
//       purchase,
//       items,
//       categoryLabel: [...categories].join(', '),
//     };
//   });

//   const pages = prepared.flatMap((document) => {
//     const rows = document.items.length
//       ? document.items
//       : [
//           {
//             rows: [
//               Array(13)
//                 .fill('')
//                 .map((_, index) =>
//                   index === 1 ? 'No items' : ''
//                 ),
//             ],
//           },
//         ];

//     const chunks = Array.from(
//       { length: Math.ceil(rows.length / 10) },
//       (_, index) => rows.slice(index * 10, (index + 1) * 10)
//     );

//     return chunks.map((pageItems, pageIndex) => ({
//       ...document,
//       pageItems: pageItems.flatMap((item) => item.rows),
//       pageIndex,
//       isLastPage: pageIndex === chunks.length - 1,
//     }));
//   });

//   const doc = new jsPDF({
//     orientation: 'landscape',
//     unit: 'mm',
//     format: 'a3',
//   });

//   pages.forEach((page, index) => {
//     if (index > 0) {
//       doc.addPage('a3', 'landscape');
//     }

//     drawPurchaseInvoicePage(
//       doc,
//       page.purchase,
//       suppliers.find(
//         (entry) => entry.id === page.purchase.supplierId
//       ),
//       page.pageItems,
//       pages.length,
//       index + 1,
//       businessName,
//       page.categoryLabel,
//       page.isLastPage
//     );
//   });

//   doc.save(
//     `${safeFileName(
//       `${filePrefix}-${business}-${new Date()
//         .toISOString()
//         .replace(/[:.]/g, '-')}`
//     )}.pdf`
//   );
// }



import { COMPANY_DETAILS } from '@/data/paintsData';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
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

const ITEMS_PER_PAGE = 12;
const PRODUCT_ROWS_PER_PAGE = 10;

const currency = (value: number) =>
  `Rs. ${value.toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

/**
 * Important: Preserve \n and \r characters.
 * They are required to display GST details on separate lines.
 */
function ascii(value: unknown) {
  return String(value ?? '')
    .replace(/₹/g, 'Rs. ')
    .replace(/[–—]/g, '-')
    .replace(/[“”]/g, '"')
    .replace(/[‘’]/g, "'")
    .normalize('NFKD')
    .replace(/[^\x20-\x7E\n\r\t]/g, '?');
}

function safeFileName(value: string) {
  return (
    value
      .replace(/[^a-zA-Z0-9._-]+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '') || 'export'
  );
}

function formatDate(value: string) {
  const date = new Date(value);

  return Number.isNaN(date.getTime())
    ? value
    : date.toLocaleDateString('en-IN');
}

function displayNumber(value: number) {
  return Number.isFinite(value)
    ? value.toLocaleString('en-IN', {
        maximumFractionDigits: 2,
      })
    : '0';
}

function displayAmount(value: number) {
  return Number.isFinite(value)
    ? value.toLocaleString('en-IN', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })
    : '0.00';
}

function formatPurchaseVolume(
  value: unknown,
  quantity: number,
  fallbackUnit?: string
) {
  const rawValue = String(value ?? '').trim();

  if (!rawValue) return '-';

  const match = rawValue.match(/^([\d,]+(?:\.\d+)?)\s*(.*?)$/);

  if (!match) return rawValue;

  const volume = Number(match[1].replace(/,/g, ''));

  if (!Number.isFinite(volume) || !Number.isFinite(quantity)) {
    return rawValue;
  }

  // Assumes item.volume represents volume per unit.
  const total = volume * quantity;
  const unit = match[2].trim() || fallbackUnit?.trim() || '';

  return `${displayNumber(total)}${unit ? ` ${unit}` : ''}`;
}

function truncate(value: string, maxCharacters: number) {
  const text = ascii(value);

  if (text.length <= maxCharacters) return text;

  return `${text.slice(0, Math.max(0, maxCharacters - 3))}...`;
}

function downloadPdf(
  documents: PdfDocument[],
  business: string,
  filePrefix: string
) {
  if (!documents.length) {
    throw new Error('There are no records to export');
  }

  const businessName =
    business.toLowerCase() === 'interiors'
      ? COMPANY_DETAILS.interiorsName
      : COMPANY_DETAILS.name;

  const pageData = documents.flatMap((document) => {
    const descriptionIndex = document.columns.findIndex(
      (column) => column.label === 'Description'
    );

    const items = document.items.length
      ? document.items
      : [
          {
            cells: document.columns.map((_, index) =>
              index === descriptionIndex ? 'No items' : ''
            ),
          },
        ];

    const chunks = Array.from(
      { length: Math.ceil(items.length / ITEMS_PER_PAGE) },
      (_, index) =>
        items.slice(
          index * ITEMS_PER_PAGE,
          (index + 1) * ITEMS_PER_PAGE
        )
    );

    return chunks.map((pageItems, index) => ({
      document,
      pageItems,
      pageIndex: index,
      isLastPage: index === chunks.length - 1,
    }));
  });

  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4',
  });

  pageData.forEach((page, index) => {
    if (index > 0) doc.addPage('a4', 'landscape');

    const record = page.document;

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.text(ascii(businessName), 12, 12);

    doc.setFontSize(9);
    doc.text(ascii(record.title.toUpperCase()), 285, 12, {
      align: 'right',
    });

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.text(ascii(COMPANY_DETAILS.address), 12, 18);

    doc.text(
      ascii(
        `Phone: ${COMPANY_DETAILS.contactNumbers.join(' / ')} | GSTIN: ${COMPANY_DETAILS.gstNumber}`
      ),
      12,
      23
    );

    doc.text(ascii(COMPANY_DETAILS.website), 285, 18, {
      align: 'right',
    });

    doc.setDrawColor(100);
    doc.line(12, 27, 285, 27);

    doc.setFontSize(7.5);
    doc.setFont('helvetica', 'bold');

    doc.text(
      ascii(
        `${record.title === 'Tax Invoice' ? 'Invoice' : 'PO'} No: ${record.number}`
      ),
      12,
      34
    );

    doc.setFont('helvetica', 'normal');
    doc.text(ascii(`Date: ${formatDate(record.date)}`), 145, 34);

    doc.setFont('helvetica', 'bold');
    doc.text(ascii(`Status: ${record.status}`), 285, 34, {
      align: 'right',
    });

    doc.text(
      ascii(`${record.partyLabel}: ${record.party}`),
      12,
      40
    );

    doc.setFont('helvetica', 'normal');
    doc.text(ascii(`Payment: ${record.paymentMode}`), 145, 40);

    if (record.gstMode) {
      doc.text(ascii(`GST Mode: ${record.gstMode}`), 285, 40, {
        align: 'right',
      });
    }

    if (record.address) {
      doc.text(
        ascii(`Address: ${truncate(record.address, 100)}`),
        12,
        46
      );
    }

    if (record.phone) {
      doc.text(ascii(`Phone: ${record.phone}`), 12, 51);
    }

    if (record.gstNumber) {
      doc.text(ascii(`GSTIN: ${record.gstNumber}`), 145, 46);
    }

    if (record.notes?.trim()) {
      doc.text(
        ascii(`Notes: ${truncate(record.notes.trim(), 90)}`),
        285,
        46,
        { align: 'right' }
      );
    }

    const columnWidthTotal = record.columns.reduce(
      (total, column) => total + column.width,
      0
    );

    const availableWidth = 273;

    const columnStyles = Object.fromEntries(
      record.columns.map((column, columnIndex) => [
        columnIndex,
        {
          cellWidth:
            (availableWidth * column.width) / columnWidthTotal,
          halign: column.align ?? 'left',
        },
      ])
    );

    autoTable(doc, {
      head: [record.columns.map((column) => ascii(column.label))],
      body: page.pageItems.map((item) => item.cells.map(ascii)),
      startY: 56,
      margin: { left: 12, right: 12, bottom: 45 },

      styles: {
        font: 'helvetica',
        fontSize: 6.5,
        cellPadding: 1.5,
        overflow: 'linebreak',
        valign: 'middle',
      },

      headStyles: {
        fillColor: [230, 230, 230],
        textColor: [25, 25, 25],
        fontStyle: 'bold',
      },

      columnStyles,
      rowPageBreak: 'avoid',

      didDrawPage: () => {
        if (!page.isLastPage) {
          doc.setFontSize(7);
          doc.text(
            ascii(
              `Continued on next page - Items ${
                page.pageIndex * ITEMS_PER_PAGE + 1
              }-${
                page.pageIndex * ITEMS_PER_PAGE +
                page.pageItems.length
              }`
            ),
            12,
            199
          );
        }
      },
    });

    if (page.isLastPage) {
      autoTable(doc, {
        body: record.summary.map((row) => [
          ascii(row.label),
          currency(row.value),
        ]),
        startY: 153,
        margin: { left: 176, right: 12 },
        tableWidth: 109,

        styles: {
          font: 'helvetica',
          fontSize: 7,
          cellPadding: 1.2,
        },

        columnStyles: {
          0: { cellWidth: 70 },
          1: { halign: 'right' },
        },

        theme: 'grid',
      });
    }

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.text(`Page ${index + 1} of ${pageData.length}`, 285, 203, {
      align: 'right',
    });
  });

  doc.save(
    `${safeFileName(
      `${filePrefix}-${business}-${new Date().toISOString().slice(0, 10)}`
    )}.pdf`
  );
}

export function exportProductsToPdf(
  products: ApiProduct[],
  business: string,
  filePrefix = 'products'
) {
  if (!products.length) {
    throw new Error('There are no products to export');
  }

  const businessName =
    business.toLowerCase() === 'interiors'
      ? COMPANY_DETAILS.interiorsName
      : COMPANY_DETAILS.name;

  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a3',
  });

  const columns = [
    'Product',
    'Category',
    'HSN Code',
    'Color',
    'Brand',
    'Unit',
    'Purchase Price',
    'Selling Price',
    'GST %',
    'Stock',
    'Min Stock',
    'Status',
  ];

  const chunks = Array.from(
    { length: Math.ceil(products.length / PRODUCT_ROWS_PER_PAGE) },
    (_, index) =>
      products.slice(
        index * PRODUCT_ROWS_PER_PAGE,
        (index + 1) * PRODUCT_ROWS_PER_PAGE
      )
  );

  chunks.forEach((pageProducts, index) => {
    if (index > 0) doc.addPage('a3', 'landscape');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    doc.text(ascii(businessName), 12, 13);

    doc.setFontSize(11);
    doc.text('Product Catalog', 12, 21);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.text(
      `Generated: ${new Date().toLocaleDateString('en-IN')}`,
      408,
      13,
      { align: 'right' }
    );

    autoTable(doc, {
      head: [columns],

      body: pageProducts.map((product) =>
        [
          product.name,
          product.categoryName,
          product.hsn ?? '',
          product.color ?? '',
          product.brand,
          product.unit,
          displayAmount(product.purchasePrice),
          displayAmount(product.sellingPrice),
          `${displayNumber(product.gstRate)}%`,
          displayNumber(product.stock),
          displayNumber(product.minStock),
          product.status,
        ].map(ascii)
      ),

      startY: 27,
      margin: { left: 12, right: 12 },

      styles: {
        font: 'helvetica',
        fontSize: 7,
        cellPadding: 2,
        overflow: 'linebreak',
        halign: 'center',
      },

      headStyles: {
        fillColor: [230, 230, 230],
        textColor: [30, 30, 30],
        fontStyle: 'bold',
        halign: 'center',
      },

      tableWidth: 'auto',
    });

    doc.setFontSize(8);
    doc.text(`Page ${index + 1} of ${chunks.length}`, 408, 288, {
      align: 'right',
    });
  });

  doc.save(
    `${safeFileName(
      `${filePrefix}-${business}-${new Date().toISOString().slice(0, 10)}`
    )}.pdf`
  );
}

export function exportSalesToPdf(
  sales: ApiSale[],
  customers: ApiCustomer[],
  business: string
) {
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
      const lineGst =
        (lineTaxable * (Number(item.gstRate) || 0)) / 100;

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

    const customer =
      customers.find((entry) => entry.id === sale.customerId) ??
      customers.find(
        (entry) =>
          entry.name === sale.customerName &&
          entry.phone === sale.customerPhone
      );

    return {
      title: 'Tax Invoice',
      number: sale.invoiceNumber,
      date: sale.saleDate,
      partyLabel: 'Customer',
      party: sale.customerName,
      address: [customer?.address, customer?.city]
        .filter(Boolean)
        .join(', '),
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

function drawPurchaseInvoicePage(
  doc: jsPDF,
  purchase: ApiPurchase,
  supplier: ApiSupplier | undefined,
  pageItems: string[][],
  totalPages: number,
  pageNumber: number,
  businessName: string,
  categoryLabel: string,
  isLastPage: boolean
) {
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.text(ascii(businessName), 12, 18);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.text(ascii(COMPANY_DETAILS.address), 12, 25);

  doc.setFontSize(9);
  doc.text(
    ascii(`Phone: ${COMPANY_DETAILS.contactNumbers.join(' / ')}`),
    12,
    30
  );
  doc.text(ascii(`GSTIN: ${COMPANY_DETAILS.gstNumber}`), 12, 35);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.text('INVOICE DETAILS', 169, 18);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.text(ascii(`Invoice No: ${purchase.invoiceNo || '-'}`), 169, 25);
  doc.text(ascii(`PO No: ${purchase.poNumber || '-'}`), 169, 30);
  doc.text(
    ascii(`Invoice Date: ${formatDate(purchase.purchaseDate)}`),
    169,
    35
  );
  doc.text(ascii(`Category: ${categoryLabel || '-'}`), 169, 40);
  doc.text(
    ascii(`Payment: ${purchase.paymentMode} | Status: ${purchase.status}`),
    169,
    45
  );

  doc.setDrawColor(80);
  doc.line(12, 50, 408, 50);

  const supplierAddress = [supplier?.address, supplier?.city]
    .filter(Boolean)
    .join(', ');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text('BILL TO PARTY', 12, 56);
  doc.text(ascii(supplier?.name ?? purchase.supplierName), 12, 62);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.text(
    ascii(`Supplier Name: ${purchase.supplierContactName || '-'}`),
    12,
    68
  );
  doc.text(ascii(`Address: ${supplierAddress || '-'}`), 12, 73);
  doc.text(ascii(`Phone: ${supplier?.phone || '-'}`), 12, 78);

  if (supplier?.gstNumber) {
    doc.text(ascii(`GSTIN: ${supplier.gstNumber}`), 12, 83);
  }

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);

  const shipToX = 170;
  doc.text('SHIP TO PARTY', shipToX, 56);
  doc.text(ascii(businessName), shipToX, 62);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.text(
    ascii(truncate(`Address: ${COMPANY_DETAILS.address}`, 85)),
    shipToX,
    68
  );
  doc.text(
    ascii(`Phone: ${COMPANY_DETAILS.contactNumbers[0]}`),
    shipToX,
    73
  );
  doc.text(ascii(`GSTIN: ${COMPANY_DETAILS.gstNumber}`), shipToX, 78);

  const headers = [
    'Material\nHSN',
    'Description',
    'Qty',
    'Packs',
    'Volume\n(Kg/Lt/M)',
    'Rate\n(INR / %)',
    'Value',
    'In-Bill\nDisc.',
    'In-Bill\nDisc. 2',
    'Cash\nDisc.',
    'Taxable\nAmount',
    'Tax\nAmount',
    'Total\nAmount',
  ];

  autoTable(doc, {
    head: [headers],
    body: pageItems.map((cells) => cells.map(ascii)),
    startY: 89,
    margin: { left: 11, right: 11, bottom: 22 },
    tableWidth: 388,

    styles: {
      font: 'helvetica',
      fontSize: 7,
      cellPadding: 2,
      overflow: 'linebreak',
      valign: 'top',
      minCellHeight: 20,
      halign: 'center',
      lineWidth: 0.1,
      lineColor: [120, 120, 120],
    },

    headStyles: {
      fillColor: [230, 230, 230],
      textColor: [25, 25, 25],
      fontStyle: 'bold',
      halign: 'left',
      valign: 'middle',
    },

    columnStyles: {
      0: { cellWidth: 54, halign: 'left' },
      1: { cellWidth: 52, halign: 'left' },
      2: { cellWidth: 14, halign: 'right' },
      3: { cellWidth: 18, halign: 'center' },
      4: { cellWidth: 25, halign: 'right' },
      5: { cellWidth: 30, halign: 'right' },
      6: { cellWidth: 26, halign: 'right' },
      7: { cellWidth: 26, halign: 'right' },
      8: { cellWidth: 26, halign: 'right' },
      9: { cellWidth: 26, halign: 'right' },
      10: { cellWidth: 32, halign: 'right' },
      11: { cellWidth: 29, halign: 'right' },
      12: { cellWidth: 30, halign: 'right' },
    },

    rowPageBreak: 'avoid',

    didDrawPage: () => {
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);

      if (!isLastPage) {
        doc.text(
          ascii(`Continued - ${purchase.poNumber}`),
          12,
          288
        );
      }

      doc.text(
        `Page ${pageNumber} of ${totalPages}`,
        408,
        288,
        { align: 'right' }
      );
    },
  });
}

export function exportPurchasesToPdf(
  purchases: ApiPurchase[],
  suppliers: ApiSupplier[],
  products: ApiProduct[],
  business: string,
  filePrefix = 'purchase-orders'
) {
  if (!purchases.length) {
    throw new Error('There are no records to export');
  }

  const businessName =
    business.toLowerCase() === 'interiors'
      ? COMPANY_DETAILS.interiorsName
      : COMPANY_DETAILS.name;

  const prepared = purchases.map((purchase) => {
    const categories = new Set<string>();

    const items = (purchase.items ?? []).map((item) => {
      const quantity = Number(item.quantity) || 0;
      const rate = Number(item.purchasePrice) || 0;

      const inBillDiscountPercent =
        Number(item.inBillDiscountPercent) || 0;
      const inBillDiscountAmount =
        Number(item.inBillDiscountAmount) || 0;

      const inBillDiscount2Percent =
        Number(item.inBillDiscount2Percent) || 0;
      const inBillDiscount2Amount =
        Number(item.inBillDiscount2Amount) || 0;

      const cashDiscountPercent =
        Number(item.cashDiscountPercent) || 0;
      const cashDiscountAmount =
        Number(item.cashDiscountAmount) || 0;

      const gstRate = Number(item.gstRate) || 0;
      const value = quantity * rate;

      const inBillDiscount =
        (value * inBillDiscountPercent) / 100 +
        inBillDiscountAmount;

      const afterFirstDiscount = Math.max(
        0,
        value - inBillDiscount
      );

      const inBillDiscount2 =
        (afterFirstDiscount * inBillDiscount2Percent) / 100 +
        inBillDiscount2Amount;

      const afterSecondDiscount = Math.max(
        0,
        afterFirstDiscount - inBillDiscount2
      );

      const cashDiscount =
        (afterSecondDiscount * cashDiscountPercent) / 100 +
        cashDiscountAmount;

      const taxable = Math.max(
        0,
        afterSecondDiscount - cashDiscount
      );

      const tax = (taxable * gstRate) / 100;
      const halfTaxRate = gstRate / 2;

      const product = products.find(
        (entry) => entry.id === item.productId
      );

      if (product?.categoryName) {
        categories.add(product.categoryName);
      }

      const volumeDisplay = formatPurchaseVolume(
        item.volume,
        quantity,
        product?.unit
      );

      const formatDiscount = (
        amount: number,
        percent: number
      ) => {
        if (amount === 0 && percent === 0) return '0.00';

        return percent > 0
          ? `${displayAmount(amount)} / ${displayAmount(percent)}%`
          : displayAmount(amount);
      };

      // One product = one table row.
      // Newline characters create vertical details inside each cell.
      const itemRow = [
        // Material and HSN
        `${item.productName}\nHSN - ${item.hsn || '-'}`,

        // Description and GST labels
        `${product?.description?.trim() || item.productName}\n` +
          `IN: Central GST OP\n` +
          `IN: State GST OP`,

        // Qty
        displayNumber(quantity),

        // Packs
        displayNumber(item.packs ?? 0),

        // Total volume
        volumeDisplay,

        // Rate, Central GST rate, State GST rate
        `${displayAmount(rate)}\n` +
          `${displayAmount(halfTaxRate)}\n` +
          `${displayAmount(halfTaxRate)}`,

        // Value
        displayAmount(value),

        // In-Bill Discount 1
        formatDiscount(inBillDiscount, inBillDiscountPercent),

        // In-Bill Discount 2
        formatDiscount(inBillDiscount2, inBillDiscount2Percent),

        // Cash Discount
        formatDiscount(cashDiscount, cashDiscountPercent),

        // Taxable Amount
        displayAmount(taxable),

        // CGST and SGST amounts
        `${displayAmount(tax / 2)}\n${displayAmount(tax / 2)}`,

        // Total Amount
        displayAmount(taxable + tax),
      ];

      return { rows: [itemRow] };
    });

    return {
      purchase,
      items,
      categoryLabel: [...categories].join(', '),
    };
  });

  const pages = prepared.flatMap((document) => {
    const rows = document.items.length
      ? document.items
      : [
          {
            rows: [
              Array(13)
                .fill('')
                .map((_, index) =>
                  index === 1 ? 'No items' : ''
                ),
            ],
          },
        ];

    const chunks = Array.from(
      { length: Math.ceil(rows.length / 10) },
      (_, index) => rows.slice(index * 10, (index + 1) * 10)
    );

    return chunks.map((pageItems, pageIndex) => ({
      ...document,
      pageItems: pageItems.flatMap((item) => item.rows),
      pageIndex,
      isLastPage: pageIndex === chunks.length - 1,
    }));
  });

  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a3',
  });

  pages.forEach((page, index) => {
    if (index > 0) {
      doc.addPage('a3', 'landscape');
    }

    drawPurchaseInvoicePage(
      doc,
      page.purchase,
      suppliers.find(
        (entry) => entry.id === page.purchase.supplierId
      ),
      page.pageItems,
      pages.length,
      index + 1,
      businessName,
      page.categoryLabel,
      page.isLastPage
    );
  });

  doc.save(
    `${safeFileName(
      `${filePrefix}-${business}-${new Date()
        .toISOString()
        .replace(/[:.]/g, '-')}`
    )}.pdf`
  );
}
