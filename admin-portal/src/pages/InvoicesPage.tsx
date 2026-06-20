import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";

import { Button } from "../components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { downloadMemberInvoicePdf, listMemberInvoices } from "../features/invoices/memberInvoices.api";

const formatMoney = (cents: number, currency = "INR") =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency }).format((cents || 0) / 100);

export function InvoicesPage() {
  const q = useQuery({ queryKey: ["member-invoices"], queryFn: listMemberInvoices });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">GST invoices</h1>
        <p className="text-sm text-muted-foreground">Member payment invoices with GST breakdown (PDF download).</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Invoices</CardTitle>
          <CardDescription>Auto-generated when staff records a payment.</CardDescription>
        </CardHeader>
        <CardContent>
          {q.isLoading ? (
            <div className="text-sm text-muted-foreground">Loading…</div>
          ) : (q.data ?? []).length === 0 ? (
            <div className="text-sm text-muted-foreground">No invoices yet. Record a payment to generate one.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-muted-foreground">
                    <th className="py-2 pr-4">Number</th>
                    <th className="py-2 pr-4">Buyer</th>
                    <th className="py-2 pr-4">Total</th>
                    <th className="py-2 pr-4">Date</th>
                    <th className="py-2">PDF</th>
                  </tr>
                </thead>
                <tbody>
                  {(q.data ?? []).map((inv) => (
                    <tr key={inv.id} className="border-b">
                      <td className="py-2 pr-4 font-medium">{inv.invoiceNumber}</td>
                      <td className="py-2 pr-4">{inv.buyerName}</td>
                      <td className="py-2 pr-4">{formatMoney(inv.totalCents, inv.currency)}</td>
                      <td className="py-2 pr-4">{new Date(inv.issuedAt).toLocaleDateString()}</td>
                      <td className="py-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={async () => {
                            try {
                              await downloadMemberInvoicePdf(inv.id);
                            } catch (e: unknown) {
                              toast.error(e instanceof Error ? e.message : "Download failed");
                            }
                          }}
                        >
                          Download
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
