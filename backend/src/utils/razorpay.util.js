import crypto from 'crypto';
import { env } from '../config/env.js';

export const verifyWebhookSignature = ({ body, signature }) => {
  const secret = env.razorpay.webhookSecret;
  if (!secret) return false;
  const expected = crypto.createHmac('sha256', secret).update(body).digest('hex');
  return expected === signature;
};

export const verifyCheckoutSignature = ({ orderId, paymentId, signature }) => {
  if (!env.razorpay.keySecret) return false;
  const expected = crypto
    .createHmac('sha256', env.razorpay.keySecret)
    .update(`${orderId}|${paymentId}`)
    .digest('hex');
  return expected === signature;
};
