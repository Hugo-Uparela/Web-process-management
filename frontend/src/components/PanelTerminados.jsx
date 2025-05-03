import React from 'react';

export default function PanelTerminados({ doneList, quantum }) {
  return (
    <div className="state-column scrollable">
      <h3>Terminados</h3>
      {doneList.map(p => (
        <div key={p.pid} className="process-card done">
          <div><strong>Proceso:</strong> {p.nombre}</div>
          <div><strong>PID:</strong> {p.pid}</div>
          <div><strong>Usuario:</strong> {p.usuario}</div>
          <div><br /><strong>Tiempo de Llegada:</strong> {p.arrival}</div>
          <div><strong>Ráfaga:</strong> {p.burst}</div>
          <div><strong>Prioridad:</strong> {p.prioridad === 0 ? 'Expulsivo' : 'No expulsivo'}</div>
          <div><strong>Turnaround:</strong> {p.executions}</div>
          <div><br /><strong>Tiempo Finalización:</strong> {quantum * p.executions}</div>
        </div>
      ))}
    </div>
  );
}
