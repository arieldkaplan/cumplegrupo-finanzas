/**
 * Integración Resend — emails transaccionales. Interfaz y mock para MVP.
 * En producción: usar RESEND_API_KEY y @resend/node.
 */

export type EmailType =
  | "group_invitation"
  | "birthday_reminder"
  | "payment_confirmation"
  | "gift_defined";

export interface SendEmailParams {
  to: string;
  type: EmailType;
  subject: string;
  data: Record<string, unknown>;
}

export interface ResendService {
  send(params: SendEmailParams): Promise<{ success: boolean; id?: string }>;
}

/** Mock: loguea y opcionalmente envía si RESEND_API_KEY está definido. */
export const mockResendService: ResendService = {
  async send(params) {
    console.log("[Resend mock] send", params.type, params.to, params.subject);
    if (process.env.RESEND_API_KEY) {
      // const resend = new Resend(process.env.RESEND_API_KEY);
      // const { data, error } = await resend.emails.send({ ... });
      // return { success: !error, id: data?.id };
    }
    return { success: true, id: `mock_${Date.now()}` };
  },
};

export function getResendService(): ResendService {
  return mockResendService;
}

/** Helpers para construir emails por tipo. */
export function buildGroupInvitationEmail(data: {
  inviterName: string;
  groupName: string;
  inviteLink: string;
}): { subject: string; body: string } {
  return {
    subject: `${data.inviterName} te invitó al grupo ${data.groupName}`,
    body: `Hola,\n\n${data.inviterName} te invitó a unirte al grupo "${data.groupName}" en CumpleGrupo.\n\nUnite acá: ${data.inviteLink}`,
  };
}

export function buildBirthdayReminderEmail(data: {
  childName: string;
  date: string;
  groupName: string;
}): { subject: string; body: string } {
  return {
    subject: `Próximo cumple: ${data.childName} — ${data.date}`,
    body: `Recordatorio: el cumple de ${data.childName} es el ${data.date}. Grupo: ${data.groupName}.`,
  };
}

export function buildPaymentConfirmationEmail(data: {
  amount: string;
  groupName: string;
}): { subject: string; body: string } {
  return {
    subject: `Pago registrado: ${data.amount} — ${data.groupName}`,
    body: `Tu pago de ${data.amount} para el grupo ${data.groupName} fue registrado correctamente.`,
  };
}

export function buildGiftDefinedEmail(data: {
  childName: string;
  giftName: string;
  groupName: string;
}): { subject: string; body: string } {
  return {
    subject: `Regalo definido para ${data.childName}: ${data.giftName}`,
    body: `El regalo para ${data.childName} en ${data.groupName} fue definido: ${data.giftName}.`,
  };
}
