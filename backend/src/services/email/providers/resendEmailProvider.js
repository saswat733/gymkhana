import { logger } from '../../../config/logger.js';

const maskEmail = (email) => {
  const s = String(email ?? '');
  const at = s.indexOf('@');
  if (at <= 1) return s;
  return `${s[0]}***${s.slice(at - 1)}`;
};

export class ResendEmailProvider {
  constructor({ apiKey, dryRun }) {
    this.apiKey = apiKey;
    this.dryRun = Boolean(dryRun);
    this.provider = 'resend';
  }

  async send({ to, from, subject, text, html, tags, correlationId }) {
    const accepted = Array.isArray(to) ? to : [to];

    if (this.dryRun) {
      logger.info('[email] resend dry-run', {
        correlationId,
        to: accepted.map(maskEmail),
        subject,
        tags,
      });
      return { messageId: `resend_dry_${Date.now()}`, provider: this.provider, accepted };
    }

    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from,
        to: accepted,
        subject,
        html: html ?? text,
        text,
        tags: tags?.map((name) => ({ name, value: 'true' })),
      }),
    });

    const body = await res.json().catch(() => ({}));
    if (!res.ok) {
      logger.error('[email] resend failed', { status: res.status, body });
      throw new Error(body?.message ?? `Resend API error (${res.status})`);
    }

    return {
      messageId: body.id ?? `resend_${Date.now()}`,
      provider: this.provider,
      accepted,
    };
  }
}
