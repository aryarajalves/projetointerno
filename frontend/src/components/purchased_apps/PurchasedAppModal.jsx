import React, { useState, useEffect } from 'react';

const ALL_APPS = [
  { name: 'AgentFlow', icon: '🤖', description: 'Automação de Fluxos & IA Agents' },
  { name: 'ZapJords', icon: '⚡', description: 'Plataforma de Automação de WhatsApp' },
  { name: 'Oraculo', icon: '🔮', description: 'Inteligência de Dados & Respostas' },
  { name: 'ZapGroup', icon: '👥', description: 'Gestão de Grupos e Disparos' }
];

export function PurchasedAppModal({ isOpen, initialApp, initialAppName, onClose, onSave }) {
  const [selectedApp, setSelectedApp] = useState(initialAppName || 'AgentFlow');
  const [priceInput, setPriceInput] = useState('');
  const [paymentStatus, setPaymentStatus] = useState('paid');
  const [upfrontStatus, setUpfrontStatus] = useState('paid');
  const [upfrontDueDate, setUpfrontDueDate] = useState('');
  const [installmentsCount, setInstallmentsCount] = useState(2);
  const [installmentsList, setInstallmentsList] = useState([]);
  const [renewalDate, setRenewalDate] = useState('');

  const generateDefaultInstallments = (count, total) => {
    const priceNum = parseFloat(total) || 0;
    const perInstallment = count > 0 ? (priceNum / count).toFixed(2) : '0.00';
    const list = [];
    const today = new Date();

    for (let i = 0; i < count; i++) {
      const dueDate = new Date(today.getFullYear(), today.getMonth() + i, today.getDate());
      const dateStr = dueDate.toISOString().split('T')[0];
      list.push({
        installment_number: i + 1,
        amount: parseFloat(perInstallment),
        due_date: dateStr,
        status: 'pending'
      });
    }
    return list;
  };

  const syncInstallmentsWithCount = (count, price, existingList = []) => {
    const priceNum = parseFloat(price) || 0;
    const defaults = generateDefaultInstallments(count, priceNum);
    const result = [];

    for (let i = 0; i < count; i++) {
      if (existingList[i]) {
        result.push({
          installment_number: i + 1,
          amount: existingList[i].amount !== undefined ? existingList[i].amount : defaults[i].amount,
          due_date: existingList[i].due_date || defaults[i].due_date,
          status: existingList[i].status || 'pending'
        });
      } else {
        result.push(defaults[i]);
      }
    }
    return result;
  };

  useEffect(() => {
    if (isOpen) {
      if (initialApp) {
        setSelectedApp(initialApp.app_name || initialAppName || 'AgentFlow');
        setPriceInput(initialApp.price !== undefined ? initialApp.price.toString() : '');
        
        if (initialApp.payment_status === 'installment') {
          setPaymentStatus('installment');
          setUpfrontStatus('paid');
          setUpfrontDueDate('');
        } else if (initialApp.payment_status === 'pending') {
          setPaymentStatus('paid');
          setUpfrontStatus('pending');
          const firstInst = initialApp.installments && initialApp.installments[0];
          setUpfrontDueDate(firstInst?.due_date || '');
        } else {
          setPaymentStatus('paid');
          setUpfrontStatus('paid');
          setUpfrontDueDate('');
        }

        const count = initialApp.installments_count || 2;
        setInstallmentsCount(count);
        setRenewalDate(initialApp.renewal_date || '');
        setInstallmentsList(syncInstallmentsWithCount(count, initialApp.price, initialApp.installments || []));
      } else {
        setSelectedApp(initialAppName || 'AgentFlow');
        setPriceInput('');
        setPaymentStatus('paid');
        setUpfrontStatus('paid');
        setUpfrontDueDate('');
        setInstallmentsCount(2);
        setRenewalDate('');
        setInstallmentsList(generateDefaultInstallments(2, 0));
      }
    }
  }, [isOpen, initialApp, initialAppName]);

  const handleInstallmentsCountChange = (newCountStr) => {
    const count = parseInt(newCountStr, 10) || 1;
    setInstallmentsCount(count);
    const priceNum = parseFloat(priceInput.replace(',', '.')) || 0;
    setInstallmentsList(syncInstallmentsWithCount(count, priceNum, installmentsList));
  };

  const handlePriceChange = (val) => {
    setPriceInput(val);
    if (paymentStatus === 'installment') {
      const priceNum = parseFloat(val.replace(',', '.')) || 0;
      setInstallmentsList(syncInstallmentsWithCount(installmentsCount, priceNum, installmentsList));
    }
  };

  const updateInstallmentItem = (index, field, value) => {
    const newList = [...installmentsList];
    newList[index] = { ...newList[index], [field]: value };
    setInstallmentsList(newList);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const priceNum = parseFloat(priceInput.replace(',', '.'));
    if (isNaN(priceNum) || priceNum < 0) {
      alert('Por favor, informe um valor válido em R$.');
      return;
    }

    if (paymentStatus === 'paid' && upfrontStatus === 'pending' && !upfrontDueDate) {
      alert('Por favor, informe a data em que o contato irá pagar.');
      return;
    }

    let finalPaymentStatus = 'paid';
    let finalInstallments = [];
    let finalInstallmentsCount = 1;

    if (paymentStatus === 'installment') {
      finalPaymentStatus = 'installment';
      finalInstallmentsCount = installmentsCount;
      finalInstallments = installmentsList;
    } else {
      if (upfrontStatus === 'pending') {
        finalPaymentStatus = 'pending';
        finalInstallmentsCount = 1;
        finalInstallments = [
          {
            installment_number: 1,
            amount: priceNum,
            due_date: upfrontDueDate || null,
            status: 'pending'
          }
        ];
      } else {
        finalPaymentStatus = 'paid';
        finalInstallmentsCount = 1;
        finalInstallments = [
          {
            installment_number: 1,
            amount: priceNum,
            due_date: null,
            status: 'paid'
          }
        ];
      }
    }

    onSave({
      app_name: selectedApp,
      price: priceNum,
      payment_status: finalPaymentStatus,
      installments_count: finalInstallmentsCount,
      renewal_date: renewalDate || null,
      installments: finalInstallments
    });
  };

  if (!isOpen) return null;

  return (
    <div className="modal-backdrop" data-testid="app-form-modal-backdrop">
      <div className="modal-content" style={{ maxWidth: '540px' }}>
        <h2>Registrar / Editar Aplicação Contratada</h2>
        <form onSubmit={handleSubmit}>
          <div className="form-group" style={{ marginBottom: '1rem' }}>
            <label>FERRAMENTA / APLICAÇÃO *</label>
            <select value={selectedApp} onChange={(e) => setSelectedApp(e.target.value)}>
              {ALL_APPS.map(a => (
                <option key={a.name} value={a.name}>{a.icon} {a.name}</option>
              ))}
            </select>
          </div>

          <div className="form-group" style={{ marginBottom: '1rem' }}>
            <label>VALOR TOTAL DA APLICAÇÃO (EM R$) *</label>
            <input 
              type="text" 
              required 
              placeholder="Ex: 2000,00"
              value={priceInput}
              onChange={(e) => handlePriceChange(e.target.value)}
              data-testid="app-price-input"
            />
          </div>

          {/* Campo de Data de Renovação */}
          <div className="form-group" style={{ marginBottom: '1rem' }}>
            <label>DATA DE RENOVAÇÃO (OPCIONAL)</label>
            <input 
              type="date" 
              value={renewalDate}
              onChange={(e) => setRenewalDate(e.target.value)}
              data-testid="app-renewal-date-input"
              style={{ width: '100%', marginTop: '0.4rem' }}
            />
          </div>

          <div className="form-group" style={{ marginBottom: '1rem' }}>
            <label>FORMA DE PAGAMENTO *</label>
            <div style={{ display: 'flex', gap: '1rem', marginTop: '0.4rem' }}>
              <label style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#fff', fontSize: '0.9rem' }}>
                <input 
                  type="radio" 
                  name="payment_status" 
                  value="paid"
                  checked={paymentStatus === 'paid'}
                  onChange={() => setPaymentStatus('paid')}
                  style={{ accentColor: 'var(--emerald-primary)' }}
                  data-testid="payment-upfront-radio"
                />
                ✓ À VISTA
              </label>
              <label style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#fff', fontSize: '0.9rem' }}>
                <input 
                  type="radio" 
                  name="payment_status" 
                  value="installment"
                  checked={paymentStatus === 'installment'}
                  onChange={() => {
                    setPaymentStatus('installment');
                    const priceNum = parseFloat(priceInput.replace(',', '.')) || 0;
                    setInstallmentsList(syncInstallmentsWithCount(installmentsCount, priceNum, installmentsList));
                  }}
                  style={{ accentColor: '#eab308' }}
                  data-testid="payment-installment-radio"
                />
                ⏳ PARCELADO
              </label>
            </div>
          </div>

          {/* Sub-opções quando Forma de Pagamento é À VISTA */}
          {paymentStatus === 'paid' && (
            <div style={{ background: 'var(--bg-card-inner)', padding: '1rem', borderRadius: '10px', border: '1px solid var(--border-color)', marginBottom: '1.25rem' }}>
              <label style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.5rem', display: 'block' }}>
                STATUS DO PAGAMENTO À VISTA *
              </label>
              <div style={{ display: 'flex', gap: '1.5rem', marginBottom: upfrontStatus === 'pending' ? '0.85rem' : '0' }}>
                <label style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#fff', fontSize: '0.88rem' }}>
                  <input 
                    type="radio" 
                    name="upfront_status" 
                    value="paid"
                    checked={upfrontStatus === 'paid'}
                    onChange={() => setUpfrontStatus('paid')}
                    style={{ accentColor: 'var(--emerald-primary)' }}
                    data-testid="upfront-status-paid-radio"
                  />
                  ✓ Já Pagou
                </label>
                <label style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#fff', fontSize: '0.88rem' }}>
                  <input 
                    type="radio" 
                    name="upfront_status" 
                    value="pending"
                    checked={upfrontStatus === 'pending'}
                    onChange={() => setUpfrontStatus('pending')}
                    style={{ accentColor: '#eab308' }}
                    data-testid="upfront-status-pending-radio"
                  />
                  ⏳ A Pagar (Pendente)
                </label>
              </div>

              {upfrontStatus === 'pending' && (
                <div className="form-group" style={{ marginTop: '0.75rem' }}>
                  <label style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                    DATA EM QUE O CONTATO IRÁ PAGAR *
                  </label>
                  <input 
                    type="date"
                    value={upfrontDueDate}
                    onChange={(e) => setUpfrontDueDate(e.target.value)}
                    required={upfrontStatus === 'pending'}
                    style={{ marginTop: '0.4rem', width: '100%' }}
                    data-testid="upfront-due-date-input"
                  />
                </div>
              )}
            </div>
          )}

          {paymentStatus === 'installment' && (
            <div style={{ background: 'var(--bg-card-inner)', padding: '1rem', borderRadius: '10px', border: '1px solid var(--border-color)', marginBottom: '1.25rem' }}>
              <div className="form-group" style={{ marginBottom: '1rem' }}>
                <label>NÚMERO DE PARCELAS *</label>
                <select 
                  value={installmentsCount}
                  onChange={(e) => handleInstallmentsCountChange(e.target.value)}
                  data-testid="installments-count-select"
                >
                  {[2, 3, 4, 5, 6, 7, 8, 9, 10, 12, 18, 24].map(num => (
                    <option key={num} value={num}>{num}x parcelas</option>
                  ))}
                </select>
              </div>

              <label style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.5rem', display: 'block' }}>
                CRONOGRAMA DE VENCIMENTO E VALORES ({installmentsList.length} PARCELAS)
              </label>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', maxHeight: '200px', overflowY: 'auto' }}>
                {installmentsList.map((inst, index) => (
                  <div key={index} style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.8rem', color: '#fff', fontWeight: '700', width: '75px' }}>
                      {inst.installment_number}ª Parcela:
                    </span>
                    <input 
                      type="number"
                      step="0.01"
                      value={inst.amount}
                      onChange={(e) => updateInstallmentItem(index, 'amount', parseFloat(e.target.value) || 0)}
                      style={{ width: '100px', fontSize: '0.85rem' }}
                      placeholder="Valor R$"
                    />
                    <input 
                      type="date"
                      value={inst.due_date || ''}
                      onChange={(e) => updateInstallmentItem(index, 'due_date', e.target.value)}
                      style={{ flex: 1, fontSize: '0.85rem' }}
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="modal-actions">
            <button type="button" className="btn btn-dark" onClick={onClose}>
              Cancelar
            </button>
            <button type="submit" className="btn btn-emerald" data-testid="save-app-btn">
              Salvar Compra
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
