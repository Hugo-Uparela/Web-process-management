import React, { useState, useEffect, useRef } from 'react';
import initSqlJs from 'sql.js';
import './App.css';

import CargaArchivo from './components/CargaArchivo';
import ControlesSimulacion from './components/ControlesSimulacion';
import ListaCatalogos from './components/ListaCatalogos';
import BotonSimulacion from './components/BotonSimulacion';
import PanelListos from './components/PanelListos';
import PanelEjecucion from './components/PanelEjecucion';
import PanelTerminados from './components/PanelTerminados';
import GraficoTurnaround from './components/GraficoTurnaround';

export default function App() {
  const [SQL, setSQL] = useState(null);
  const [db, setDb] = useState(null);
  const [tipo, setTipo] = useState('cpu');
  const [quantum, setQuantum] = useState(20);
  const [catalogos, setCatalogos] = useState([]);
  const [readyQueue, setReadyQueue] = useState([]);
  const [execProcess, setExecProcess] = useState(null);
  const [doneList, setDoneList] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [chartReady, setChartReady] = useState(false);
  const [isSimulating, setIsSimulating] = useState(false);
  const [isPaused, setIsPaused] = useState(false);

  const queueRef = useRef([]);
  const pausedRef = useRef(false);
  const simulationTimeRef = useRef(0);
  const delay = ms => new Promise(res => setTimeout(res, ms));

  // Cargar sql.js
  useEffect(() => {
    initSqlJs({ locateFile: file => `/sql-wasm.wasm` })
      .then(SQLLib => setSQL(SQLLib))
      .catch(console.error);
  }, []);

  // Preparar chartReady
  useEffect(() => {
    setChartReady(!isSimulating && doneList.length === totalCount && totalCount > 0);
  }, [isSimulating, doneList.length, totalCount]);

  const resetSimulation = () => {
    setExecProcess(null);
    setDoneList([]);
    setIsSimulating(false);
    setIsPaused(false);
    pausedRef.current = false;
    simulationTimeRef.current = 0;
  };

  const onFileChange = async e => {
    if (!SQL) return;
    const buf = await e.target.files[0].arrayBuffer();
    const database = new SQL.Database(new Uint8Array(buf));
    setDb(database);
    setCatalogos([]);
    setReadyQueue([]);
    resetSimulation();
  };

  // Cargar catálogos
  useEffect(() => {
    if (!db) return;
    const stmt = db.prepare(
      `SELECT DISTINCT catalog_id, nombre_catalogo FROM ${tipo} ORDER BY catalog_id;`
    );
    const rows = [];
    while (stmt.step()) rows.push(stmt.get());
    stmt.free();
    setCatalogos(rows.map(([id, nombre]) => ({ id, nombre })));
    setReadyQueue([]);
    resetSimulation();
  }, [db, tipo]);

  const loadProcesos = catalog_id => {
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
    setReadyQueue(procs);
    queueRef.current = procs;
    setTotalCount(procs.length);
    resetSimulation();
  };

  // Simulación RR
  const simular = async () => {
    setIsSimulating(true);
    pausedRef.current = false;
    setIsPaused(false);
    simulationTimeRef.current = 0;
    let queue = [...queueRef.current];
    setDoneList([]);
    while (queue.length) {
      while (pausedRef.current) await delay(50);
      const proc = queue.shift();
      queueRef.current = queue;
      setExecProcess(proc);
      setReadyQueue(queue);
      const runTime = proc.prioridad === 1 ? proc.remaining : Math.min(proc.remaining, quantum);
      let elapsed = 0, tick = 20;
      while (elapsed < runTime) {
        if (pausedRef.current) { await delay(50); continue; }
        const step = Math.min(tick, runTime - elapsed);
        await delay(step);
        elapsed += step;
      }
      simulationTimeRef.current += runTime;
      proc.executions++;
      proc.remaining -= runTime;
      if (proc.prioridad === 0 && proc.remaining > 0) queue.push(proc);
      else { proc.finish = simulationTimeRef.current; setDoneList(dl => [...dl, proc]); }
      setExecProcess(null);
    }
    setIsSimulating(false);
  };

  const toggleSimulation = () => {
    if (!isSimulating) {
      queueRef.current = readyQueue;
      simular();
    } else {
      pausedRef.current = !pausedRef.current;
      setIsPaused(pausedRef.current);
    }
  };

  return (
    <div className="app-container">
      <h1 className="app-title">Simulador Round Robin</h1>
      {!db && <CargaArchivo onFileChange={onFileChange} />}
      {db && <ControlesSimulacion tipo={tipo} setTipo={setTipo} quantum={quantum} setQuantum={setQuantum} />}
      <ListaCatalogos
        catalogos={catalogos}
        isSimulating={isSimulating}
        loadProcesos={loadProcesos}
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
      <footer className="app-footer">
        <div className="footer-content">
          <span>© 2025 Simulador Round Robin</span>
          <span>Universidad de Córdoba – Facultad de Ingenierías</span>
        </div>
      </footer>
    </div>
  );
}