import * as accessServiceSupabase from './accessServiceSupabase';

export type {
  AccessMethod,
  AccessStatus,
  DenialReason,
  AccessUnit,
  AccessAttempt,
  CheckInResult,
  AccessOverview,
  AccessLogFilters,
} from './accessServiceSupabase';

export const getAccessUnits = accessServiceSupabase.getAccessUnits;
export const getAccessLogs = accessServiceSupabase.getAccessLogs;
export const getAccessOverview = accessServiceSupabase.getAccessOverview;
export const processCheckin = accessServiceSupabase.processCheckin;
export const formatCpfMasked = accessServiceSupabase.formatCpfMasked;
export const formatAccessTime = accessServiceSupabase.formatAccessTime;
export const formatAccessDateTime = accessServiceSupabase.formatAccessDateTime;
export const getAccessMethodLabel = accessServiceSupabase.getAccessMethodLabel;
export const getAccessStatusLabel = accessServiceSupabase.getAccessStatusLabel;
export const getDenialReasonMessage = accessServiceSupabase.getDenialReasonMessage;
