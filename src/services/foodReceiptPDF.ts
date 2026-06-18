import jsPDF from 'jspdf';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

interface ReceiptData {
  orderNumber: string;
  orderDate: string;
  customerName: string;
  customerPhone: string;
  restaurantName: string;
  restaurantAddress: string;
  restaurantPhone: string;
  items: Array<{
    name: string;
    quantity: number;
    unitPrice: number;
    total: number;
  }>;
  subtotal: number;
  deliveryFee: number;
  serviceFee: number;
  totalAmount: number;
  currency: string;
  deliveryAddress: string;
  paymentMethod: string;
  status: string;
}

const getPaymentMethodLabel = (method: string): string => {
  const labels: Record<string, string> = {
    kwenda_pay: 'TembeaPay',
    cash: 'Espèces',
    card: 'Carte bancaire',
    mobile_money: 'Mobile Money'
  };
  return labels[method] || method;
};

const fmtNum = (amount: number): string => {
  return Math.floor(amount).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
};

const shortOrderNumber = (orderNumber: string): string => {
  const parts = orderNumber.split('-');
  return '#' + (parts.length > 1 ? parts[parts.length - 1] : orderNumber);
};

const RED = { r: 200, g: 30, b: 30 };
const BLACK = { r: 0, g: 0, b: 0 };
const GRAY = { r: 80, g: 80, b: 80 };

const toBase64 = (buf: ArrayBuffer): string => {
  const bytes = new Uint8Array(buf);
  let s = '';
  for (let i = 0; i < bytes.length; i++) s += String.fromCharCode(bytes[i]);
  return btoa(s);
};

const fetchWithTimeout = async (url: string, timeoutMs = 5000): Promise<ArrayBuffer | null> => {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(id);
    return res.ok ? res.arrayBuffer() : null;
  } catch {
    clearTimeout(id);
    return null;
  }
};

export const generateFoodReceipt = async (receiptData: ReceiptData): Promise<void> => {
  const itemCount = receiptData.items.length;
  const pageHeight = Math.max(130, 110 + itemCount * 4.5);
  const W = 80;
  const mx = 5;
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: [W, pageHeight] });

  // Load Montserrat with timeout and italic variant
  let fontFamily = 'courier';
  try {
    const [regular, bold, italic] = await Promise.all([
      fetchWithTimeout('https://fonts.gstatic.com/s/montserrat/v29/JTUHjIg1_i6t8kCHKm4532VJOt5-QNFgpCtr6Hw5aXp-p7K4KLg.ttf'),
      fetchWithTimeout('https://fonts.gstatic.com/s/montserrat/v29/JTUHjIg1_i6t8kCHKm4532VJOt5-QNFgpCuM73w5aXp-p7K4KLg.ttf'),
      fetchWithTimeout('https://fonts.gstatic.com/s/montserrat/v29/JTUFjIg1_i6t8kCHKm459Wx7xQYXK0vOoz6jq6R8aX9-p7K4KLg.ttf'),
    ]);
    if (regular && bold) {
      doc.addFileToVFS('Mont-R.ttf', toBase64(regular));
      doc.addFont('Mont-R.ttf', 'Mont', 'normal');
      doc.addFileToVFS('Mont-B.ttf', toBase64(bold));
      doc.addFont('Mont-B.ttf', 'Mont', 'bold');
      if (italic) {
        doc.addFileToVFS('Mont-I.ttf', toBase64(italic));
        doc.addFont('Mont-I.ttf', 'Mont', 'italic');
      }
      fontFamily = 'Mont';
    } else {
      console.warn('Montserrat fonts failed to load, using courier fallback');
    }
  } catch (e) {
    console.warn('Font loading error, using courier fallback:', e);
  }

  const hasItalic = fontFamily === 'Mont';

  const setF = (style: 'normal' | 'bold' | 'italic', size: number) => {
    const s = style === 'italic' && !hasItalic ? 'normal' : style;
    doc.setFont(fontFamily, s);
    doc.setFontSize(size);
  };

  let y = 6;

  // Dashed separator
  const dashedLine = () => {
    setF('normal', 7);
    doc.setTextColor(GRAY.r, GRAY.g, GRAY.b);
    doc.text('- - - - - - - - - - - - - - - - - - - - -', W / 2, y, { align: 'center' });
    y += 3.5;
  };

  // ===== HEADER =====
  setF('bold', 14);
  doc.setTextColor(RED.r, RED.g, RED.b);
  doc.text('TAGA FOOD', W / 2, y, { align: 'center' });
  y += 1.5;

  // Red decorative line under title
  doc.setDrawColor(RED.r, RED.g, RED.b);
  doc.setLineWidth(0.3);
  doc.line(W / 2 - 15, y, W / 2 + 15, y);
  y += 3;

  setF('italic', 6.5);
  doc.setTextColor(GRAY.r, GRAY.g, GRAY.b);
  doc.text("L'authenticité à chaque bouchée", W / 2, y, { align: 'center' });
  y += 4;

  // Restaurant info centered
  setF('bold', 8);
  doc.setTextColor(BLACK.r, BLACK.g, BLACK.b);
  doc.text(receiptData.restaurantName, W / 2, y, { align: 'center' });
  y += 3.5;

  if (receiptData.restaurantAddress) {
    setF('normal', 6.5);
    doc.setTextColor(GRAY.r, GRAY.g, GRAY.b);
    const addr = receiptData.restaurantAddress.length > 38
      ? receiptData.restaurantAddress.substring(0, 38) + '...'
      : receiptData.restaurantAddress;
    doc.text(addr, W / 2, y, { align: 'center' });
    y += 3;
  }

  if (receiptData.restaurantPhone) {
    setF('normal', 6.5);
    doc.setTextColor(GRAY.r, GRAY.g, GRAY.b);
    doc.text(`Tél: ${receiptData.restaurantPhone}`, W / 2, y, { align: 'center' });
    y += 3;
  }

  dashedLine();

  // ===== ORDER INFO =====
  const orderDate = new Date(receiptData.orderDate);
  setF('normal', 7);
  doc.setTextColor(BLACK.r, BLACK.g, BLACK.b);

  doc.text(`Date : ${format(orderDate, 'dd/MM/yyyy', { locale: fr })}`, mx, y);
  y += 3.5;
  doc.text(`Heure : ${format(orderDate, 'HH:mm', { locale: fr })}`, mx, y);
  y += 3.5;

  setF('bold', 7);
  doc.text(`Ticket n° : ${shortOrderNumber(receiptData.orderNumber)}`, mx, y);
  y += 3.5;

  setF('normal', 7);
  doc.text(`Client : ${receiptData.customerName}`, mx, y);
  y += 3.5;

  if (receiptData.customerPhone && receiptData.customerPhone !== 'N/A') {
    doc.text(`Tél : ${receiptData.customerPhone}`, mx, y);
    y += 3.5;
  }

  dashedLine();

  // ===== ITEMS =====
  setF('bold', 6.5);
  doc.setTextColor(GRAY.r, GRAY.g, GRAY.b);
  doc.text('Qté', mx, y);
  doc.text('Article', mx + 8, y);
  doc.text('P.U.', mx + 45, y, { align: 'right' });
  doc.text('Total', W - mx, y, { align: 'right' });
  y += 3.5;

  setF('normal', 7);
  doc.setTextColor(BLACK.r, BLACK.g, BLACK.b);

  for (const item of receiptData.items) {
    const name = item.name.length > 16 ? item.name.substring(0, 16) + '.' : item.name;
    doc.text(`${item.quantity}`, mx, y);
    doc.text(name, mx + 8, y);
    doc.text(fmtNum(item.unitPrice), mx + 45, y, { align: 'right' });
    doc.text(fmtNum(item.total), W - mx, y, { align: 'right' });
    y += 4;
  }

  dashedLine();

  // ===== TOTALS =====
  const totalLine = (label: string, amount: number) => {
    setF('normal', 7);
    doc.setTextColor(BLACK.r, BLACK.g, BLACK.b);
    doc.text(label, mx, y);
    doc.text(fmtNum(amount), W - mx, y, { align: 'right' });
    y += 3.5;
  };

  totalLine('Sous-total', receiptData.subtotal);
  totalLine('Livraison', receiptData.deliveryFee);
  totalLine('Service', receiptData.serviceFee);

  y += 1;

  // TOTAL À PAYER
  setF('bold', 9);
  doc.setTextColor(RED.r, RED.g, RED.b);
  doc.text(`TOTAL À PAYER : ${fmtNum(receiptData.totalAmount)} ${receiptData.currency}`, W / 2, y, { align: 'center' });
  y += 5;

  // Payment method
  setF('normal', 7);
  doc.setTextColor(BLACK.r, BLACK.g, BLACK.b);
  doc.text(`Mode de paiement : ${getPaymentMethodLabel(receiptData.paymentMethod)}`, W / 2, y, { align: 'center' });
  y += 3.5;

  dashedLine();

  // ===== FOOTER =====
  setF('bold', 8);
  doc.setTextColor(BLACK.r, BLACK.g, BLACK.b);
  doc.text('MERCI DE VOTRE COMMANDE !', W / 2, y, { align: 'center' });
  y += 3.5;

  setF('normal', 7);
  doc.setTextColor(GRAY.r, GRAY.g, GRAY.b);
  doc.text('@kwendaFood', W / 2, y, { align: 'center' });
  y += 3.5;

  setF('normal', 6);
  doc.text('Gardez votre ticket pour toute', W / 2, y, { align: 'center' });
  y += 2.5;
  doc.text('réclamation.', W / 2, y, { align: 'center' });
  y += 3;

  dashedLine();

  const shortNum = shortOrderNumber(receiptData.orderNumber).replace('#', '');
  doc.save(`kwenda-food-recu-${shortNum}.pdf`);
};
