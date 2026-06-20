import * as memberInvoiceService from '../../services/memberInvoice.service.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { sendSuccess } from '../../utils/ApiResponse.js';

export const listMemberInvoicesHandler = asyncHandler(async (req, res) => {
  const result = await memberInvoiceService.listMemberInvoices({ gymId: req.gymId, query: req.query });
  return sendSuccess(res, { data: { invoices: result.rows }, meta: result.meta });
});

export const downloadMemberInvoicePdfHandler = asyncHandler(async (req, res) => {
  const buf = await memberInvoiceService.getMemberInvoicePdfBuffer({
    gymId: req.gymId,
    invoiceId: req.params.id,
  });
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="invoice-${req.params.id}.pdf"`);
  return res.send(buf);
});
