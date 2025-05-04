import React from 'react';

export default function PanelEjecucion({ execProcess, isPaused, quantum }) {
  return (
    <div className="state-column scrollable">
      <h3>Ejecución</h3>
      {!execProcess ? (
        <div className="empty">—</div>
      ) : (
        <div className={`process-card executing${isPaused ? ' paused' : ''}`}>
          <div><strong>Proceso:</strong> {execProcess.nombre}</div>
          <div><strong>PID:</strong> {execProcess.pid}</div>
          <div><strong>Usuario:</strong> {execProcess.usuario}</div>
          <div><br /><strong>Quantum:</strong> {quantum}</div>
         <div><strong>Ráfaga:</strong> {execProcess.burst} ms</div>
          <div><strong>Turnaround:</strong> {execProcess.executions + 1}</div>
        </div>
      )}
    </div>
  );
}

