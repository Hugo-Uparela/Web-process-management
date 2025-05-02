// src/App.jsx
import React, { useState, useEffect } from 'react';
import initSqlJs from 'sql.js';
import './App.css';

// Helper delay
const delay = ms => new Promise(res => setTimeout(res, ms));

export default function App() {
  const [SQL, setSQL] = useState(null);
  const [db, setDb] = useState(null);
  const [tipo, setTipo] = useState('cpu');
  const [quantum, setQuantum] = useState(200);
  const [catalogos, setCatalogos] = useState([]);
  const [readyQueue, setReadyQueue] = useState([]);
  const [execProcess, setExecProcess] = useState(null);
  const [doneList, setDoneList] = useState([]);

  // Cargar sql.js + WASM
  useEffect(() => {
    initSqlJs({ locateFile: file => `/sql-wasm.wasm` })
      .then(SQLLib => setSQL(SQLLib))
      .catch(console.error);
  }, []);

  // Leer base de datos
  const onFileChange = async e => {
    if (!SQL) return;
    const buf = await e.target.files[0].arrayBuffer();
    const database = new SQL.Database(new Uint8Array(buf));
    setDb(database);
    setCatalogos([]);
    setReadyQueue([]);
    setExecProcess(null);
    setDoneList([]);
  };

  // Listar catálogos
  useEffect(() => {
    if (!db) return;
    const stmt = db.prepare(
      `SELECT DISTINCT catalog_id, nombre_catalogo FROM ${tipo} ORDER BY catalog_id;`
    );
    const rows = [];
    while (stmt.step()) {
      const [id, nombre] = stmt.get();
      rows.push({ id, nombre });
    }
    stmt.free();
    setCatalogos(rows);
    setReadyQueue([]);
    setExecProcess(null);
    setDoneList([]);
  }, [db, tipo]);

  // Cargar procesos en readyQueue
  const loadProcesos = catalog_id => {
    if (!db) return;
    const stmt = db.prepare(
      `SELECT pid, nombre, usuario, prioridad FROM ${tipo} WHERE catalog_id = ?;`
    );
    stmt.bind([catalog_id]);
    const rows = [];
    while (stmt.step()) rows.push(stmt.get());
    stmt.free();

    const procs = rows.map(([pid, nombre, usuario, prioridad], idx) => ({
      pid,
      nombre,
      usuario,
      prioridad,
      burst: quantum * nombre.length,
      remaining: quantum * nombre.length,
      executions: 0,
      arrival: idx
    }));

    setReadyQueue(procs);
    setExecProcess(null);
    setDoneList([]);
  };

  // Simulación RR
  const simular = async () => {
    let queue = [...readyQueue];
    setDoneList([]);
    setExecProcess(null);

    while (queue.length > 0) {
      const proc = queue.shift();
      setReadyQueue(queue.slice());
      setExecProcess(proc);

      const runTime = proc.prioridad === 1
        ? proc.remaining
        : Math.min(proc.remaining, quantum);

      await delay(runTime);

      proc.executions += 1;
      proc.remaining -= runTime;

      if (proc.prioridad === 0 && proc.remaining > 0) queue.push(proc);
      else setDoneList(dl => [...dl, proc]);

      setExecProcess(null);
    }
  };

  return (
    <div className="app-container">
      <h1 className="app-title">Simulador Round Robin</h1>

      <div className="file-input">
        <label>Carga tu <code>procesos.db</code>:</label>
        <input type="file" accept=".db" onChange={onFileChange} />
      </div>

      {db && (
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
      )}

      {catalogos.length > 0 && (
        <div className="catalog-list-container">
          <h2>Catálogos</h2>
          <ul className="catalog-list">
            {catalogos.map(c => (
              <li key={c.id} onClick={() => loadProcesos(c.id)}>
                {c.nombre} (<code>{c.id}</code>)
              </li>
            ))}
          </ul>
        </div>
      )}

      {readyQueue.length > 0 && !execProcess && (
        <button className="sim-button" onClick={simular}>
          Iniciar Simulación
        </button>
      )}

      {/* Modelo de Estados Dinámico */}
      <div className="states-container">
        <div className="state-column scrollable">
          <h3>Listos</h3>
          {readyQueue.map(p => (
            <div key={p.pid} className="process-card ready">
              <strong>{p.nombre}</strong>
              <div>PID: {p.pid}</div>
              <div>Llegada (TL): {p.arrival}</div>
              <div>Ráfaga (R): {quantum} × {p.nombre.length} = {p.burst}</div>
              <div>Quantum: {quantum}</div>
              <div>Ejecuciones: {p.executions}</div>
            </div>
          ))}
        </div>

        <div className="state-column scrollable">
          <h3>Ejecución</h3>
          {execProcess ? (
            <div className="process-card executing">
              <strong>{execProcess.nombre}</strong>
              <div>PID: {execProcess.pid}</div>
              <div>Llegada (TL): {execProcess.arrival}</div>
              <div>Ráfaga (R): {quantum} × {execProcess.nombre.length} = {execProcess.burst}</div>
              <div>Quantum: {quantum}</div>
              <div>Ejecuciones: {execProcess.executions + 1}</div>
            </div>
          ) : (
            <div className="empty">—</div>
          )}
        </div>

        <div className="state-column scrollable">
          <h3>Terminados</h3>
          {doneList.map(p => (
            <div key={p.pid} className="process-card done">
              <strong>{p.nombre}</strong>
              <div>PID: {p.pid}</div>
              <div>Llegada (TL): {p.arrival}</div>
              <div>Ráfaga (R): {quantum} × {p.nombre.length} = {p.burst}</div>
              <div>Quantum: {quantum}</div>
              <div>Ejecuciones: {p.executions}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
