import React, { useState, useEffect, useRef } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, LabelList } from 'recharts';
import initSqlJs from 'sql.js';
import './App.css';

// Helper to delay execution
const delay = ms => new Promise(res => setTimeout(res, ms));

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="custom-tooltip">
        <div className="tooltip-label">{label}</div>
        <div className="tooltip-value">Turnaround: {payload[0].value}</div>
      </div>
    );
  }
  return null;
};

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

  // Load sql.js + WASM
  useEffect(() => {
    initSqlJs({ locateFile: file => `/sql-wasm.wasm` })
      .then(SQLLib => setSQL(SQLLib))
      .catch(console.error);
  }, []);

  useEffect(() => {
    if (!isSimulating && doneList.length === totalCount && totalCount > 0) {
      setChartReady(true);
    } else {
      setChartReady(false);
    }
  }, [isSimulating, doneList.length, totalCount]);
  

  // Reset simulation state
  const resetSimulation = () => {
    setExecProcess(null);
    setDoneList([]);
    setIsSimulating(false);
    setIsPaused(false);
    pausedRef.current = false;
    simulationTimeRef.current = 0;
  };

  // Handle file upload
  const onFileChange = async e => {
    if (!SQL) return;
    const buf = await e.target.files[0].arrayBuffer();
    const database = new SQL.Database(new Uint8Array(buf));
    setDb(database);
    setCatalogos([]);
    setReadyQueue([]);
    resetSimulation();
  };

  // List catalogs when DB or type changes
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
    resetSimulation();
  }, [db, tipo]);

  // Load processes into ready queue
  const loadProcesos = catalog_id => {
    if (!db) return;
    const stmt = db.prepare(
      `SELECT pid, nombre, usuario, prioridad FROM ${tipo} WHERE catalog_id = ?;`
    );
    stmt.bind([catalog_id]);
    const rows = [];
    while (stmt.step()) rows.push(stmt.get());
    stmt.free();


    //  calculamos arrival según la guía:
    // Si listo está vacío → T.L = 0; sino → T.L = T.L_último + 1
    let lastArrival = -1;
    const procs = rows.map(([pid, nombre, usuario, prioridad]) => {
      const arrival = lastArrival + 1;
      lastArrival = arrival;
      const burst = quantum * nombre.length;

      return {
        pid,
        nombre,
        usuario,
        prioridad,
        burst,
        remaining: burst,
        executions: 0,
        arrival,
        finish: null
      };
    });

    setReadyQueue(procs);
    queueRef.current = procs;
    setTotalCount(procs.length);
    resetSimulation();
  };


  // Run Round Robin simulation
  const simular = async () => {
    setIsSimulating(true);
    pausedRef.current = false;
    setIsPaused(false);
    simulationTimeRef.current = 0;

    let queue = [...queueRef.current];
    setDoneList([]);

    while (queue.length > 0) {
      // pause handling
      while (pausedRef.current) {
        await delay(50);
      }
      const proc = queue.shift();
      queueRef.current = queue;
      setExecProcess(proc);
      setReadyQueue(queue);

      const runTime = proc.prioridad === 1
        ? proc.remaining
        : Math.min(proc.remaining, quantum);

      // simulate in small ticks for immediate pause
      let elapsed = 0;
      const tick = 20;
      while (elapsed < runTime) {
        if (pausedRef.current) {
          await delay(50);
          continue;
        }
        const step = Math.min(tick, runTime - elapsed);
        await delay(step);
        elapsed += step;
      }

      // advance global clock
      simulationTimeRef.current += runTime;
      proc.executions += 1;
      proc.remaining -= runTime;

      if (proc.prioridad === 0 && proc.remaining > 0) {
        queue.push(proc);
      } else {
        proc.finish = simulationTimeRef.current;
        setDoneList(dl => [...dl, proc]);
      }
      setExecProcess(null);
    }
    setIsSimulating(false);
  };

  // Toggle start/pause/continue
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

      {!db && (
        <div className="file-input">
          <label>Carga tu Archivo<code>.db</code>:</label>
          <input type="file" accept=".db" onChange={onFileChange} />
        </div>
      )}

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
        <div className={`catalog-list-container${isSimulating ? ' disabled' : ''}`}>
          {isSimulating && <div className="overlay" />}
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

      {readyQueue.length > 0 && (
        <button className="sim-button" onClick={toggleSimulation}>
          {!isSimulating ? 'Iniciar' : isPaused ? 'Continuar' : 'Pausar'}
        </button>
      )}

      {/* State panels with full fields */}
      <div className="states-container">
        <div className="state-column scrollable">
          <h3>Listos</h3>
          {readyQueue.map(p => (
            <div key={p.pid} className="process-card ready">
              <div><strong>Proceso:</strong> {p.nombre}</div>
              <div><strong>PID:</strong> {p.pid}</div>
              <div><strong>Tiempo de Llegada:</strong> {p.arrival}</div>
              <div><strong>Quantum:</strong> {quantum}</div>
              <div><strong>Ráfaga:</strong> {quantum} × {p.nombre.length} = {p.burst}</div>
              <div><strong>Prioridad:</strong> {p.prioridad === 0 ? 'Expulsivo' : 'No expulsivo'}</div>
              <div><strong>Turnaround:</strong> {p.executions}</div>
            </div>
          ))}
        </div>

        <div className="state-column scrollable">
          <h3>Ejecución</h3>
          {!execProcess ? (
            <div className="empty">—</div>
          ) : (
            <div className={`process-card executing${isPaused ? ' paused' : ''}`}>
              <div><strong>Proceso:</strong> {execProcess.nombre}</div>
              <div><strong>PID:</strong> {execProcess.pid}</div>
              <div><strong>Usuario:</strong> {execProcess.usuario}</div>
              <div><br /><strong>Quatum:</strong> {quantum}</div>
              <div><strong>Turnaround:</strong> {execProcess.executions + 1}</div>
            </div>
          )}
        </div>

        <div className="state-column scrollable">
          <h3>Terminados</h3>
          {doneList.map(p => (
            <div key={p.pid} className="process-card done">
              <div><strong>Proceso:</strong> {p.nombre}</div>
              <div><strong>PID:</strong> {p.pid}</div>
              <div><strong>Usuario:</strong>{p.usuario}</div>
              <div><br /><strong>Tiempo de Llegada:</strong> {p.arrival}</div>
              <div><strong>Ráfaga:</strong> {p.burst}</div>
              <div><strong>Prioridad:</strong> {p.prioridad === 0 ? 'Expulsivo' : 'No expulsivo'}</div>
              <div><strong>Turnaround:</strong> {p.executions}</div>

              {/* Tiempo Finalización  Quantum * #Ejecuciones, donde #Ejecuciones  */}
              {/* indica la cantidad de veces que un proceso utilizo la C.P.U  */}
              <div><br /><strong>Tiempo Finalización:</strong> {quantum * p.executions}</div>
            </div>
          ))}
        </div>
      </div>


      {chartReady && (
        <div className="chart-container">
          <BarChart
            width={1000}
            height={500}
            data={doneList.map(p => ({
              name: p.nombre,
              Turnaround: p.executions
            }))}
            margin={{ top: 20, right: 30, left: 20, bottom: 80 }}
            barCategoryGap="25%"
            barSize={40}
          >
            <defs>
              <linearGradient id="gradExec" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--primary-color)" stopOpacity={0.9} />
                <stop offset="100%" stopColor="var(--accent-color)" stopOpacity={0.9} />
              </linearGradient>
            </defs>

            <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />

            <XAxis
              dataKey="name"
              interval={0}
              angle={-45}
              textAnchor="end"
              height={60}
              tick={{ fill: 'var(--text-color)', fontSize: 12 }}
              tickFormatter={str =>
                str.length > 12 ? str.slice(0, 12) + '…' : str
              }
            />

            <YAxis
              domain={[0, 'dataMax']}
              allowDecimals={false}
              tick={{ fill: 'var(--text-color)', fontSize: 12 }}
            />

            <Tooltip
              cursor={false}                           // <-- desactiva el rectángulo de hover
              contentStyle={{
                background: 'rgba(0,0,0,0.8)',
                border: 'none',
                boxShadow: '0 2px 8px rgba(0,0,0,0.5)',
                borderRadius: '6px',
                padding: '0.5rem 1rem'
              }}
              itemStyle={{ color: 'var(--primary-color)', fontWeight: 'bold' }}
              labelStyle={{ color: 'var(--accent-color)', fontSize: '0.9rem' }}
            />


            <Bar
              dataKey="Turnaround"
              fill="url(#gradExec)"
              background={null}           // quita completamente el rectángulo de fondo
              activeShape={null}          // desactiva cualquier forma “activa” al pasar el ratón
              radius={[6, 6, 0, 0]}
              stroke="var(--text-color)"
              strokeWidth={1}
            >
              <LabelList
                dataKey="Turnaround"
                position="top"
                style={{
                  fill: 'var(--text-color)',
                  fontWeight: 'bold',
                  fontSize: 12
                }}
              />
            </Bar>
          </BarChart>
        </div>
      )}


      <footer className="app-footer">
        <div className="footer-content">
          <span>© 2025 Simulador Round Robin</span>
          <span>Universidad de Córdoba – Facultad de Ingenierías</span>
        </div>
      </footer>
    </div>
  );
}
