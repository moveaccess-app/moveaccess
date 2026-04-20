import * as subscriptionServiceSupabase from './subscriptionServiceSupabase';

export type {
  Subscription,
  SubscriptionInput,
  SubscriptionUpdateInput,
  SubscriptionStatus,
  SubscriptionBillingCycle,
  SubscriptionPlan,
  SubscriptionStudent,
  BadgeVariant,
} from './subscriptionServiceSupabase';

export const getSubscriptions = subscriptionServiceSupabase.getSubscriptions;
export const getSubscriptionById = subscriptionServiceSupabase.getSubscriptionById;
export const createSubscription = subscriptionServiceSupabase.createSubscription;
export const updateSubscription = subscriptionServiceSupabase.updateSubscription;
export const cancelSubscription = subscriptionServiceSupabase.cancelSubscription;
export const formatPrice = subscriptionServiceSupabase.formatPrice;
export const formatSubscriptionDate = subscriptionServiceSupabase.formatSubscriptionDate;
export const formatSubscriptionDateTime = subscriptionServiceSupabase.formatSubscriptionDateTime;
export const getSubscriptionStatusLabel = subscriptionServiceSupabase.getSubscriptionStatusLabel;
export const getSubscriptionStatusVariant = subscriptionServiceSupabase.getSubscriptionStatusVariant;
export const getBillingCycleLabel = subscriptionServiceSupabase.getBillingCycleLabel;
export const getDaysRemaining = subscriptionServiceSupabase.getDaysRemaining;
export const getSubscriptionStats = subscriptionServiceSupabase.getSubscriptionStats;
export const SUBSCRIPTION_STATUS_LABELS = subscriptionServiceSupabase.SUBSCRIPTION_STATUS_LABELS;
export const SUBSCRIPTION_STATUS_VARIANTS = subscriptionServiceSupabase.SUBSCRIPTION_STATUS_VARIANTS;
export const SUBSCRIPTION_BILLING_CYCLE_LABELS = subscriptionServiceSupabase.SUBSCRIPTION_BILLING_CYCLE_LABELS;
