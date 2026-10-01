import { useState, useEffect } from 'react';
import './App.css';

// Formatter for CLP
const formatCLP = (amount) => {
  return new Intl.NumberFormat('es-CL', {
    style: 'currency',
    currency: 'CLP',
  }).format(amount);
};

function App() {
  const [costs, setCosts] = useState(() => {
    const saved = localStorage.getItem('gastos-chile-costs');
    if (saved) return JSON.parse(saved);
    return [
      { id: 1, name: 'Arriendo / Dividendo', amount: 450000, type: 'fixed', isPaid: true, date: new Date().toISOString() },
      { id: 2, name: 'Luz', amount: 25000, type: 'fixed', isPaid: false, date: new Date().toISOString() },
    ];
  });

  const [incomes, setIncomes] = useState(() => {
    const saved = localStorage.getItem('gastos-chile-incomes');
    if (saved) return JSON.parse(saved);
    return [
      { id: 1, name: 'Sueldo', amount: 800000, date: new Date().toISOString() }
    ];
  });

  const [name, setName] = useState('');
  const [amount, setAmount] = useState('');
  const [type, setType] = useState('fixed'); // 'fixed', 'variable', 'income'

  useEffect(() => {
    localStorage.setItem('gastos-chile-costs', JSON.stringify(costs));
    localStorage.setItem('gastos-chile-incomes', JSON.stringify(incomes));
  }, [costs, incomes]);

  const handleAdd = (e) => {
    e.preventDefault();
    if (!name || !amount) return;
    
    const parsedAmount = parseInt(amount, 10);
    
    if (type === 'income') {
      const newIncome = { id: Date.now(), name, amount: parsedAmount, date: new Date().toISOString() };
      setIncomes([...incomes, newIncome]);
    } else {
      const newCost = { id: Date.now(), name, amount: parsedAmount, type, isPaid: false, date: new Date().toISOString() };
      setCosts([...costs, newCost]);
    }

    setName('');
    setAmount('');
  };

  const deleteCost = (id) => setCosts(costs.filter(c => c.id !== id));
  const deleteIncome = (id) => setIncomes(incomes.filter(i => i.id !== id));
  
  const togglePaid = (id) => {
    setCosts(costs.map(c => c.id === id ? { ...c, isPaid: !c.isPaid } : c));
  };

  const totalIncome = incomes.reduce((acc, curr) => acc + curr.amount, 0);
  const fixedCosts = costs.filter(c => c.type === 'fixed');
  const variableCosts = costs.filter(c => c.type === 'variable');
  const totalCosts = costs.reduce((acc, curr) => acc + curr.amount, 0);
  const pendingToPay = costs.filter(c => !c.isPaid).reduce((acc, curr) => acc + curr.amount, 0);
  const balance = totalIncome - totalCosts;

  return (
    <div className="app-container">
      <header className="header">
        <h1>Control Financiero</h1>
        <p>Ingresos, gastos y pagos pendientes de tu hogar</p>
      </header>

      <div className="summary-grid">
        <div className="summary-card glass-panel income">
          <span className="summary-title">Ingresos Totales</span>
          <span className="summary-amount" style={{ color: 'var(--accent-variable)' }}>{formatCLP(totalIncome)}</span>
        </div>
        <div className="summary-card glass-panel total">
          <span className="summary-title">Gastos Totales</span>
          <span className="summary-amount">{formatCLP(totalCosts)}</span>
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
          <label>Monto (CLP)</label>
          <input 
            type="number" className="form-input" placeholder="Ej. 15000" 
            value={amount} onChange={(e) => setAmount(e.target.value)} min="1" required
          />
        </div>
        <div className="form-group">
          <label>Categoría</label>
          <select className="form-input" value={type} onChange={(e) => setType(e.target.value)}>
            <option value="income">Ingreso</option>
            <option value="fixed">Gasto Fijo</option>
            <option value="variable">Gasto Variable</option>
          </select>
        </div>
        <button type="submit" className="btn-primary">Añadir</button>
      </form>

      <div className="lists-container">
        
        {/* INGRESOS */}
        <div className="list-section income">
          <h2>💰 Ingresos</h2>
          <div className="cost-list">
            {incomes.length === 0 ? (
              <div className="empty-state">No hay ingresos registrados</div>
            ) : (
              incomes.map(income => (
                <div key={income.id} className="cost-item">
                  <div className="cost-info">
                    <span className="cost-name">{income.name}</span>
                    <span className="cost-date">{new Date(income.date).toLocaleDateString('es-CL')}</span>
                  </div>
                  <div className="cost-amount-wrap">
                    <span className="cost-amount">{formatCLP(income.amount)}</span>
                    <button type="button" className="btn-delete" onClick={() => deleteIncome(income.id)} aria-label="Eliminar">✕</button>
                  </div>
                </div>
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
                <div key={cost.id} className={`cost-item ${cost.isPaid ? 'paid' : ''}`}>
                  <div className="cost-info">
                    <span className="cost-name">{cost.name}</span>
                    <label className="checkbox-wrap">
                      <input type="checkbox" checked={cost.isPaid} onChange={() => togglePaid(cost.id)} />
                      <span>Pagado</span>
                    </label>
                  </div>
                  <div className="cost-amount-wrap">
                    <span className="cost-amount">{formatCLP(cost.amount)}</span>
                    <button type="button" className="btn-delete" onClick={() => deleteCost(cost.id)} aria-label="Eliminar">✕</button>
                  </div>
                </div>
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
                <div key={cost.id} className={`cost-item ${cost.isPaid ? 'paid' : ''}`}>
                  <div className="cost-info">
                    <span className="cost-name">{cost.name}</span>
                    <label className="checkbox-wrap">
                      <input type="checkbox" checked={cost.isPaid} onChange={() => togglePaid(cost.id)} />
                      <span>Pagado</span>
                    </label>
                  </div>
                  <div className="cost-amount-wrap">
                    <span className="cost-amount">{formatCLP(cost.amount)}</span>
                    <button type="button" className="btn-delete" onClick={() => deleteCost(cost.id)} aria-label="Eliminar">✕</button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

      </div>
    </div>
  );
}

export default App;
