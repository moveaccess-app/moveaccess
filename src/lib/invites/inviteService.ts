import * as supabaseService from './inviteServiceSupabase';

export type {
  InviteContext,
  InviteValidationResult,
  InviteValidationStatus,
  ClaimInvitePayload,
  ClaimInviteResult,
  InviteSignupSessionResult,
  CompleteSignupResult,
} from './inviteServiceSupabase';

export const validateInviteToken = supabaseService.validateInviteToken;
export const startSignup = supabaseService.startSignup;
export const claimSignup = supabaseService.claimSignup;
export const getCurrentInviteSignupSession = supabaseService.getCurrentInviteSignupSession;
export const saveInviteSignupProgress = supabaseService.saveInviteSignupProgress;
export const completeSignup = supabaseService.completeSignup;
export const updateSessionStep = supabaseService.updateSessionStep;
