import { env } from '../../config/env.js';
import { ApiError } from '../../utils/ApiError.js';
import { ConsoleEmailProvider } from './providers/consoleEmailProvider.js';
import { ResendEmailProvider } from './providers/resendEmailProvider.js';
import { buildPaymentReceiptEmail } from './templates/paymentReceipt.js';
import { buildSubscriptionExpiringEmail } from './templates/subscriptionExpiring.js';

const normalizeToList = (to) => (Array.isArray(to) ? to : [to]).filter(Boolean);

export const createEmailService = () => {
  const providerName = String(env.email.provider ?? 'console').toLowerCase();
  const dryRun = Boolean(env.email.dryRun);

  let provider;
  switch (providerName) {
    case 'console':
      provider = new ConsoleEmailProvider({ dryRun });
      break;
    case 'resend':
      if (!env.email.resendApiKey) {
        throw new Error('[email] RESEND_API_KEY is required when EMAIL_PROVIDER=resend');
      }
      provider = new ResendEmailProvider({ apiKey: env.email.resendApiKey, dryRun });
      break;
    default:
      throw new Error(`[email] Unsupported EMAIL_PROVIDER: ${providerName}`);
  }

  const send = async ({
    to,
    from = env.email.from,
    subject,
    text,
    html,
    tags,
    correlationId,
  }) => {
    const toList = normalizeToList(to);
    if (!toList.length) throw ApiError.badRequest('Email "to" is required');
    if (!subject) throw ApiError.badRequest('Email "subject" is required');
    if (!text && !html) throw ApiError.badRequest('Email body is required');

    return provider.send({
      to: toList,
      from,
      subject,
      text,
      html,
      tags,
      correlationId,
    });
  };

  const sendPaymentReceipt = async ({ to, correlationId, ...ctx }) => {
    const { subject, text, html } = buildPaymentReceiptEmail(ctx);
    return send({
      to,
      subject,
      text,
      html,
      tags: ['payment', 'receipt'],
      correlationId,
    });
  };

  const sendSubscriptionExpiring = async ({ to, correlationId, ...ctx }) => {
    const { subject, text, html } = buildSubscriptionExpiringEmail(ctx);
    return send({
      to,
      subject,
      text,
      html,
      tags: ['subscription', 'expiry'],
      correlationId,
    });
  };

  return {
    provider: providerName,
    dryRun,
    send,
    sendPaymentReceipt,
    sendSubscriptionExpiring,
  };
};

export const emailService = createEmailService();

