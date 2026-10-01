import { useState, useEffect } from 'react';
import './App.css';

// Formatter for CLP
const formatCLP = (amount) => {
  return new Intl.NumberFormat('es-CL', {
    style: 'currency',
    currency: 'CLP',
  }).format(amount);
};

const getMonthlyAmount = (cost) => {
  if (cost.type === 'installment' && cost.installmentsTotal) {
    return Math.round(cost.amount / cost.installmentsTotal);
  }
  return cost.amount;
};

const getCurrentMonthStr = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
};

const formatMonth = (monthStr) => {
  const [year, month] = monthStr.split('-');
  const date = new Date(year, parseInt(month) - 1);
  const str = date.toLocaleDateString('es-CL', { month: 'long', year: 'numeric' });
  return str.charAt(0).toUpperCase() + str.slice(1);
};

const EditableItem = ({ item, isIncome, onSave, onDelete, onTogglePaid, onUpdateInstallments }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(item.name);
  const [editAmount, setEditAmount] = useState(item.amount);
  const [editInstallmentsTotal, setEditInstallmentsTotal] = useState(item.installmentsTotal || 2);

  const handleSave = () => {
    if (!editName || !editAmount) return;
    onSave(item.id, editName, parseInt(editAmount, 10), parseInt(editInstallmentsTotal, 10));
    setIsEditing(false);
  };

  if (isEditing) {
    return (
      <div className="cost-item editing">
        <div className="edit-inputs">
          <input 
            type="text" value={editName} onChange={e => setEditName(e.target.value)} 
            className="form-input small" placeholder="Descripción"
          />
          <input 
            type="number" value={editAmount} onChange={e => setEditAmount(e.target.value)} 
            className="form-input small" placeholder={item.type === 'installment' ? "Monto Total" : "Monto"} min="1"
          />
          {item.type === 'installment' && (
             <input 
               type="number" value={editInstallmentsTotal} onChange={e => setEditInstallmentsTotal(e.target.value)} 
               className="form-input small" placeholder="Cuotas" min="2" style={{width: '80px'}}
             />
          )}
        </div>
        <div className="edit-actions">
          <button type="button" className="btn-action save" onClick={handleSave} aria-label="Guardar">✔</button>
          <button type="button" className="btn-action cancel" onClick={() => setIsEditing(false)} aria-label="Cancelar">✕</button>
        </div>
      </div>
    );
  }

  return (
    <div className={`cost-item ${item.isPaid ? 'paid' : ''} ${item.type === 'installment' && item.installmentsPaid >= item.installmentsTotal ? 'completed' : ''}`}>
      <div className="cost-info">
        <span className="cost-name">{item.name} {item.type === 'installment' && item.installmentsPaid >= item.installmentsTotal && " (¡Pagado total!)"}</span>
        {!isIncome ? (
          <div className="cost-actions-sub">
            <label className="checkbox-wrap">
              <input type="checkbox" checked={item.isPaid} onChange={() => onTogglePaid(item.id)} />
              <span>{item.type === 'saving' ? 'Guardado / Transferido' : 'Pagado este mes'}</span>
            </label>
            {item.type === 'installment' && (
               <div className="installment-progress">
                 <button type="button" onClick={() => onUpdateInstallments(item.id, -1)} disabled={item.installmentsPaid <= 0}>-</button>
                 <span className="installment-text">{item.installmentsPaid} / {item.installmentsTotal} cuotas</span>
                 <button type="button" onClick={() => onUpdateInstallments(item.id, 1)} disabled={item.installmentsPaid >= item.installmentsTotal}>+</button>
               </div>
            )}
          </div>
        ) : (
          <span className="cost-date">{new Date(item.date).toLocaleDateString('es-CL')}</span>
        )}
      </div>
      <div className="cost-amount-wrap">
        <div className="amount-display">
          <span className="cost-amount">
            {formatCLP(getMonthlyAmount(item))} 
            {item.type === 'installment' && <span className="month-label">/mes</span>}
          </span>
          {item.type === 'installment' && (
             <span className="total-label">Total: {formatCLP(item.amount)}</span>
          )}
        </div>
        <button type="button" className="btn-action edit" onClick={() => setIsEditing(true)} aria-label="Editar">✎</button>
        <button type="button" className="btn-action delete" onClick={() => onDelete(item.id)} aria-label="Eliminar">✕</button>
      </div>
    </div>
  );
};

function App() {
  const [currentMonth, setCurrentMonth] = useState(getCurrentMonthStr());
  
  const [data, setData] = useState(() => {
    const saved = localStorage.getItem('gastos-chile-data');
    if (saved) return JSON.parse(saved);
    
    // Migration from old flat storage
    const oldCosts = JSON.parse(localStorage.getItem('gastos-chile-costs') || '[]');
    const oldIncomes = JSON.parse(localStorage.getItem('gastos-chile-incomes') || '[]');
    
    const initialMonth = getCurrentMonthStr();
    return {
      [initialMonth]: {
        costs: oldCosts.length ? oldCosts : [],
        incomes: oldIncomes.length ? oldIncomes : []
      }
    };
  });

  const [name, setName] = useState('');
  const [amount, setAmount] = useState('');
  const [type, setType] = useState('fixed');
  const [installments, setInstallments] = useState('12');

  useEffect(() => {
    localStorage.setItem('gastos-chile-data', JSON.stringify(data));
  }, [data]);

  const handlePrevMonth = () => {
    const [year, month] = currentMonth.split('-').map(Number);
    const date = new Date(year, month - 2);
    setCurrentMonth(`${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`);
  };
  
  const handleNextMonth = () => {
    const [year, month] = currentMonth.split('-').map(Number);
    const date = new Date(year, month);
    setCurrentMonth(`${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`);
  };

  const monthData = data[currentMonth];

  if (!monthData) {
    const availableMonths = Object.keys(data).sort().reverse();
    const latestMonth = availableMonths[0];

    return (
      <div className="app-container">
        <header className="header">
          <h1>Control Financiero</h1>
          <div className="month-navigator">
            <button onClick={handlePrevMonth} className="btn-nav" aria-label="Mes anterior">◀</button>
            <h2 className="current-month">{formatMonth(currentMonth)}</h2>
            <button onClick={handleNextMonth} className="btn-nav" aria-label="Mes siguiente">▶</button>
          </div>
        </header>
        <div className="empty-state glass-panel" style={{padding: '3rem'}}>
          <h2 style={{marginBottom: '1rem'}}>No hay datos para {formatMonth(currentMonth)}</h2>
          <p style={{color: 'var(--text-muted)', marginBottom: '2rem'}}>Puedes iniciar este mes copiando tus gastos e ingresos del mes anterior.</p>
          <div style={{display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap'}}>
            {latestMonth && (
              <button 
                className="btn-primary" 
                onClick={() => {
                  const source = data[latestMonth];
                  setData({
                    ...data,
                    [currentMonth]: {
                      costs: source.costs.map(c => ({ ...c, isPaid: false })),
                      incomes: source.incomes.map(i => ({ ...i }))
                    }
                  });
                }}
              >
                Duplicar desde {formatMonth(latestMonth)}
              </button>
            )}
            <button 
              className="btn-primary" style={{background: 'var(--bg-surface)'}}
              onClick={() => {
                setData({
                  ...data,
                  [currentMonth]: { costs: [], incomes: [] }
                });
              }}
            >
              Comenzar en blanco
            </button>
          </div>
        </div>
      </div>
    );
  }

  const currentCosts = monthData.costs;
  const currentIncomes = monthData.incomes;

  const updateCurrentMonthData = (newCosts, newIncomes) => {
    setData({
      ...data,
      [currentMonth]: {
        costs: newCosts || currentCosts,
        incomes: newIncomes || currentIncomes
      }
    });
  };

  const handleAdd = (e) => {
    e.preventDefault();
    if (!name || !amount) return;
    
    const parsedAmount = parseInt(amount, 10);
    
    if (type === 'income') {
      const newIncome = { id: Date.now(), name, amount: parsedAmount, date: new Date().toISOString() };
      updateCurrentMonthData(null, [...currentIncomes, newIncome]);
    } else {
      const newCost = { 
        id: Date.now(), 
        name, 
        amount: parsedAmount, 
        type, 
        isPaid: false, 
        date: new Date().toISOString(),
        installmentsTotal: type === 'installment' ? parseInt(installments, 10) : null,
        installmentsPaid: type === 'installment' ? 0 : null
      };
      updateCurrentMonthData([...currentCosts, newCost], null);
    }

    setName('');
    setAmount('');
  };

  const editCost = (id, newName, newAmount, newInstallmentsTotal) => {
    updateCurrentMonthData(currentCosts.map(c => {
      if (c.id === id) {
        return { 
          ...c, 
          name: newName, 
          amount: newAmount,
          installmentsTotal: c.type === 'installment' ? newInstallmentsTotal : c.installmentsTotal
        };
      }
      return c;
    }), null);
  };

  const editIncome = (id, newName, newAmount) => {
    updateCurrentMonthData(null, currentIncomes.map(i => i.id === id ? { ...i, name: newName, amount: newAmount } : i));
  };

  const deleteCost = (id) => updateCurrentMonthData(currentCosts.filter(c => c.id !== id), null);
  const deleteIncome = (id) => updateCurrentMonthData(null, currentIncomes.filter(i => i.id !== id));
  
  const togglePaid = (id) => {
    updateCurrentMonthData(currentCosts.map(c => c.id === id ? { ...c, isPaid: !c.isPaid } : c), null);
  };

  const updateInstallments = (id, change) => {
    updateCurrentMonthData(currentCosts.map(c => {
      if (c.id === id && c.type === 'installment') {
        const newPaid = Math.max(0, Math.min(c.installmentsTotal, c.installmentsPaid + change));
        return { ...c, installmentsPaid: newPaid };
      }
      return c;
    }), null);
  };

  const totalIncome = currentIncomes.reduce((acc, curr) => acc + curr.amount, 0);
  
  const fixedCosts = currentCosts.filter(c => c.type === 'fixed');
  const variableCosts = currentCosts.filter(c => c.type === 'variable');
  const installmentCosts = currentCosts.filter(c => c.type === 'installment');
  const savingCosts = currentCosts.filter(c => c.type === 'saving');
  
  const totalSavings = savingCosts.reduce((acc, curr) => acc + getMonthlyAmount(curr), 0);
  const totalCosts = fixedCosts.concat(variableCosts, installmentCosts).reduce((acc, curr) => acc + getMonthlyAmount(curr), 0);
  
  const pendingToPay = currentCosts.filter(c => !c.isPaid).reduce((acc, curr) => acc + getMonthlyAmount(curr), 0);
  const balance = totalIncome - totalCosts - totalSavings;

  return (
    <div className="app-container">
      <header className="header">
        <h1>Control Financiero</h1>
        <div className="month-navigator">
          <button onClick={handlePrevMonth} className="btn-nav" aria-label="Mes anterior">◀</button>
          <h2 className="current-month">{formatMonth(currentMonth)}</h2>
          <button onClick={handleNextMonth} className="btn-nav" aria-label="Mes siguiente">▶</button>
        </div>
      </header>

      <div className="summary-grid">
        <div className="summary-card glass-panel income">
          <span className="summary-title">Ingresos Totales</span>
          <span className="summary-amount" style={{ color: 'var(--accent-variable)' }}>{formatCLP(totalIncome)}</span>
        </div>
        <div className="summary-card glass-panel total">
          <span className="summary-title">Gastos del Mes</span>
          <span className="summary-amount">{formatCLP(totalCosts)}</span>
        </div>
        <div className="summary-card glass-panel saving">
          <span className="summary-title">Ahorro Mensual</span>
          <span className="summary-amount" style={{ color: 'var(--accent-saving)' }}>{formatCLP(totalSavings)}</span>
        </div>
        <div className="summary-card glass-panel warning">
          <span className="summary-title">Falta por Pagar</span>
          <span className="summary-amount" style={{ color: pendingToPay > 0 ? 'var(--danger)' : 'var(--text-main)' }}>{formatCLP(pendingToPay)}</span>
        </div>
        <div className="summary-card glass-panel balance">
          <span className="summary-title">Saldo Estimado</span>
          <span className="summary-amount" style={{ color: balance >= 0 ? 'var(--accent-primary)' : 'var(--danger)' }}>
            {formatCLP(balance)}
          </span>
        </div>
      </div>

      <form className="add-form glass-panel" onSubmit={handleAdd}>
        <div className="form-group">
          <label>Descripción</label>
          <input 
            type="text" className="form-input" placeholder="Ej. Luz, Sueldo..." 
            value={name} onChange={(e) => setName(e.target.value)} required
          />
        </div>
        <div className="form-group">
          <label>{type === 'installment' ? 'Monto Total (CLP)' : 'Monto (CLP)'}</label>
          <input 
            type="number" className="form-input" placeholder="Ej. 15000" 
            value={amount} onChange={(e) => setAmount(e.target.value)} min="1" required
          />
        </div>
        {type === 'installment' && (
          <div className="form-group">
            <label>N° Cuotas</label>
            <input 
              type="number" className="form-input" placeholder="Ej. 12" 
              value={installments} onChange={(e) => setInstallments(e.target.value)} min="2" required
            />
          </div>
        )}
        <div className="form-group">
          <label>Categoría</label>
          <select className="form-input" value={type} onChange={(e) => setType(e.target.value)}>
            <option value="income">Ingreso</option>
            <option value="fixed">Gasto Fijo</option>
            <option value="variable">Gasto Variable</option>
            <option value="installment">En Cuotas</option>
            <option value="saving">Ahorro</option>
          </select>
        </div>
        <button type="submit" className="btn-primary">Añadir</button>
      </form>

      <div className="lists-container">
        
        {/* INGRESOS */}
        <div className="list-section income">
          <h2>💰 Ingresos</h2>
          <div className="cost-list">
            {currentIncomes.length === 0 ? (
              <div className="empty-state">No hay ingresos registrados</div>
            ) : (
              currentIncomes.map(income => (
                <EditableItem 
                  key={income.id}
                  item={income}
                  isIncome={true}
                  onSave={editIncome}
                  onDelete={deleteIncome}
                />
              ))
            )}
          </div>
        </div>

        {/* GASTOS FIJOS */}
        <div className="list-section fixed">
          <h2>📅 Gastos Fijos</h2>
          <div className="cost-list">
            {fixedCosts.length === 0 ? (
              <div className="empty-state">No hay gastos fijos</div>
            ) : (
              fixedCosts.map(cost => (
                <EditableItem 
                  key={cost.id}
                  item={cost}
                  isIncome={false}
                  onSave={editCost}
                  onDelete={deleteCost}
                  onTogglePaid={togglePaid}
                />
              ))
            )}
          </div>
        </div>
        
        {/* GASTOS EN CUOTAS */}
        <div className="list-section installment">
          <h2 style={{color: '#a855f7'}}>💳 En Cuotas</h2>
          <div className="cost-list">
            {installmentCosts.length === 0 ? (
              <div className="empty-state">No hay compras en cuotas</div>
            ) : (
              installmentCosts.map(cost => (
                <EditableItem 
                  key={cost.id}
                  item={cost}
                  isIncome={false}
                  onSave={editCost}
                  onDelete={deleteCost}
                  onTogglePaid={togglePaid}
                  onUpdateInstallments={updateInstallments}
                />
              ))
            )}
          </div>
        </div>

        {/* GASTOS VARIABLES */}
        <div className="list-section variable">
          <h2>🛒 Gastos Variables</h2>
          <div className="cost-list">
            {variableCosts.length === 0 ? (
              <div className="empty-state">No hay gastos variables</div>
            ) : (
              variableCosts.map(cost => (
                <EditableItem 
                  key={cost.id}
                  item={cost}
                  isIncome={false}
                  onSave={editCost}
                  onDelete={deleteCost}
                  onTogglePaid={togglePaid}
                />
              ))
            )}
          </div>
        </div>
        
        {/* AHORRO */}
        <div className="list-section saving">
          <h2 style={{color: 'var(--accent-saving)'}}>🐖 Ahorros</h2>
          <div className="cost-list">
            {savingCosts.length === 0 ? (
              <div className="empty-state">No hay ahorros planificados</div>
            ) : (
              savingCosts.map(cost => (
                <EditableItem 
                  key={cost.id}
                  item={cost}
                  isIncome={false}
                  onSave={editCost}
                  onDelete={deleteCost}
                  onTogglePaid={togglePaid}
                />
              ))
            )}
          </div>
        </div>

      </div>
    </div>
  );
}

export default App;
