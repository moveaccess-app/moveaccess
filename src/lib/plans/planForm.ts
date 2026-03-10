import type { Plan, PlanAccessRules, PlanBillingCycle, PlanInput, PlanStatus } from './plansServiceSupabase';

export interface PlanFormValues {
  name: string;
  description: string;
  price: string;
  billingCycle: PlanBillingCycle;
  status: PlanStatus;
  allowedDays: string;
  allowedUnits: string;
  allowedStart: string;
  allowedEnd: string;
  dailyCheckInLimit: string;
  notes: string;
}

export function createEmptyPlanFormValues(): PlanFormValues {
  return {
    name: '',
    description: '',
    price: '0',
    billingCycle: 'monthly',
    status: 'active',
    allowedDays: '',
    allowedUnits: '',
    allowedStart: '',
    allowedEnd: '',
    dailyCheckInLimit: '',
    notes: '',
  };
}

export function planToFormValues(plan: Plan): PlanFormValues {
  return {
    name: plan.name,
    description: plan.description,
    price: String(plan.price ?? 0),
    billingCycle: plan.billingCycle,
    status: plan.status,
    allowedDays: (plan.accessRules.allowedDays || []).join(', '),
    allowedUnits: (plan.accessRules.allowedUnits || []).join(', '),
    allowedStart: plan.accessRules.allowedHours?.start || '',
    allowedEnd: plan.accessRules.allowedHours?.end || '',
    dailyCheckInLimit:
      typeof plan.accessRules.dailyCheckInLimit === 'number'
        ? String(plan.accessRules.dailyCheckInLimit)
        : '',
    notes: plan.accessRules.notes || '',
  };
}

export function formValuesToPlanInput(values: PlanFormValues): PlanInput {
  const accessRules: PlanAccessRules = {};
  const allowedDays = values.allowedDays
    .split(',')
    .map((item) => Number(item.trim()))
    .filter((value) => Number.isInteger(value) && value >= 0 && value <= 6);
  const allowedUnits = values.allowedUnits
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
  const dailyCheckInLimit = values.dailyCheckInLimit.trim();

  if (allowedDays.length > 0) {
    accessRules.allowedDays = allowedDays;
  }

  if (allowedUnits.length > 0) {
    accessRules.allowedUnits = allowedUnits;
  }

  if (values.allowedStart.trim() || values.allowedEnd.trim()) {
    accessRules.allowedHours = {
      ...(values.allowedStart.trim() ? { start: values.allowedStart.trim() } : {}),
      ...(values.allowedEnd.trim() ? { end: values.allowedEnd.trim() } : {}),
    };
  }

  if (dailyCheckInLimit) {
    accessRules.dailyCheckInLimit = Number(dailyCheckInLimit);
  }

  if (values.notes.trim()) {
    accessRules.notes = values.notes.trim();
  }

  return {
    name: values.name.trim(),
    description: values.description.trim(),
    price: Number(values.price || 0),
    billingCycle: values.billingCycle,
    status: values.status,
    accessRules,
  };
}

export function formatAllowedDays(rules: PlanAccessRules): string {
  const days = rules.allowedDays || [];
  if (days.length === 0) return 'Todos os dias';

  const labels = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
  return days.map((day) => labels[day] || String(day)).join(', ');
}

export function formatAllowedUnits(rules: PlanAccessRules): string {
  if (!rules.allowedUnits || rules.allowedUnits.length === 0) {
    return 'Todas as unidades';
  }

  return rules.allowedUnits.join(', ');
}

export function formatAllowedHours(rules: PlanAccessRules): string {
  const start = rules.allowedHours?.start;
  const end = rules.allowedHours?.end;

  if (!start && !end) {
    return 'Sem restrição de horário';
  }

  return `${start || '00:00'} às ${end || '23:59'}`;
}
