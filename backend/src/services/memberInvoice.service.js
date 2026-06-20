import PDFDocument from 'pdfkit';
import { Gym, Member, MemberInvoice, Payment, Plan, Subscription, User } from '../models/index.js';
import { ApiError } from '../utils/ApiError.js';
import { buildMeta, getPagination } from '../utils/pagination.js';

const issueNextMemberInvoiceNumber = async ({ gymId }) => {
  const gym = await Gym.findByPk(gymId);
  if (!gym) throw ApiError.notFound('Gym not found');
  const prefix = gym.memberInvoicePrefix || 'INV';
  const seq = Number(gym.memberInvoiceSeq || 1);
  const yyyy = new Date().getFullYear();
  const invoiceNumber = `${prefix}-${yyyy}-${String(seq).padStart(6, '0')}`;
  await gym.update({ memberInvoiceSeq: seq + 1 });
  return invoiceNumber;
};

export const createInvoiceForPayment = async ({ paymentId, gymId, gstPercent }) => {
  const payment = await Payment.findByPk(paymentId, {
    include: [
      {
        model: Subscription,
        include: [{ model: Member, include: [{ model: User }] }, { model: Plan }],
      },
    ],
  });
  if (!payment) throw ApiError.notFound('Payment not found');
  if (String(payment.gymId) !== String(gymId)) throw ApiError.forbidden();

  const existing = await MemberInvoice.findOne({ where: { paymentId } });
  if (existing) return existing;

  const gym = await Gym.findByPk(gymId);
  const pct = gstPercent ?? Number(gym?.defaultGstPercent ?? 18);
  const subtotalCents = payment.amountCents;
  const gstCents = Math.round((subtotalCents * pct) / 100);
  const totalCents = subtotalCents + gstCents;

  const buyer = payment.Subscription?.Member?.User;
  const invoiceNumber = await issueNextMemberInvoiceNumber({ gymId });

  return MemberInvoice.create({
    gymId,
    paymentId,
    invoiceNumber,
    buyerName: buyer?.name ?? 'Member',
    buyerEmail: buyer?.email ?? null,
    buyerGstin: null,
    subtotalCents,
    gstPercent: pct,
    gstCents,
    totalCents,
    currency: payment.currency,
    issuedAt: payment.paidAt ?? new Date(),
  });
};

export const listMemberInvoices = async ({ gymId, query }) => {
  if (!gymId) throw ApiError.badRequest('gymId is required');
  const { page, pageSize, offset, limit } = getPagination(query);
  const { rows, count } = await MemberInvoice.findAndCountAll({
    where: { gymId },
    offset,
    limit,
    order: [['issuedAt', 'DESC']],
  });
  return { rows, meta: buildMeta({ page, pageSize, total: count }) };
};

export const getMemberInvoicePdfBuffer = async ({ gymId, invoiceId }) => {
  const invoice = await MemberInvoice.findByPk(invoiceId, {
    include: [{ model: Payment, include: [{ model: Subscription, include: [{ model: Plan }] }] }],
  });
  if (!invoice) throw ApiError.notFound('Invoice not found');
  if (String(invoice.gymId) !== String(gymId)) throw ApiError.forbidden();

  const gym = await Gym.findByPk(gymId);

  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 50 });
    const chunks = [];
    doc.on('data', (c) => chunks.push(c));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    const fmt = (cents) => `INR ${(cents / 100).toFixed(2)}`;

    doc.fontSize(20).text('TAX INVOICE', { align: 'center' });
    doc.moveDown();
    doc.fontSize(12).text(gym?.legalName || gym?.name || 'Gym', { align: 'left' });
    if (gym?.gstin) doc.text(`GSTIN: ${gym.gstin}`);
    if (gym?.billingAddressLine1) doc.text(gym.billingAddressLine1);
    if (gym?.billingCity) doc.text(`${gym.billingCity}${gym.billingState ? `, ${gym.billingState}` : ''}`);
    doc.moveDown();
    doc.text(`Invoice No: ${invoice.invoiceNumber}`);
    doc.text(`Date: ${new Date(invoice.issuedAt).toLocaleDateString('en-IN')}`);
    doc.moveDown();
    doc.text(`Bill To: ${invoice.buyerName}`);
    if (invoice.buyerEmail) doc.text(invoice.buyerEmail);
    doc.moveDown();
    const planName = invoice.Payment?.Subscription?.Plan?.name ?? 'Membership';
    doc.text(`Description: ${planName}`);
    doc.moveDown();
    doc.text(`Subtotal: ${fmt(invoice.subtotalCents)}`);
    if (invoice.gstPercent) doc.text(`GST (${invoice.gstPercent}%): ${fmt(invoice.gstCents ?? 0)}`);
    doc.fontSize(14).text(`Total: ${fmt(invoice.totalCents)}`, { underline: true });
    doc.end();
  });
};
