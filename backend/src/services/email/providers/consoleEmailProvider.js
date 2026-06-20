import { logger } from '../../../config/logger.js';

const maskEmail = (email) => {
  const s = String(email ?? '');
  const at = s.indexOf('@');
  if (at <= 1) return s;
  return `${s[0]}***${s.slice(at - 1)}`;
};

export class ConsoleEmailProvider {
  constructor({ dryRun }) {
    this.dryRun = Boolean(dryRun);
    this.provider = 'console';
  }

  async send({ to, from, subject, text, html, tags, correlationId }) {
    const accepted = Array.isArray(to) ? to : [to];
    const payload = {
      provider: this.provider,
      dryRun: this.dryRun,
      correlationId,
      from: maskEmail(from),
      to: accepted.map(maskEmail),
      subject,
      text,
      html,
      tags,
    };

    // Intentionally logs full body in dev; keep provider swap-friendly later.
    logger.info('[email] send', payload);

    return {
      messageId: `console_${Date.now()}`,
      provider: this.provider,
      accepted,
    };
  }
}

