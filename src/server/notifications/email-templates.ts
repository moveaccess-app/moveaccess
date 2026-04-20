// Transactional email templates for MoveAccess.
//
// Pure functions returning { subject, html } for each notification type.
// All templates share a common layout wrapper for consistency.
// No external template engine — just tagged template literals.

// ─── Types ───────────────────────────────────────────────────

export interface InviteEmailData {
  recipientName: string | null;
  academyName: string;
  inviteUrl: string;
  expiresAt: string;            // ISO date
}

export interface DueReminderEmailData {
  studentName: string;
  planName: string;
  amount: number;
  dueDate: string;              // ISO date
  paymentLink: string | null;   // invoice_url or bank_slip_url
  academyName: string;
}

export interface OverdueNoticeEmailData {
  studentName: string;
  planName: string;
  amount: number;
  dueDate: string;              // ISO date
  daysOverdue: number;
  paymentLink: string | null;
  academyName: string;
}

export interface PreBlockEmailData {
  studentName: string;
  academyName: string;
  totalOverdue: number;
  oldestDueDate: string;        // ISO date
  graceDays: number;
  portalUrl: string;
}

interface EmailOutput {
  subject: string;
  html: string;
}

// ─── Formatters ──────────────────────────────────────────────

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

function formatCurrency(value: number): string {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

// ─── Layout wrapper ─────────────────────────────────────────

function layout(body: string): string {
  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>MoveAccess</title>
  <style>
    body { margin: 0; padding: 0; background-color: #f4f4f5; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; }
    .container { max-width: 560px; margin: 0 auto; padding: 32px 16px; }
    .card { background: #ffffff; border-radius: 8px; padding: 32px; }
    .logo { text-align: center; margin-bottom: 24px; font-size: 20px; font-weight: 700; color: #18181b; }
    h1 { font-size: 18px; font-weight: 600; color: #18181b; margin: 0 0 16px; }
    p { font-size: 14px; line-height: 1.6; color: #3f3f46; margin: 0 0 12px; }
    .highlight { font-weight: 600; color: #18181b; }
    .amount { font-size: 20px; font-weight: 700; color: #18181b; }
    .cta { display: inline-block; background-color: #18181b; color: #ffffff; text-decoration: none; padding: 12px 24px; border-radius: 6px; font-size: 14px; font-weight: 600; margin: 16px 0; }
    .cta-danger { background-color: #dc2626; }
    .cta-warning { background-color: #d97706; }
    .detail { background: #f4f4f5; border-radius: 6px; padding: 16px; margin: 16px 0; }
    .detail-row { display: flex; justify-content: space-between; font-size: 13px; color: #52525b; padding: 4px 0; }
    .detail-label { color: #71717a; }
    .footer { text-align: center; padding: 16px 0; font-size: 12px; color: #a1a1aa; }
    .divider { border: none; border-top: 1px solid #e4e4e7; margin: 20px 0; }
    .badge-overdue { display: inline-block; background: #fef2f2; color: #dc2626; font-size: 12px; font-weight: 600; padding: 2px 8px; border-radius: 4px; }
    .badge-warning { display: inline-block; background: #fffbeb; color: #d97706; font-size: 12px; font-weight: 600; padding: 2px 8px; border-radius: 4px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="logo">MoveAccess</div>
    <div class="card">
      ${body}
    </div>
    <div class="footer">
      Este é um e-mail transacional automático do MoveAccess.<br/>
      Não responda diretamente a este e-mail.
    </div>
  </div>
</body>
</html>`;
}

// ─── 1. Invite ───────────────────────────────────────────────

export function buildInviteEmail(data: InviteEmailData): EmailOutput {
  const greeting = data.recipientName
    ? `Olá, ${data.recipientName}!`
    : 'Olá!';

  const body = `
    <h1>Você foi convidado!</h1>
    <p>${greeting}</p>
    <p>
      Você recebeu um convite para se cadastrar na
      <span class="highlight">${data.academyName}</span> pelo MoveAccess.
    </p>
    <p>Use o botão abaixo para criar sua conta e completar o cadastro:</p>
    <div style="text-align: center;">
      <a href="${data.inviteUrl}" class="cta">Criar minha conta</a>
    </div>
    <hr class="divider" />
    <p style="font-size: 12px; color: #71717a;">
      Este convite é válido até <strong>${formatDate(data.expiresAt)}</strong>.
      Caso o link expire, peça um novo convite na recepção da academia.
    </p>`;

  return {
    subject: `Convite: cadastre-se na ${data.academyName}`,
    html: layout(body),
  };
}

// ─── 2. Due reminder (D-3) ──────────────────────────────────

export function buildDueReminderEmail(data: DueReminderEmailData): EmailOutput {
  const ctaBlock = data.paymentLink
    ? `<div style="text-align: center;">
        <a href="${data.paymentLink}" class="cta">Pagar agora</a>
      </div>`
    : `<p style="font-size: 13px; color: #71717a;">
        Entre em contato com a academia para informações de pagamento.
      </p>`;

  const body = `
    <h1>Lembrete de vencimento</h1>
    <p>Olá, ${data.studentName}.</p>
    <p>Sua cobrança referente ao plano <span class="highlight">${data.planName}</span> vence em breve.</p>
    <div class="detail">
      <div class="detail-row">
        <span class="detail-label">Valor</span>
        <span class="amount">${formatCurrency(data.amount)}</span>
      </div>
      <div class="detail-row">
        <span class="detail-label">Vencimento</span>
        <span class="highlight">${formatDate(data.dueDate)}</span>
      </div>
      <div class="detail-row">
        <span class="detail-label">Plano</span>
        <span>${data.planName}</span>
      </div>
    </div>
    ${ctaBlock}
    <hr class="divider" />
    <p style="font-size: 12px; color: #71717a;">
      Se você já realizou o pagamento, desconsidere este aviso.
    </p>`;

  return {
    subject: `Lembrete: cobrança de ${formatCurrency(data.amount)} vence em ${formatDate(data.dueDate)}`,
    html: layout(body),
  };
}

// ─── 3. Overdue notice (D+1) ────────────────────────────────

export function buildOverdueNoticeEmail(data: OverdueNoticeEmailData): EmailOutput {
  const ctaBlock = data.paymentLink
    ? `<div style="text-align: center;">
        <a href="${data.paymentLink}" class="cta cta-warning">Regularizar pagamento</a>
      </div>`
    : `<p style="font-size: 13px; color: #71717a;">
        Entre em contato com a academia para regularizar sua situação.
      </p>`;

  const body = `
    <h1>Cobrança vencida</h1>
    <p>Olá, ${data.studentName}.</p>
    <p>
      Sua cobrança referente ao plano <span class="highlight">${data.planName}</span>
      venceu em <span class="highlight">${formatDate(data.dueDate)}</span>.
      <span class="badge-overdue">${data.daysOverdue} dia${data.daysOverdue > 1 ? 's' : ''} em atraso</span>
    </p>
    <div class="detail">
      <div class="detail-row">
        <span class="detail-label">Valor</span>
        <span class="amount">${formatCurrency(data.amount)}</span>
      </div>
      <div class="detail-row">
        <span class="detail-label">Vencimento</span>
        <span style="color: #dc2626; font-weight: 600;">${formatDate(data.dueDate)}</span>
      </div>
      <div class="detail-row">
        <span class="detail-label">Plano</span>
        <span>${data.planName}</span>
      </div>
    </div>
    ${ctaBlock}
    <hr class="divider" />
    <p style="font-size: 12px; color: #71717a;">
      Regularize sua situação para manter seu acesso ativo.
      Se já realizou o pagamento, desconsidere este aviso.
    </p>`;

  return {
    subject: `Cobrança vencida — ${formatCurrency(data.amount)} (${data.planName})`,
    html: layout(body),
  };
}

// ─── 4. Pre-block warning ───────────────────────────────────

export function buildPreBlockEmail(data: PreBlockEmailData): EmailOutput {
  const body = `
    <h1>Aviso importante sobre seu acesso</h1>
    <p>Olá, ${data.studentName}.</p>
    <p>
      Identificamos pendências financeiras na sua conta na
      <span class="highlight">${data.academyName}</span> que podem resultar na
      <strong>suspensão do seu acesso</strong>.
    </p>
    <div class="detail">
      <div class="detail-row">
        <span class="detail-label">Total em aberto</span>
        <span class="amount" style="color: #dc2626;">${formatCurrency(data.totalOverdue)}</span>
      </div>
      <div class="detail-row">
        <span class="detail-label">Vencimento mais antigo</span>
        <span style="color: #dc2626;">${formatDate(data.oldestDueDate)}</span>
      </div>
      ${data.graceDays > 0 ? `
      <div class="detail-row">
        <span class="detail-label">Tolerância</span>
        <span>${data.graceDays} dia${data.graceDays > 1 ? 's' : ''} após o vencimento</span>
      </div>` : ''}
    </div>
    <p>
      <span class="badge-warning">Ação necessária</span>
      Regularize suas pendências para evitar a suspensão do acesso.
    </p>
    <div style="text-align: center;">
      <a href="${data.portalUrl}" class="cta cta-danger">Ver minha situação</a>
    </div>
    <hr class="divider" />
    <p style="font-size: 12px; color: #71717a;">
      Dúvidas? Entre em contato diretamente com a recepção da sua academia.
    </p>`;

  return {
    subject: `Aviso: seu acesso na ${data.academyName} pode ser suspenso`,
    html: layout(body),
  };
}

// ─── 5. Escalation (D+14) ───────────────────────────────────

export interface EscalationEmailData {
  studentName: string;
  planName: string;
  amount: number;
  dueDate: string;              // ISO date
  daysOverdue: number;
  totalOverdue: number;
  overdueCount: number;
  paymentLink: string | null;
  academyName: string;
}

export function buildEscalationEmail(data: EscalationEmailData): EmailOutput {
  const ctaBlock = data.paymentLink
    ? `<div style="text-align: center;">
        <a href="${data.paymentLink}" class="cta cta-danger">Regularizar agora</a>
      </div>`
    : `<p style="font-size: 13px; color: #71717a;">
        Entre em contato com a academia para regularizar sua situação.
      </p>`;

  const body = `
    <h1>Cobrança em atraso — aviso urgente</h1>
    <p>Olá, ${data.studentName}.</p>
    <p>
      Sua cobrança referente ao plano <span class="highlight">${data.planName}</span>
      está em atraso há <span style="color: #dc2626; font-weight: 700;">${data.daysOverdue} dias</span>.
      <span class="badge-overdue">Ação urgente</span>
    </p>
    <div class="detail">
      <div class="detail-row">
        <span class="detail-label">Valor da cobrança</span>
        <span class="amount" style="color: #dc2626;">${formatCurrency(data.amount)}</span>
      </div>
      <div class="detail-row">
        <span class="detail-label">Vencimento</span>
        <span style="color: #dc2626; font-weight: 600;">${formatDate(data.dueDate)}</span>
      </div>
      ${data.overdueCount > 1 ? `
      <div class="detail-row">
        <span class="detail-label">Total em aberto</span>
        <span style="color: #dc2626; font-weight: 600;">${formatCurrency(data.totalOverdue)} (${data.overdueCount} cobranças)</span>
      </div>` : ''}
      <div class="detail-row">
        <span class="detail-label">Dias em atraso</span>
        <span style="color: #dc2626; font-weight: 600;">${data.daysOverdue} dias</span>
      </div>
    </div>
    <p style="font-size: 13px; color: #dc2626; font-weight: 500;">
      A persistência desta pendência pode resultar na suspensão do seu acesso e demais consequências previstas em contrato.
    </p>
    ${ctaBlock}
    <hr class="divider" />
    <p style="font-size: 12px; color: #71717a;">
      Se já realizou o pagamento, aguarde a confirmação ou entre em contato com a academia.
    </p>`;

  return {
    subject: `Urgente: cobrança de ${formatCurrency(data.amount)} em atraso há ${data.daysOverdue} dias`,
    html: layout(body),
  };
}

// ─── 6. Subscription expiring (D-7) ─────────────────────────

export interface SubscriptionExpiringEmailData {
  studentName: string;
  planName: string;
  price: number;
  expiresAt: string;            // ISO date
  daysRemaining: number;
  academyName: string;
  portalUrl: string;
}

export function buildSubscriptionExpiringEmail(data: SubscriptionExpiringEmailData): EmailOutput {
  const body = `
    <h1>Seu plano está prestes a vencer</h1>
    <p>Olá, ${data.studentName}.</p>
    <p>
      Seu plano <span class="highlight">${data.planName}</span> na
      <span class="highlight">${data.academyName}</span> vence em
      <span class="highlight">${data.daysRemaining} dia${data.daysRemaining > 1 ? 's' : ''}</span>.
    </p>
    <div class="detail">
      <div class="detail-row">
        <span class="detail-label">Plano</span>
        <span class="highlight">${data.planName}</span>
      </div>
      <div class="detail-row">
        <span class="detail-label">Valor</span>
        <span class="amount">${formatCurrency(data.price)}</span>
      </div>
      <div class="detail-row">
        <span class="detail-label">Vencimento</span>
        <span class="highlight">${formatDate(data.expiresAt)}</span>
      </div>
    </div>
    <p>
      <span class="badge-warning">Renove para continuar</span>
      Após o vencimento, seu acesso será interrompido. Entre em contato com a academia para renovar.
    </p>
    <div style="text-align: center;">
      <a href="${data.portalUrl}" class="cta">Ver meu plano</a>
    </div>
    <hr class="divider" />
    <p style="font-size: 12px; color: #71717a;">
      Dúvidas sobre renovação? Fale com a recepção da sua academia.
    </p>`;

  return {
    subject: `Seu plano ${data.planName} vence em ${data.daysRemaining} dia${data.daysRemaining > 1 ? 's' : ''}`,
    html: layout(body),
  };
}

// ─── 7. Regularization (student paid off all debts) ─────────

export interface RegularizationEmailData {
  studentName: string;
  academyName: string;
  portalUrl: string;
}

export function buildRegularizationEmail(data: RegularizationEmailData): EmailOutput {
  const body = `
    <h1>Situação regularizada!</h1>
    <p>Olá, ${data.studentName}.</p>
    <p>
      Sua situação financeira na <span class="highlight">${data.academyName}</span>
      foi <span style="color: #16a34a; font-weight: 700;">regularizada com sucesso</span>.
    </p>
    <p>
      Seu acesso está liberado normalmente. Continue aproveitando seus treinos!
    </p>
    <div style="text-align: center;">
      <a href="${data.portalUrl}" class="cta" style="background-color: #16a34a;">Acessar portal</a>
    </div>
    <hr class="divider" />
    <p style="font-size: 12px; color: #71717a;">
      Obrigado por manter sua situação em dia.
    </p>`;

  return {
    subject: `Situação regularizada na ${data.academyName}`,
    html: layout(body),
  };
}

// ─── 8. Reactivation offer (win-back) ──────────────────────

export interface ReactivationEmailData {
  studentName: string;
  planName: string;
  lastPaidAmount: number | null;
  academyName: string;
  daysSinceLoss: number;
  portalUrl: string;
}

export function buildReactivationEmail(data: ReactivationEmailData): EmailOutput {
  const body = `
    <h1>Sentimos sua falta!</h1>
    <p>Olá, ${data.studentName}.</p>
    <p>
      Notamos que você não está mais ativo na
      <span class="highlight">${data.academyName}</span>.
      Sentimos sua falta e gostaríamos de convidá-lo a voltar!
    </p>
    <div class="detail">
      <div class="detail-row">
        <span class="detail-label">Último plano</span>
        <span class="highlight">${data.planName}</span>
      </div>
      ${data.lastPaidAmount ? `
      <div class="detail-row">
        <span class="detail-label">Último valor pago</span>
        <span>${formatCurrency(data.lastPaidAmount)}</span>
      </div>` : ''}
      <div class="detail-row">
        <span class="detail-label">Dias desde saída</span>
        <span>${data.daysSinceLoss} dia${data.daysSinceLoss > 1 ? 's' : ''}</span>
      </div>
    </div>
    <p>
      Entre em contato com a academia para conhecer as condições de retorno.
      Estamos prontos para recebê-lo de volta!
    </p>
    <div style="text-align: center;">
      <a href="${data.portalUrl}" class="cta" style="background-color: #7c3aed;">Quero voltar</a>
    </div>
    <hr class="divider" />
    <p style="font-size: 12px; color: #71717a;">
      Se não deseja receber este tipo de comunicação, entre em contato com a academia.
    </p>`;

  return {
    subject: `${data.studentName}, sentimos sua falta na ${data.academyName}!`,
    html: layout(body),
  };
}

// ─── 9. Payment confirmed ───────────────────────────────────

export interface PaymentConfirmedEmailData {
  studentName: string;
  planName: string;
  amount: number;
  paidDate: string;             // ISO date
  academyName: string;
  portalUrl: string;
}

export function buildPaymentConfirmedEmail(data: PaymentConfirmedEmailData): EmailOutput {
  const body = `
    <h1>Pagamento confirmado!</h1>
    <p>Olá, ${data.studentName}.</p>
    <p>
      Seu pagamento referente ao plano <span class="highlight">${data.planName}</span>
      foi <span style="color: #16a34a; font-weight: 700;">confirmado com sucesso</span>.
    </p>
    <div class="detail">
      <div class="detail-row">
        <span class="detail-label">Valor</span>
        <span class="amount" style="color: #16a34a;">${formatCurrency(data.amount)}</span>
      </div>
      <div class="detail-row">
        <span class="detail-label">Data do pagamento</span>
        <span class="highlight">${formatDate(data.paidDate)}</span>
      </div>
      <div class="detail-row">
        <span class="detail-label">Plano</span>
        <span>${data.planName}</span>
      </div>
    </div>
    <div style="text-align: center;">
      <a href="${data.portalUrl}" class="cta" style="background-color: #16a34a;">Ver meu portal</a>
    </div>
    <hr class="divider" />
    <p style="font-size: 12px; color: #71717a;">
      Obrigado! Bons treinos.
    </p>`;

  return {
    subject: `Pagamento de ${formatCurrency(data.amount)} confirmado — ${data.planName}`,
    html: layout(body),
  };
}
