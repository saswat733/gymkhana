const formatMoney = ({ amountCents, currency }) => {
  const amount = (Number(amountCents) || 0) / 100;
  const cur = String(currency ?? 'INR').toUpperCase();
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: cur }).format(amount);
};

export const buildPaymentReceiptEmail = ({
  memberName,
  subscriptionId,
  planName,
  amountCents,
  currency,
  method,
  status,
  paidAt,
  gatewayRef,
}) => {
  const money = formatMoney({ amountCents, currency });
  const paidAtStr = paidAt ? new Date(paidAt).toISOString() : '';
  const planLine = planName ? `Plan: ${planName}\n` : '';
  const gatewayLine = gatewayRef ? `Gateway Ref: ${gatewayRef}\n` : '';

  const subject = `Payment receipt — ${money}`;

  const text = [
    `Hi ${memberName},`,
    '',
    'Thanks! Your payment has been recorded.',
    '',
    `Amount: ${money}`,
    `Status: ${status}`,
    `Method: ${method}`,
    `Paid at: ${paidAtStr}`,
    planLine.trimEnd(),
    `Subscription: ${subscriptionId}`,
    gatewayLine.trimEnd(),
    '',
    '— GymKhana',
  ]
    .filter((l) => l !== '')
    .join('\n');

  const html = `
    <div style="font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif; line-height: 1.5;">
      <p>Hi ${memberName},</p>
      <p>Thanks! Your payment has been recorded.</p>
      <table style="border-collapse: collapse; margin: 12px 0;">
        <tr><td style="padding: 6px 10px; font-weight: 600;">Amount</td><td style="padding: 6px 10px;">${money}</td></tr>
        <tr><td style="padding: 6px 10px; font-weight: 600;">Status</td><td style="padding: 6px 10px;">${status}</td></tr>
        <tr><td style="padding: 6px 10px; font-weight: 600;">Method</td><td style="padding: 6px 10px;">${method}</td></tr>
        <tr><td style="padding: 6px 10px; font-weight: 600;">Paid at</td><td style="padding: 6px 10px;">${paidAtStr}</td></tr>
        ${planName ? `<tr><td style="padding: 6px 10px; font-weight: 600;">Plan</td><td style="padding: 6px 10px;">${planName}</td></tr>` : ''}
        <tr><td style="padding: 6px 10px; font-weight: 600;">Subscription</td><td style="padding: 6px 10px;">${subscriptionId}</td></tr>
        ${gatewayRef ? `<tr><td style="padding: 6px 10px; font-weight: 600;">Gateway Ref</td><td style="padding: 6px 10px;">${gatewayRef}</td></tr>` : ''}
      </table>
      <p>— GymKhana</p>
    </div>
  `.trim();

  return { subject, text, html };
};

