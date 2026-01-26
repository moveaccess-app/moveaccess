'use client';

import { useState, useMemo } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Header } from '@/components/common/Header';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import {
  getChargeById,
  CHARGE_STATUS_LABELS,
  CHARGE_STATUS_VARIANT,
  PAYMENT_METHOD_LABELS,
  ADJUSTMENT_TYPE_LABELS,
  formatCurrency,
  formatDate,
  formatDateTime,
  formatCompetence,
  getDaysOverdue,
  getDaysUntilDue,
  generatePaymentLink,
  AdjustmentType,
  PaymentMethod,
} from '@/mocks/financialMock';

type ModalType = 'adjustment' | 'payment' | null;

export default function ChargeDetailPage() {
  const router = useRouter();
  const params = useParams();
  const chargeId = params.id as string;

  const charge = useMemo(() => getChargeById(chargeId), [chargeId]);

  const [modalType, setModalType] = useState<ModalType>(null);
  const [adjustmentType, setAdjustmentType] = useState<AdjustmentType>('discount_percentage');
  const [adjustmentValue, setAdjustmentValue] = useState('');
  const [adjustmentNotes, setAdjustmentNotes] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('pix');
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0]);

  if (!charge) {
    return (
      <div className="flex flex-col h-full bg-[var(--background-secondary)]">
        <Header title="Cobrança não encontrada" />
        <div className="flex-1 flex items-center justify-center">
          <Card className="p-8 text-center">
            <div className="text-[var(--element-secondary)]">
              Cobrança com ID {chargeId} não encontrada.
            </div>
            <Button onClick={() => router.push('/financial')} className="mt-4">
              Voltar ao Financeiro
            </Button>
          </Card>
        </div>
      </div>
    );
  }

  const handleCopyPaymentLink = async () => {
    const link = generatePaymentLink(charge.id);
    await navigator.clipboard.writeText(link);
    alert('Link de pagamento copiado!');
  };

  const handleApplyAdjustment = () => {
    // Mock: Em produção, isso chamaria a API
    alert(`Ajuste aplicado:\nTipo: ${ADJUSTMENT_TYPE_LABELS[adjustmentType]}\nValor: ${adjustmentValue}\nObservação: ${adjustmentNotes}`);
    setModalType(null);
    setAdjustmentValue('');
    setAdjustmentNotes('');
  };

  const handleRegisterPayment = () => {
    // Mock: Em produção, isso chamaria a API
    alert(`Pagamento registrado:\nMétodo: ${PAYMENT_METHOD_LABELS[paymentMethod]}\nValor: ${formatCurrency(parseFloat(paymentAmount) || 0)}\nData: ${paymentDate}`);
    setModalType(null);
    setPaymentAmount('');
  };

  const renderDueDateStatus = () => {
    if (charge.status === 'paid' || charge.status === 'waived' || charge.status === 'cancelled') {
      return null;
    }

    if (charge.status === 'overdue') {
      const days = getDaysOverdue(charge.dueDate);
      return (
        <Badge variant="destructive" className="ml-2">
          {days} dia(s) em atraso
        </Badge>
      );
    }

    const days = getDaysUntilDue(charge.dueDate);
    if (days <= 7 && days >= 0) {
      return (
        <Badge variant="warning" className="ml-2">
          Vence em {days} dia(s)
        </Badge>
      );
    }

    return null;
  };

  return (
    <div className="flex flex-col h-full bg-[var(--background-secondary)]">
      <Header title={`Cobrança ${charge.id}`} />

      <div className="flex-1 overflow-auto p-6">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Botão Voltar */}
          <Button variant="ghost" onClick={() => router.back()}>
            <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Voltar
          </Button>

          {/* Cabeçalho com Status */}
          <Card className="p-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <h1 className="text-2xl font-bold text-[var(--element-primary)]">
                    {charge.userName}
                  </h1>
                  <Badge variant={CHARGE_STATUS_VARIANT[charge.status]}>
                    {CHARGE_STATUS_LABELS[charge.status]}
                  </Badge>
                </div>
                <div className="text-[var(--element-secondary)]">
                  {charge.planName} • {formatCompetence(charge.competence)}
                </div>
              </div>
              <div className="text-right">
                <div className="text-3xl font-bold text-[var(--element-primary)]">
                  {formatCurrency(charge.finalValue)}
                </div>
                {charge.baseValue !== charge.finalValue && (
                  <div className="text-sm text-[var(--element-disabled)] line-through">
                    Original: {formatCurrency(charge.baseValue)}
                  </div>
                )}
              </div>
            </div>
          </Card>

          {/* Grid de Informações */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Informações da Cobrança */}
            <Card className="p-6">
              <h2 className="text-lg font-semibold text-[var(--element-primary)] mb-4">
                Informações da Cobrança
              </h2>
              <dl className="space-y-3">
                <div className="flex justify-between">
                  <dt className="text-[var(--element-secondary)]">Código</dt>
                  <dd className="text-[var(--element-primary)] font-medium">{charge.id}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-[var(--element-secondary)]">Vencimento</dt>
                  <dd className="text-[var(--element-primary)] font-medium flex items-center">
                    {formatDate(charge.dueDate)}
                    {renderDueDateStatus()}
                  </dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-[var(--element-secondary)]">Valor Original</dt>
                  <dd className="text-[var(--element-primary)] font-medium">
                    {formatCurrency(charge.baseValue)}
                  </dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-[var(--element-secondary)]">Valor Final</dt>
                  <dd className="text-[var(--element-primary)] font-medium">
                    {formatCurrency(charge.finalValue)}
                  </dd>
                </div>
                {charge.paidValue !== undefined && charge.paidValue > 0 && (
                  <div className="flex justify-between">
                    <dt className="text-[var(--element-secondary)]">Valor Pago</dt>
                    <dd className="text-[var(--status-positive)] font-medium">
                      {formatCurrency(charge.paidValue)}
                    </dd>
                  </div>
                )}
                <div className="flex justify-between">
                  <dt className="text-[var(--element-secondary)]">Criado em</dt>
                  <dd className="text-[var(--element-primary)]">{formatDateTime(charge.createdAt)}</dd>
                </div>
              </dl>
            </Card>

            {/* Informações de Pagamento */}
            <Card className="p-6">
              <h2 className="text-lg font-semibold text-[var(--element-primary)] mb-4">
                Pagamento
              </h2>
              {charge.paidAt ? (
                <dl className="space-y-3">
                  <div className="flex justify-between">
                    <dt className="text-[var(--element-secondary)]">Data do Pagamento</dt>
                    <dd className="text-[var(--element-primary)] font-medium">
                      {formatDateTime(charge.paidAt)}
                    </dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-[var(--element-secondary)]">Método</dt>
                    <dd className="text-[var(--element-primary)] font-medium">
                      {charge.paymentMethod && PAYMENT_METHOD_LABELS[charge.paymentMethod]}
                    </dd>
                  </div>
                </dl>
              ) : (
                <div className="text-center py-4">
                  <div className="text-[var(--element-disabled)] mb-4">
                    Pagamento não registrado
                  </div>
                  <Button onClick={() => setModalType('payment')}>
                    Registrar Pagamento
                  </Button>
                </div>
              )}
            </Card>
          </div>

          {/* Ajustes Aplicados */}
          {charge.adjustments && charge.adjustments.length > 0 && (
            <Card className="p-6">
              <h2 className="text-lg font-semibold text-[var(--element-primary)] mb-4">
                Ajustes Aplicados
              </h2>
              <div className="space-y-3">
                {charge.adjustments.map((adj, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 rounded-lg bg-[var(--background-tertiary)]"
                  >
                    <div>
                      <div className="font-medium text-[var(--element-primary)]">
                        {ADJUSTMENT_TYPE_LABELS[adj.type]}
                      </div>
                      {adj.description && (
                        <div className="text-sm text-[var(--element-disabled)]">{adj.description}</div>
                      )}
                    </div>
                    <div className="text-right">
                      <div className={`font-medium ${adj.value < 0 ? 'text-[var(--status-positive)]' : 'text-[var(--status-negative)]'}`}>
                        {adj.value > 0 ? '+' : ''}{formatCurrency(adj.value)}
                      </div>
                      <div className="text-xs text-[var(--element-disabled)]">
                        {formatDate(adj.appliedAt)} por {adj.appliedBy}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* Timeline de Eventos */}
          {charge.events && charge.events.length > 0 && (
            <Card className="p-6">
              <h2 className="text-lg font-semibold text-[var(--element-primary)] mb-4">
                Histórico
              </h2>
              <div className="space-y-4">
                {charge.events.map((event, index) => (
                  <div key={index} className="flex gap-4">
                    <div className="flex flex-col items-center">
                      <div className="w-3 h-3 rounded-full bg-[var(--status-info)]" />
                      {index < charge.events!.length - 1 && (
                        <div className="w-0.5 h-full bg-[var(--divider-primary)] mt-1" />
                      )}
                    </div>
                    <div className="flex-1 pb-4">
                      <div className="font-medium text-[var(--element-primary)]">
                        {event.description}
                      </div>
                      <div className="text-sm text-[var(--element-disabled)]">
                        {formatDateTime(event.timestamp)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* Ações */}
          <Card className="p-6">
            <h2 className="text-lg font-semibold text-[var(--element-primary)] mb-4">
              Ações
            </h2>
            <div className="flex flex-wrap gap-3">
              {charge.status !== 'paid' && charge.status !== 'cancelled' && (
                <>
                  <Button onClick={() => setModalType('payment')}>
                    <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Registrar Pagamento
                  </Button>
                  <Button variant="secondary" onClick={() => setModalType('adjustment')}>
                    <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                    </svg>
                    Aplicar Ajuste
                  </Button>
                  <Button variant="secondary" onClick={handleCopyPaymentLink}>
                    <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                    </svg>
                    Copiar Link Pagamento
                  </Button>
                </>
              )}
              <Button
                variant="ghost"
                onClick={() => router.push(`/users/${charge.userId}`)}
              >
                Ver Perfil do Aluno
              </Button>
            </div>
          </Card>
        </div>
      </div>

      {/* Modal de Ajuste */}
      {modalType === 'adjustment' && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md m-4 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-[var(--element-primary)]">
                Aplicar Ajuste
              </h2>
              <button
                onClick={() => setModalType(null)}
                className="text-[var(--element-disabled)] hover:text-[var(--element-primary)]"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <Label>Tipo de Ajuste</Label>
                <select
                  value={adjustmentType}
                  onChange={(e) => setAdjustmentType(e.target.value as AdjustmentType)}
                  className="w-full mt-1 px-3 py-2 rounded-lg border border-[var(--divider-primary)] bg-[var(--background-primary)] text-[var(--element-primary)]"
                >
                  {Object.entries(ADJUSTMENT_TYPE_LABELS).map(([key, label]) => (
                    <option key={key} value={key}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <Label>
                  {adjustmentType === 'discount_percentage'
                    ? 'Percentual (%)'
                    : adjustmentType === 'extension'
                    ? 'Dias de Extensão'
                    : 'Valor (R$)'}
                </Label>
                <Input
                  type="number"
                  value={adjustmentValue}
                  onChange={(e) => setAdjustmentValue(e.target.value)}
                  placeholder={adjustmentType === 'discount_percentage' ? 'Ex: 10' : 'Ex: 50.00'}
                />
              </div>

              <div>
                <Label>Observação</Label>
                <textarea
                  value={adjustmentNotes}
                  onChange={(e) => setAdjustmentNotes(e.target.value)}
                  placeholder="Motivo do ajuste..."
                  rows={3}
                  className="w-full mt-1 px-3 py-2 rounded-lg border border-[var(--divider-primary)] bg-[var(--background-primary)] text-[var(--element-primary)] resize-none"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <Button variant="secondary" onClick={() => setModalType(null)} className="flex-1">
                  Cancelar
                </Button>
                <Button onClick={handleApplyAdjustment} className="flex-1">
                  Aplicar
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Modal de Pagamento */}
      {modalType === 'payment' && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md m-4 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-[var(--element-primary)]">
                Registrar Pagamento
              </h2>
              <button
                onClick={() => setModalType(null)}
                className="text-[var(--element-disabled)] hover:text-[var(--element-primary)]"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <Label>Método de Pagamento</Label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                  className="w-full mt-1 px-3 py-2 rounded-lg border border-[var(--divider-primary)] bg-[var(--background-primary)] text-[var(--element-primary)]"
                >
                  {Object.entries(PAYMENT_METHOD_LABELS).map(([key, label]) => (
                    <option key={key} value={key}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <Label>Valor Pago (R$)</Label>
                <Input
                  type="number"
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(e.target.value)}
                  placeholder={charge.finalValue.toFixed(2)}
                />
                <p className="text-xs text-[var(--element-disabled)] mt-1">
                  Valor pendente: {formatCurrency(charge.finalValue - (charge.paidValue || 0))}
                </p>
              </div>

              <div>
                <Label>Data do Pagamento</Label>
                <Input
                  type="date"
                  value={paymentDate}
                  onChange={(e) => setPaymentDate(e.target.value)}
                />
              </div>

              <div className="flex gap-3 pt-2">
                <Button variant="secondary" onClick={() => setModalType(null)} className="flex-1">
                  Cancelar
                </Button>
                <Button onClick={handleRegisterPayment} className="flex-1">
                  Registrar
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
