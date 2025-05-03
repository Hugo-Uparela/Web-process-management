import React from 'react';

export default function ControlesSimulacion({ tipo, setTipo, quantum, setQuantum }) {
  return (
    <div className="controls">
      <div>
        <label>Tipo:</label>
        <select value={tipo} onChange={e => setTipo(e.target.value)}>
          <option value="cpu">CPU</option>
          <option value="memoria">Memoria</option>
        </select>
      </div>
      <div>
        <label>Quantum (ms):</label>
        <input
          type="number"
          min="1"
          value={quantum}
          onChange={e => setQuantum(Number(e.target.value))}
        />
      </div>
    </div>
  );
}
