export { getEmailProvider, type EmailProvider, type SendEmailInput, type SendEmailResult } from './email-provider';
export {
  buildInviteEmail,
  buildDueReminderEmail,
  buildOverdueNoticeEmail,
  buildPreBlockEmail,
  buildEscalationEmail,
  buildSubscriptionExpiringEmail,
  buildRegularizationEmail,
  buildReactivationEmail,
  buildPaymentConfirmedEmail,
} from './email-templates';
export {
  sendNotification,
  inviteKey,
  dueReminderKey,
  overdueNoticeKey,
  preBlockKey,
  escalationKey,
  subscriptionExpiringKey,
  reactivationKey,
  regularizationKey,
  paymentConfirmedKey,
  type NotificationType,
  type SendNotificationInput,
  type SendNotificationResult,
} from './notification-service';
export {
  findDueReminderCandidates,
  findOverdueCandidates,
  findPreBlockCandidates,
  findEscalationCandidates,
  findSubscriptionExpiringCandidates,
  findReactivationCandidates,
  findRegularizationCandidates,
} from './notification-queries';
export { dispatchScheduledNotifications, type DispatchSummary } from './dispatch-scheduled';
export { evaluateAndExecuteAutomations, type AutomationSummary, type AutomationBucket } from './automation-engine';
export { resolveAutomationsForPayment, type PaymentResolutionResult } from './automation-resolution';
export { sendInviteEmail, type SendInviteEmailInput } from './send-invite-email';
