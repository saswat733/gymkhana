export const buildSubscriptionExpiringEmail = ({
  memberName,
  planName,
  subscriptionId,
  endsAt,
  daysLeft,
}) => {
  const subject = `Your subscription expires in ${daysLeft} day(s)`;
  const planLine = planName ? `Plan: ${planName}\n` : '';

  const text = [
    `Hi ${memberName},`,
    '',
    `Reminder: your subscription is expiring on ${endsAt}.`,
    `Days left: ${daysLeft}`,
    planLine.trimEnd(),
    `Subscription: ${subscriptionId}`,
    '',
    'Please renew at the front desk or contact the gym.',
    '',
    '— GymKhana',
  ]
    .filter((l) => l !== '')
    .join('\n');

  const html = `
    <div style="font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif; line-height: 1.5;">
      <p>Hi ${memberName},</p>
      <p><b>Reminder</b>: your subscription expires on <b>${endsAt}</b>.</p>
      <p>Days left: <b>${daysLeft}</b></p>
      ${planName ? `<p>Plan: <b>${planName}</b></p>` : ''}
      <p>Subscription: <code>${subscriptionId}</code></p>
      <p>Please renew at the front desk or contact the gym.</p>
      <p>— GymKhana</p>
    </div>
  `.trim();

  return { subject, text, html };
};

