import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { LOGO_PNG_DATA_URL } from "./logo-data";

type Addr = Record<string, string>;
export type InvoiceOrder = {
  order_number: string;
  invoice_number: string | null;
  created_at: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  shipping_address: Addr;
  billing_address: Addr;
  subtotal: number;
  discount: number;
  coupon_code: string | null;
  shipping_fee: number;
  tax: number;
  total: number;
  payment_method: string;
  payment_status: string;
  order_items: {
    name: string;
    sku: string;
    size: string | null;
    color: string | null;
    quantity: number;
    unit_price: number;
    line_total: number;
  }[];
};

const rs = (n: number) =>
  "Rs. " +
  Number(n).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

const addr = (a?: Addr | null) => {
  if (!a) return "N/A";
  return [
    a.full_name,
    a.phone,
    a.street,
    [a.city, a.district].filter(Boolean).join(", "),
    a.province ? `${a.province} Province, Nepal` : "Nepal",
  ]
    .filter(Boolean)
    .join("\n");
};

/**
 * Downloads a high-resolution, branded Tax Invoice PDF.
 * ONLY triggered on explicit user click — never automated on page load or checkout finish.
 */
export function downloadInvoice(o: InvoiceOrder) {
  const doc = new jsPDF({ unit: "pt", format: "a4" });

  // DOVAN logo
  try {
    doc.addImage(LOGO_PNG_DATA_URL, "PNG", 40, 36, 32, 32);
  } catch {
    doc.setFillColor(9, 86, 154);
    doc.roundedRect(40, 40, 30, 30, 4, 4, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(17);
    doc.text("D", 50, 62);
  }

  // Brand Name
  doc.setTextColor(9, 86, 154);
  doc.setFontSize(22);
  doc.setFont("helvetica", "bold");
  doc.text("DOVAN", 80, 59);

  // Address & Company Info
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(110);
  doc.text(
    "DOVAN Nepal · Durbar Marg, Kathmandu · PAN: 609823145\nsupport@dovan.com.np · www.dovan.com.np",
    80,
    73
  );

  // Title: TAX INVOICE
  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(34, 40, 56);
  doc.text("TAX INVOICE", 555, 58, { align: "right" });

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(90);
  doc.text(
    [
      `Invoice #: ${o.invoice_number ?? "PENDING"}`,
      `Order #: ${o.order_number}`,
      `Date: ${new Date(o.created_at).toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      })}`,
    ],
    555,
    72,
    { align: "right" }
  );

  // Divider line
  doc.setDrawColor(220, 224, 230);
  doc.setLineWidth(0.75);
  doc.line(40, 105, 555, 105);

  // Billed To & Shipped To
  doc.setTextColor(34, 40, 56);
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.text("Billed to", 40, 126);
  doc.text("Shipped to", 300, 126);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(60);
  const billText = addr(o.billing_address) + (o.customer_email ? `\n${o.customer_email}` : "");
  const shipText = addr(o.shipping_address);
  doc.text(billText, 40, 142);
  doc.text(shipText, 300, 142);

  // Item Table
  autoTable(doc, {
    startY: 215,
    head: [["Item Description", "SKU", "Qty", "Unit Price", "Total (NPR)"]],
    body: (o.order_items || []).map((i) => [
      i.name +
        ([i.size, i.color].filter(Boolean).length
          ? ` (${[i.size, i.color].filter(Boolean).join(", ")})`
          : ""),
      i.sku || "-",
      String(i.quantity),
      rs(i.unit_price),
      rs(i.line_total),
    ]),
    headStyles: {
      fillColor: [34, 40, 56],
      textColor: [255, 255, 255],
      fontStyle: "bold",
      fontSize: 9,
    },
    styles: { fontSize: 8.5, cellPadding: 6 },
    alternateRowStyles: { fillColor: [248, 249, 250] },
    columnStyles: {
      0: { cellWidth: 230 },
      1: { cellWidth: 85 },
      2: { halign: "center", cellWidth: 40 },
      3: { halign: "right", cellWidth: 80 },
      4: { halign: "right", cellWidth: 80 },
    },
  });

  // Summary Totals
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let y = (doc as any).lastAutoTable.finalY + 16;
  const row = (l: string, v: string, bold = false) => {
    doc.setFont("helvetica", bold ? "bold" : "normal");
    doc.text(l, 380, y);
    doc.text(v, 555, y, { align: "right" });
    y += 16;
  };

  doc.setFontSize(9.5);
  doc.setTextColor(34, 40, 56);
  row("Subtotal", rs(o.subtotal));
  if (Number(o.discount) > 0) {
    row(`Discount${o.coupon_code ? ` (${o.coupon_code})` : ""}`, "- " + rs(o.discount));
  }
  row("Shipping Fee", Number(o.shipping_fee) === 0 ? "FREE" : rs(o.shipping_fee));
  row("VAT (13% Nepal)", rs(o.tax));

  // Sub divider before grand total
  doc.setDrawColor(200, 205, 215);
  doc.line(380, y, 555, y);
  y += 14;

  doc.setFontSize(11);
  row("Grand Total", rs(o.total), true);

  y += 14;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(90);
  const paymentMethodLabel =
    o.payment_method === "cod" ? "Cash on Delivery (COD)" : o.payment_method.toUpperCase();
  doc.text(
    `Payment Method: ${paymentMethodLabel}   ·   Payment Status: ${o.payment_status?.toUpperCase() ?? "PENDING"}`,
    40,
    y
  );

  // Footer notice
  doc.setDrawColor(230, 235, 240);
  doc.line(40, 780, 555, 780);
  doc.setFontSize(8);
  doc.setTextColor(120);
  doc.text(
    "This is an electronically generated tax invoice from DOVAN Nepal. Valid without signature under IRD rules.",
    40,
    794
  );
  doc.text(
    "Returns & exchanges are accepted within 7 days of doorstep delivery. For inquiries, email support@dovan.com.np",
    40,
    806
  );

  doc.save(`DOVAN-Invoice-${o.invoice_number ?? o.order_number}.pdf`);
}
