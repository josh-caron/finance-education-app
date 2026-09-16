import type { Bindings } from './types';

export interface EmailMessage {
  to: string;
  subject: string;
  text: string;
  html: string;
}

export type SendEmail = (message: EmailMessage) => Promise<void>;

const RESEND_ENDPOINT = 'https://api.resend.com/emails';

/**
 * Builds the sender for auth emails.
 *
 * With RESEND_API_KEY and EMAIL_FROM configured, mail goes out through Resend.
 * Without them, nothing is sent: on localhost the full message, link included,
 * is printed so password reset can be exercised during development; anywhere
 * else only the subject is logged, because a reset link in production logs is a
 * working credential.
 *
 * Sending never throws into the request. Better Auth runs it as a background
 * task, and a failed email should not fail the sign-up that triggered it.
 */
export function createMailer(env: Bindings): SendEmail {
  const { RESEND_API_KEY: apiKey, EMAIL_FROM: from } = env;

  if (!apiKey || !from) {
    const local = isLocal(env.BETTER_AUTH_URL);

    return async (message) => {
      if (local) {
        console.info(
          `[email not sent: no RESEND_API_KEY]\nTo: ${message.to}\nSubject: ${message.subject}\n\n${message.text}`,
        );
      } else {
        console.error('Email not sent: RESEND_API_KEY or EMAIL_FROM is not configured', {
          subject: message.subject,
        });
      }
    };
  }

  return async (message) => {
    const response = await fetch(RESEND_ENDPOINT, {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from,
        to: [message.to],
        subject: message.subject,
        text: message.text,
        html: message.html,
      }),
    });

    if (!response.ok) {
      // Resend's error body names the problem (unverified domain, bad key,
      // quota). Log it without the message body, which may contain a link.
      console.error('Resend rejected an email', {
        status: response.status,
        subject: message.subject,
        detail: await response.text().catch(() => ''),
      });
    }
  };
}

function isLocal(baseUrl: string): boolean {
  try {
    const { hostname } = new URL(baseUrl);
    return hostname === 'localhost' || hostname === '127.0.0.1';
  } catch {
    return false;
  }
}

const APP_NAME = 'Finance Education App';

export function verificationEmail(to: string, name: string, url: string): EmailMessage {
  return {
    to,
    subject: `Verify your email for ${APP_NAME}`,
    text: [
      `Hi ${name},`,
      '',
      'Confirm this is your email address so you can reset your password if you ever need to:',
      url,
      '',
      "If you didn't create an account, you can ignore this email.",
    ].join('\n'),
    html: layout(
      `<p>Hi ${escapeHtml(name)},</p>
       <p>Confirm this is your email address so you can reset your password if you ever need to.</p>
       ${button(url, 'Verify email')}
       <p>If you didn't create an account, you can ignore this email.</p>`,
    ),
  };
}

export function passwordResetEmail(to: string, name: string, url: string): EmailMessage {
  return {
    to,
    subject: `Reset your ${APP_NAME} password`,
    text: [
      `Hi ${name},`,
      '',
      'Use this link to choose a new password. It expires in one hour:',
      url,
      '',
      "If you didn't ask to reset your password, you can ignore this email.",
    ].join('\n'),
    html: layout(
      `<p>Hi ${escapeHtml(name)},</p>
       <p>Use this link to choose a new password. It expires in one hour.</p>
       ${button(url, 'Reset password')}
       <p>If you didn't ask to reset your password, you can ignore this email.</p>`,
    ),
  };
}

function layout(body: string): string {
  return `<!doctype html><html><body style="font-family:system-ui,sans-serif;line-height:1.5;color:#111;max-width:480px;margin:24px auto;padding:0 16px">${body}</body></html>`;
}

function button(url: string, label: string): string {
  const href = escapeHtml(url);
  return `<p><a href="${href}" style="display:inline-block;background:#1B7F4B;color:#fff;padding:10px 18px;border-radius:8px;text-decoration:none">${label}</a></p>
       <p style="font-size:13px;color:#555">Or paste this into your browser:<br>${href}</p>`;
}

/** Learner names are user-supplied and end up inside HTML. */
export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
