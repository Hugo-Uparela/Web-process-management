import { useState, useRef } from "react";
import { delay } from "../utils/delay";

/**
 * Hook para simular planificación Round-Robin.
 * - Estados: Listo, Ejecución, Terminado
 * - Liberación CPU: si el proceso culmina o si es expulsivo (quantum)
 */
export function useRoundRobin(quantum) {
  
  const [readyQueue, setReadyQueue] = useState([]);          // Cola de procesos en estado Listo (estructura dinámica por estado)
  const [execProcess, setExecProcess] = useState(null);     // Proceso actualmente en Ejecución 
  const [doneList, setDoneList] = useState([]);             // Lista de procesos en estado Terminado
  const [isSimulating, setIsSimulating] = useState(false); // Indicador de simulación en curso (booleano)
  const [isPaused, setIsPaused] = useState(false);         // Indicador de pausa en la simulación
  const queueRef = useRef([]);                             // Referencia interna para la cola Listo (evita cierres stale) 
  const pausedRef = useRef(false);                         // Referencia interna para el estado de pausa 
  const timeRef = useRef(0);                               // Reloj de simulación en milisegundos (TH en ms) 

  /**
   * Alterna entre arrancar y pausar la simulación
   */
  const toggle = () => {
    if (!isSimulating) {
      start(); // Iniciar simulación 
    } else {
      // Pausar/reanudar simulación según política de liberación CPU 
      pausedRef.current = !pausedRef.current;
      setIsPaused(pausedRef.current);
    }
  };

  /**
   * Bucle principal de simulación Round-Robin
   * - Ejecuta cada proceso respetando quantum y prioridades (expulsivo vs. no expulsivo)
   * - Actualiza tiempos de llegada, ejecuciones y finalización 
   */
  async function start() {
    setIsSimulating(true);
    pausedRef.current = false;
    setIsPaused(false);
    timeRef.current = 0; // Reiniciar reloj

    let queue = [...queueRef.current];
    setDoneList([]);

    // Mientras haya procesos en Listo
    while (queue.length) {
      // Esperar si está pausado (chequeo cada 50 ms) 
      while (pausedRef.current) {
        await delay(50);
      }

      const proc = queue.shift();
      setExecProcess(proc); // Pasar a Ejecución 
      setReadyQueue(queue);

      // Determinar tiempo de ejecución:
      // - Prioridad 1 (no expulsivo): corre hasta terminar
      // - Prioridad 0 (expulsivo): corre máximo 'quantum' 
      const runTime =
        proc.prioridad === 1
          ? proc.remaining
          : Math.min(proc.remaining, quantum);

      let elapsed = 0;
      // Avance en pasos de hasta 20 ms para permitir pausa ágil
      while (elapsed < runTime) {
        if (pausedRef.current) {
          await delay(50);
          continue;
        }
        const step = Math.min(20, runTime - elapsed);
        await delay(step);
        elapsed += step;
      }

      // Avanzar reloj global de simulación 
      timeRef.current += runTime;
      proc.executions += 1; // Contar cuántas veces usó CPU 
      proc.remaining -= runTime;

      // Liberación CPU:
      // - Si expulsivo (prioridad 0) y queda ráfaga → vuelve a cola Listo
      // - Si terminó (no expulsivo o ráfaga = 0) → va a Terminado
      if (proc.prioridad === 0 && proc.remaining > 0) {
        queue.push(proc);
      } else {
        proc.finish = timeRef.current; // Registrar tiempo de finalización 
        setDoneList((dl) => [...dl, proc]);
      }

      setExecProcess(null);
    }

    setIsSimulating(false);
  }

  /**
   * Carga un nuevo conjunto de procesos para simular:
   * - Reinicia colas, listas y reloj 
   */
  const load = (procs) => {
    queueRef.current = procs;
    setReadyQueue(procs);
    setDoneList([]);
    setExecProcess(null);
    setIsSimulating(false);
    setIsPaused(false);
    timeRef.current = 0;
  };

  return {
    readyQueue,
    execProcess,
    doneList,
    isSimulating,
    isPaused,
    toggleSimulation: toggle,
    loadProcesses: load,
  };
}
