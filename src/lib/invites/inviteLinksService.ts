/**
 * Invite Links Service (Supabase)
 *
 * CRUD for invite_links table — used by staff to generate
 * real public signup links for prospective students.
 */

import { getActiveAcademyId } from '@/lib/supabase/academyScope';

const API_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const API_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export interface InviteLink {
  id: string;
  token: string;
  academyId: string;
  unitId: string | null;
  createdBy: string;
  expectedEmail: string | null;
  recipientName: string | null;
  recipientPhone: string | null;
  status: string;
  claimedAt: string | null;
  usedAt: string | null;
  expiresAt: string;
  description: string | null;
  createdAt: string;
}

export interface CreateInviteLinkInput {
  unitId?: string | null;
  expectedEmail: string;
  recipientName?: string | null;
  recipientPhone?: string | null;
  description?: string | null;
  expirationDays?: number;
}

interface DbInviteLinkRow {
  id: string;
  token: string;
  academy_id: string;
  unit_id: string | null;
  created_by: string;
  expected_email: string | null;
  recipient_name: string | null;
  recipient_phone: string | null;
  status: string;
  claimed_at: string | null;
  used_at: string | null;
  expires_at: string;
  description: string | null;
  created_at: string;
}

function getStorageKey(): string {
  const projectRef = API_URL?.split('//')[1]?.split('.')[0] || 'supabase';
  return `sb-${projectRef}-auth-token`;
}

function getAccessToken(): string | null {
  if (typeof window === 'undefined') return null;
  const stored = localStorage.getItem(getStorageKey());
  if (!stored) return null;
  try {
    const session = JSON.parse(stored);
    return session.access_token || null;
  } catch {
    return null;
  }
}

function getUserId(): string | null {
  if (typeof window === 'undefined') return null;
  const stored = localStorage.getItem(getStorageKey());
  if (!stored) return null;
  try {
    const session = JSON.parse(stored);
    return session.user?.id || null;
  } catch {
    return null;
  }
}

function generateToken(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let token = '';
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  for (let i = 0; i < 32; i++) {
    token += chars[array[i] % chars.length];
  }
  return token;
}

function normalizeEmail(value: string): string {
  return value.trim().toLowerCase();
}

function normalizePhone(value: string): string {
  return value.replace(/\D/g, '');
}

function mapRow(row: DbInviteLinkRow): InviteLink {
  return {
    id: row.id,
    token: row.token,
    academyId: row.academy_id,
    unitId: row.unit_id,
    createdBy: row.created_by,
    expectedEmail: row.expected_email,
    recipientName: row.recipient_name,
    recipientPhone: row.recipient_phone,
    status: row.status,
    claimedAt: row.claimed_at,
    usedAt: row.used_at,
    expiresAt: row.expires_at,
    description: row.description,
    createdAt: row.created_at,
  };
}

export function getInviteUrl(token: string): string {
  if (typeof window !== 'undefined') {
    return `${window.location.origin}/cadastro/${token}`;
  }
  return `/cadastro/${token}`;
}

export function buildWhatsAppInviteUrl(phone: string | null | undefined, message: string): string {
  const base = phone ? `https://wa.me/${normalizePhone(phone)}` : 'https://wa.me/';
  return `${base}?text=${encodeURIComponent(message)}`;
}

export async function createInviteLink(
  input: CreateInviteLinkInput
): Promise<{ success: boolean; invite?: InviteLink; error?: string }> {
  const token = getAccessToken();
  const userId = getUserId();
  const academyId = await getActiveAcademyId();

  if (!token || !userId || !academyId || !API_URL || !API_KEY) {
    return { success: false, error: 'Não autenticado ou academia não encontrada.' };
  }

  const expectedEmail = normalizeEmail(input.expectedEmail);
  if (!expectedEmail || !expectedEmail.includes('@')) {
    return { success: false, error: 'Informe um e-mail válido para o convidado.' };
  }

  const inviteToken = generateToken();
  const expirationDays = input.expirationDays ?? 7;
  const expiresAt = new Date(Date.now() + expirationDays * 24 * 60 * 60 * 1000).toISOString();

  const payload = {
    token: inviteToken,
    academy_id: academyId,
    unit_id: input.unitId || null,
    created_by: userId,
    expected_email: expectedEmail,
    recipient_name: input.recipientName?.trim() || null,
    recipient_phone: input.recipientPhone ? normalizePhone(input.recipientPhone) : null,
    status: 'active',
    expires_at: expiresAt,
    description: input.description || null,
  };

  try {
    const response = await fetch(`${API_URL}/rest/v1/invite_links?select=*`, {
      method: 'POST',
      headers: {
        apikey: API_KEY,
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
        Prefer: 'return=representation',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return { success: false, error: errorData.message || `Erro ${response.status}` };
    }

    const data: DbInviteLinkRow[] = await response.json();
    if (!data?.[0]) {
      return { success: false, error: 'Link criado mas não retornou dados.' };
    }

    return { success: true, invite: mapRow(data[0]) };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Erro desconhecido',
    };
  }
}
