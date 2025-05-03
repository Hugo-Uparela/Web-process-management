import React from 'react';

export default function PanelListos({ readyQueue, quantum }) {
  return (
    <div className="state-column scrollable">
      <h3>Listos</h3>
      {readyQueue.map(p => (
        <div key={p.pid} className="process-card ready">
          <div><strong>Proceso:</strong> {p.nombre}</div>
          <div><strong>PID:</strong> {p.pid}</div>
          <div><strong>Usuario:</strong> {p.usuario}</div>
          <div><br /><strong>Tiempo de Llegada:</strong> {p.arrival}</div>
          <div><strong>Quantum:</strong> {quantum}</div>
          <div><strong>Ráfaga:</strong> {quantum} × {p.nombre.length} = {p.burst}</div>
          <div><strong>Prioridad:</strong> {p.prioridad === 0 ? 'Expulsivo' : 'No expulsivo'}</div>
          <div><strong>Turnaround:</strong> {p.executions}</div>
        </div>
      ))}
    </div>
  );
}
