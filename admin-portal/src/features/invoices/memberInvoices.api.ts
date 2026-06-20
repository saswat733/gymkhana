import { api, unwrap } from "../../lib/api";

type ApiEnvelope<T> =
  | { success: true; message?: string; data: T; meta?: unknown }
  | { success: false; message?: string; error?: { code?: string; details?: unknown } };

export type MemberInvoice = {
  id: string;
  invoiceNumber: string;
  buyerName: string;
  totalCents: number;
  currency: string;
  issuedAt: string;
  paymentId: string;
};

export async function listMemberInvoices() {
  const res = await api.get<ApiEnvelope<{ invoices: MemberInvoice[] }>>("/member-invoices", {
    params: { page: 1, pageSize: 100 },
  });
  return unwrap(res.data).invoices;
}

export async function downloadMemberInvoicePdf(id: string) {
  const res = await api.get(`/member-invoices/${id}/pdf`, { responseType: "blob" });
  const url = URL.createObjectURL(res.data);
  const a = document.createElement("a");
  a.href = url;
  a.download = `invoice-${id}.pdf`;
  a.click();
  URL.revokeObjectURL(url);
}
