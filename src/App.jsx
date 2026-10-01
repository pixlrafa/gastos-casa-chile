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
    const saved = localStorage.getItem('gastos-chile');
    if (saved) {
      return JSON.parse(saved);
    }
    return [
      { id: 1, name: 'Arriendo / Dividendo', amount: 450000, type: 'fixed', date: new Date().toISOString() },
      { id: 2, name: 'Luz', amount: 25000, type: 'fixed', date: new Date().toISOString() },
      { id: 3, name: 'Supermercado', amount: 80000, type: 'variable', date: new Date().toISOString() }
    ];
  });

  const [name, setName] = useState('');
  const [amount, setAmount] = useState('');
  const [type, setType] = useState('fixed');

  useEffect(() => {
    localStorage.setItem('gastos-chile', JSON.stringify(costs));
  }, [costs]);

  const handleAddCost = (e) => {
    e.preventDefault();
    if (!name || !amount) return;

    const newCost = {
      id: Date.now(),
      name,
      amount: parseInt(amount, 10),
      type,
      date: new Date().toISOString()
    };

    setCosts([...costs, newCost]);
    setName('');
    setAmount('');
  };

  const deleteCost = (id) => {
    setCosts(costs.filter(c => c.id !== id));
  };

  const fixedCosts = costs.filter(c => c.type === 'fixed');
  const variableCosts = costs.filter(c => c.type === 'variable');

  const totalFixed = fixedCosts.reduce((acc, curr) => acc + curr.amount, 0);
  const totalVariable = variableCosts.reduce((acc, curr) => acc + curr.amount, 0);
  const total = totalFixed + totalVariable;

  return (
    <div className="app-container">
      <header className="header">
        <h1>Control de Gastos</h1>
        <p>Lleva tus finanzas del hogar en Chile fácilmente</p>
      </header>

      <div className="summary-grid">
        <div className="summary-card glass-panel total">
          <span className="summary-title">Gasto Total</span>
          <span className="summary-amount">{formatCLP(total)}</span>
        </div>
        <div className="summary-card glass-panel fixed">
          <span className="summary-title">Gastos Fijos</span>
          <span className="summary-amount" style={{ color: 'var(--accent-fixed)' }}>{formatCLP(totalFixed)}</span>
        </div>
        <div className="summary-card glass-panel variable">
          <span className="summary-title">Gastos Variables</span>
          <span className="summary-amount" style={{ color: 'var(--accent-variable)' }}>{formatCLP(totalVariable)}</span>
        </div>
      </div>

      <form className="add-form glass-panel" onSubmit={handleAddCost}>
        <div className="form-group">
          <label>Descripción</label>
          <input 
            type="text" 
            className="form-input" 
            placeholder="Ej. Agua, Gas, Cine" 
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>
        <div className="form-group">
          <label>Monto (CLP)</label>
          <input 
            type="number" 
            className="form-input" 
            placeholder="Ej. 15000" 
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            min="1"
          />
        </div>
        <div className="form-group">
          <label>Tipo</label>
          <select 
            className="form-input" 
            value={type} 
            onChange={(e) => setType(e.target.value)}
          >
            <option value="fixed">Fijo</option>
            <option value="variable">Variable</option>
          </select>
        </div>
        <button type="submit" className="btn-primary">Añadir</button>
      </form>

      <div className="lists-container">
        <div className="list-section fixed">
          <h2>Gastos Fijos</h2>
          <div className="cost-list">
            {fixedCosts.length === 0 ? (
              <div className="empty-state">No hay gastos fijos</div>
            ) : (
              fixedCosts.map(cost => (
                <div key={cost.id} className="cost-item">
                  <div className="cost-info">
                    <span className="cost-name">{cost.name}</span>
                    <span className="cost-date">{new Date(cost.date).toLocaleDateString('es-CL')}</span>
                  </div>
                  <div className="cost-amount-wrap">
                    <span className="cost-amount">{formatCLP(cost.amount)}</span>
                    <button className="btn-delete" onClick={() => deleteCost(cost.id)} aria-label="Eliminar">
                      ✕
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="list-section variable">
          <h2>Gastos Variables</h2>
          <div className="cost-list">
            {variableCosts.length === 0 ? (
              <div className="empty-state">No hay gastos variables</div>
            ) : (
              variableCosts.map(cost => (
                <div key={cost.id} className="cost-item">
                  <div className="cost-info">
                    <span className="cost-name">{cost.name}</span>
                    <span className="cost-date">{new Date(cost.date).toLocaleDateString('es-CL')}</span>
                  </div>
                  <div className="cost-amount-wrap">
                    <span className="cost-amount">{formatCLP(cost.amount)}</span>
                    <button className="btn-delete" onClick={() => deleteCost(cost.id)} aria-label="Eliminar">
                      ✕
                    </button>
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
