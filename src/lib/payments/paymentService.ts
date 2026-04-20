import * as paymentServiceSupabase from './paymentServiceSupabase';

export type {
  Payment,
  PaymentInput,
  PaymentMethod,
  PaymentStatus,
  PaymentStudent,
  PaymentSubscription,
  FinancialSummary,
  BadgeVariant,
  ChargeOrigin,
  DelinquentStudent,
} from './paymentServiceSupabase';

export const getPayments = paymentServiceSupabase.getPayments;
export const getPaymentById = paymentServiceSupabase.getPaymentById;
export const getPaymentsByStudent = paymentServiceSupabase.getPaymentsByStudent;
export const createPayment = paymentServiceSupabase.createPayment;
export const markPaymentPaid = paymentServiceSupabase.markPaymentPaid;
export const markPaymentFailed = paymentServiceSupabase.markPaymentFailed;
export const formatCurrency = paymentServiceSupabase.formatCurrency;
export const formatCurrencyCompact = paymentServiceSupabase.formatCurrencyCompact;
export const formatPaymentDate = paymentServiceSupabase.formatPaymentDate;
export const formatPaymentDateTime = paymentServiceSupabase.formatPaymentDateTime;
export const formatCompetence = paymentServiceSupabase.formatCompetence;
export const getDaysOverdue = paymentServiceSupabase.getDaysOverdue;
export const getDaysUntilDue = paymentServiceSupabase.getDaysUntilDue;
export const getPaymentStatusLabel = paymentServiceSupabase.getPaymentStatusLabel;
export const getPaymentStatusVariant = paymentServiceSupabase.getPaymentStatusVariant;
export const getPaymentMethodLabel = paymentServiceSupabase.getPaymentMethodLabel;
export const isChargeDelinquent = paymentServiceSupabase.isChargeDelinquent;
export const getOverduePayments = paymentServiceSupabase.getOverduePayments;
export const getDueSoonPayments = paymentServiceSupabase.getDueSoonPayments;
export const getFinancialSummary = paymentServiceSupabase.getFinancialSummary;
export const getPaymentLink = paymentServiceSupabase.getPaymentLink;
export const getReminderTemplate = paymentServiceSupabase.getReminderTemplate;
export const getChargeOriginLabel = paymentServiceSupabase.getChargeOriginLabel;
export const getChargeOriginVariant = paymentServiceSupabase.getChargeOriginVariant;
export const getAsaasStatusLabel = paymentServiceSupabase.getAsaasStatusLabel;
export const getAsaasStatusVariant = paymentServiceSupabase.getAsaasStatusVariant;
export const PAYMENT_STATUS_LABELS = paymentServiceSupabase.PAYMENT_STATUS_LABELS;
export const PAYMENT_STATUS_VARIANTS = paymentServiceSupabase.PAYMENT_STATUS_VARIANTS;
export const PAYMENT_METHOD_LABELS = paymentServiceSupabase.PAYMENT_METHOD_LABELS;
export const CHARGE_ORIGIN_LABELS = paymentServiceSupabase.CHARGE_ORIGIN_LABELS;
export const CHARGE_ORIGIN_VARIANTS = paymentServiceSupabase.CHARGE_ORIGIN_VARIANTS;
export const getDelinquentStudents = paymentServiceSupabase.getDelinquentStudents;
