import React from 'react';

export default function BotonSimulacion({ readyQueue, isSimulating, isPaused, toggleSimulation }) {
  if (readyQueue.length === 0) return null;
  return (
    <button className="sim-button" onClick={toggleSimulation}>
      {!isSimulating ? 'Iniciar' : isPaused ? 'Continuar' : 'Pausar'}
    </button>
  );
}
