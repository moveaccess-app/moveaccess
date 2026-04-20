'use client';

import { useEffect, useState } from 'react';
import { Button, Card, Badge } from '@/components/ui';
import { getUnits, type Unit } from '@/lib/settings/settingsService';
import {
  getPlanAccessRule,
  savePlanAccessRule,
  formatAccessRuleSummary,
  type PlanAccessRule,
  type PlanAccessRuleInput,
} from '@/lib/plans/planAccessRulesService';

const WEEKDAY_LABELS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

interface Props {
  planId: string;
  academyId: string;
}

export function AccessRuleEditor({ planId }: Props) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [units, setUnits] = useState<Unit[]>([]);
  const [rule, setRule] = useState<PlanAccessRule | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Edit state
  const [restrictUnits, setRestrictUnits] = useState(false);
  const [selectedUnits, setSelectedUnits] = useState<string[]>([]);
  const [restrictDays, setRestrictDays] = useState(false);
  const [selectedDays, setSelectedDays] = useState<number[]>([]);
  const [restrictTime, setRestrictTime] = useState(false);
  const [startTime, setStartTime] = useState('06:00');
  const [endTime, setEndTime] = useState('22:00');

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      const [ruleData, unitList] = await Promise.all([
        getPlanAccessRule(planId),
        getUnits(),
      ]);
      if (cancelled) return;
      setRule(ruleData);
      setUnits(unitList);
      setLoading(false);
    }
    load();
    return () => { cancelled = true; };
  }, [planId]);

  function startEditing() {
    if (rule) {
      setRestrictUnits(!!rule.allowedUnits?.length);
      setSelectedUnits(rule.allowedUnits || []);
      setRestrictDays(!!rule.allowedWeekdays?.length);
      setSelectedDays(rule.allowedWeekdays || []);
      setRestrictTime(!!(rule.allowedStartTime || rule.allowedEndTime));
      setStartTime(rule.allowedStartTime || '06:00');
      setEndTime(rule.allowedEndTime || '22:00');
    } else {
      setRestrictUnits(false);
      setSelectedUnits([]);
      setRestrictDays(false);
      setSelectedDays([]);
      setRestrictTime(false);
      setStartTime('06:00');
      setEndTime('22:00');
    }
    setMessage(null);
    setIsEditing(true);
  }

  function cancelEditing() {
    setIsEditing(false);
    setMessage(null);
  }

  async function handleSave() {
    if (restrictUnits && selectedUnits.length === 0) {
      setMessage({ type: 'error', text: 'Selecione pelo menos uma unidade permitida.' });
      return;
    }
    if (restrictDays && selectedDays.length === 0) {
      setMessage({ type: 'error', text: 'Selecione pelo menos um dia permitido.' });
      return;
    }
    if (restrictTime && startTime >= endTime) {
      setMessage({ type: 'error', text: 'O horário inicial deve ser anterior ao final.' });
      return;
    }

    const input: PlanAccessRuleInput = {
      allowedUnits: restrictUnits ? selectedUnits : null,
      allowedWeekdays: restrictDays ? selectedDays : null,
      allowedStartTime: restrictTime ? startTime : null,
      allowedEndTime: restrictTime ? endTime : null,
    };

    setSaving(true);
    const result = await savePlanAccessRule(planId, input);
    setSaving(false);

    if (!result.success) {
      setMessage({ type: 'error', text: result.error || 'Erro ao salvar regras de acesso.' });
      return;
    }

    const updated = await getPlanAccessRule(planId);
    setRule(updated);
    setIsEditing(false);
    setMessage({ type: 'success', text: 'Regras de acesso atualizadas.' });
    setTimeout(() => setMessage(null), 4000);
  }

  function toggleDay(day: number) {
    setSelectedDays(prev =>
      prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day].sort()
    );
  }

  function toggleUnit(unitId: string) {
    setSelectedUnits(prev =>
      prev.includes(unitId) ? prev.filter(u => u !== unitId) : [...prev, unitId]
    );
  }

  const unitMap = new Map(units.map(u => [u.id, u.name]));

  if (loading) {
    return (
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-4">Regras de acesso</h3>
        <p className="text-sm text-[var(--text-tertiary)]">Carregando regras...</p>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-[var(--text-primary)]">Regras de acesso</h3>
        {isEditing ? (
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={cancelEditing}>
              Cancelar
            </Button>
            <Button size="sm" onClick={handleSave} disabled={saving}>
              {saving ? 'Salvando...' : 'Salvar regras'}
            </Button>
          </div>
        ) : (
          <Button variant="outline" size="sm" onClick={startEditing}>
            Editar
          </Button>
        )}
      </div>

      {message && (
        <div className={`p-3 rounded-lg mb-4 text-sm ${
          message.type === 'success'
            ? 'bg-green-50 text-green-700 border border-green-200'
            : 'bg-red-50 text-red-700 border border-red-200'
        }`}>
          {message.text}
        </div>
      )}

      {isEditing ? (
        <div className="space-y-6">
          {/* Unit restriction */}
          <div>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={restrictUnits}
                onChange={() => setRestrictUnits(!restrictUnits)}
                className="w-4 h-4 rounded border-[var(--border-default)] accent-[var(--element-primary)]"
              />
              <span className="text-sm font-medium text-[var(--text-primary)]">Restringir por unidade</span>
            </label>

            {restrictUnits && (
              <div className="mt-3 ml-6 space-y-2">
                {units.length === 0 ? (
                  <p className="text-sm text-[var(--text-tertiary)]">Nenhuma unidade cadastrada.</p>
                ) : (
                  units.map(unit => (
                    <label key={unit.id} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={selectedUnits.includes(unit.id)}
                        onChange={() => toggleUnit(unit.id)}
                        className="w-4 h-4 rounded border-[var(--border-default)] accent-[var(--element-primary)]"
                      />
                      <span className="text-sm text-[var(--text-secondary)]">{unit.name}</span>
                    </label>
                  ))
                )}
              </div>
            )}
          </div>

          {/* Day restriction */}
          <div>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={restrictDays}
                onChange={() => setRestrictDays(!restrictDays)}
                className="w-4 h-4 rounded border-[var(--border-default)] accent-[var(--element-primary)]"
              />
              <span className="text-sm font-medium text-[var(--text-primary)]">Restringir por dia da semana</span>
            </label>

            {restrictDays && (
              <div className="mt-3 ml-6 flex flex-wrap gap-2">
                {WEEKDAY_LABELS.map((label, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => toggleDay(idx)}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors border ${
                      selectedDays.includes(idx)
                        ? 'bg-[var(--element-primary)] text-white border-[var(--element-primary)]'
                        : 'bg-[var(--background-primary)] text-[var(--text-secondary)] border-[var(--divider-primary)] hover:border-[var(--element-secondary)]'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Time restriction */}
          <div>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={restrictTime}
                onChange={() => setRestrictTime(!restrictTime)}
                className="w-4 h-4 rounded border-[var(--border-default)] accent-[var(--element-primary)]"
              />
              <span className="text-sm font-medium text-[var(--text-primary)]">Restringir por horário</span>
            </label>

            {restrictTime && (
              <div className="mt-3 ml-6 flex items-center gap-3">
                <input
                  type="time"
                  value={startTime}
                  onChange={e => setStartTime(e.target.value)}
                  className="h-10 px-3 rounded-lg border border-[var(--border-default)] bg-[var(--background-primary)] text-sm text-[var(--text-primary)]"
                />
                <span className="text-sm text-[var(--text-tertiary)]">às</span>
                <input
                  type="time"
                  value={endTime}
                  onChange={e => setEndTime(e.target.value)}
                  className="h-10 px-3 rounded-lg border border-[var(--border-default)] bg-[var(--background-primary)] text-sm text-[var(--text-primary)]"
                />
              </div>
            )}
          </div>

          {/* Preview */}
          <div className="pt-4 border-t border-[var(--divider-primary)]">
            <p className="text-xs text-[var(--text-tertiary)] mb-1">Prévia do que será aplicado no check-in:</p>
            <p className="text-sm font-medium text-[var(--text-primary)]">
              {formatAccessRuleSummary(
                (restrictUnits || restrictDays || restrictTime)
                  ? {
                    id: '', planId, academyId: '',
                    allowedUnits: restrictUnits ? selectedUnits : null,
                    allowedWeekdays: restrictDays ? selectedDays : null,
                    allowedStartTime: restrictTime ? startTime : null,
                    allowedEndTime: restrictTime ? endTime : null,
                  }
                  : null,
                unitMap
              )}
            </p>
          </div>
        </div>
      ) : (
        /* View mode */
        <div className="space-y-3">
          {!rule ? (
            <div className="flex items-center gap-2">
              <Badge variant="success">Acesso livre</Badge>
              <span className="text-sm text-[var(--text-secondary)]">Sem restrições de unidade, dia ou horário</span>
            </div>
          ) : (
            <>
              <div className="flex items-center gap-2 mb-3">
                <Badge variant="warning">Acesso restrito</Badge>
              </div>

              {rule.allowedUnits?.length ? (
                <div className="flex justify-between gap-4 py-2 border-b border-[var(--divider-primary)]">
                  <span className="text-sm text-[var(--text-tertiary)]">Unidades permitidas</span>
                  <span className="text-sm font-medium text-[var(--text-primary)] text-right">
                    {rule.allowedUnits.map(id => unitMap.get(id) || id.slice(0, 8)).join(', ')}
                  </span>
                </div>
              ) : null}

              {rule.allowedWeekdays?.length ? (
                <div className="flex justify-between gap-4 py-2 border-b border-[var(--divider-primary)]">
                  <span className="text-sm text-[var(--text-tertiary)]">Dias permitidos</span>
                  <span className="text-sm font-medium text-[var(--text-primary)] text-right">
                    {rule.allowedWeekdays.map(d => WEEKDAY_LABELS[d]).join(', ')}
                  </span>
                </div>
              ) : null}

              {(rule.allowedStartTime || rule.allowedEndTime) ? (
                <div className="flex justify-between gap-4 py-2 border-b border-[var(--divider-primary)]">
                  <span className="text-sm text-[var(--text-tertiary)]">Horário permitido</span>
                  <span className="text-sm font-medium text-[var(--text-primary)] text-right">
                    {rule.allowedStartTime || '00:00'} às {rule.allowedEndTime || '23:59'}
                  </span>
                </div>
              ) : null}
            </>
          )}
        </div>
      )}
    </Card>
  );
}
