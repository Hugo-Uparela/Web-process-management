import React, { useState, useEffect } from 'react';
import { useSql } from './hooks/useSql';
import { useRoundRobin } from './hooks/useRoundRobin';

import CargaArchivo from './components/CargaArchivo';
import ControlesSimulacion from './components/ControlesSimulacion';
import ListaCatalogos from './components/ListaCatalogos';
import BotonSimulacion from './components/BotonSimulacion';
import PanelListos from './components/PanelListos';
import PanelEjecucion from './components/PanelEjecucion';
import PanelTerminados from './components/PanelTerminados';
import GraficoTurnaround from './components/GraficoTurnaround';
import Footer from './components/Footer';

export default function App() {
  const SQL = useSql();
  const [db, setDb] = useState(null);
  const [tipo, setTipo] = useState('cpu');
  const [quantum, setQuantum] = useState(20);
  const [catalogos, setCatalogos] = useState([]);

  const {
    readyQueue,
    execProcess,
    doneList,
    isSimulating,
    isPaused,
    toggleSimulation,
    loadProcesses
  } = useRoundRobin(quantum);

  // Estado para activar la gráfica
  const [chartReady, setChartReady] = useState(false);

  // Carga de archivo SQLite
  const onFileChange = async e => {
    if (!SQL) return;
    const buf = await e.target.files[0].arrayBuffer();
    const database = new SQL.Database(new Uint8Array(buf));
    setDb(database);
    setCatalogos([]);
  };

  // Consultar catálogos cuando cambian db o tipo
  useEffect(() => {
    if (!db) return;
    const stmt = db.prepare(
      `SELECT DISTINCT catalog_id, nombre_catalogo FROM ${tipo} ORDER BY catalog_id;`
    );
    const rows = [];
    while (stmt.step()) rows.push(stmt.get());
    stmt.free();
    setCatalogos(rows.map(([id, nombre]) => ({ id, nombre })));
  }, [db, tipo]);

  // Preparar datos de procesos al seleccionar catálogo
  const handleLoad = catalog_id => {
    if (!db) return;
    const stmt = db.prepare(
      `SELECT pid, nombre, usuario, prioridad FROM ${tipo} WHERE catalog_id = ?;`
    );
    stmt.bind([catalog_id]);
    const rows = [];
    while (stmt.step()) rows.push(stmt.get());
    stmt.free();

    let lastArrival = -1;
    const procs = rows.map(([pid, nombre, usuario, prioridad]) => {
      const arrival = ++lastArrival;
      const burst = quantum * nombre.length;
      return { pid, nombre, usuario, prioridad, burst, remaining: burst, executions: 0, arrival, finish: null };
    });
    loadProcesses(procs);
  };

  // Control de visibilidad de la gráfica
  useEffect(() => {
    setChartReady(!isSimulating && doneList.length > 0);
  }, [isSimulating, doneList]);

  return (
    <div className="app-container">
      <h1 className="app-title">Simulador Round Robin</h1>

      {!db
        ? <CargaArchivo onFileChange={onFileChange} />
        : <ControlesSimulacion tipo={tipo} setTipo={setTipo} quantum={quantum} setQuantum={setQuantum} />
      }

      <ListaCatalogos
        catalogos={catalogos}
        isSimulating={isSimulating}
        loadProcesos={handleLoad}
      />

      <BotonSimulacion
        readyQueue={readyQueue}
        isSimulating={isSimulating}
        isPaused={isPaused}
        toggleSimulation={toggleSimulation}
      />

      <div className="states-container">
        <PanelListos readyQueue={readyQueue} quantum={quantum} />
        <PanelEjecucion execProcess={execProcess} isPaused={isPaused} quantum={quantum} />
        <PanelTerminados doneList={doneList} quantum={quantum} />
      </div>

      <GraficoTurnaround chartReady={chartReady} doneList={doneList} />

      <Footer />
    </div>
  );
}