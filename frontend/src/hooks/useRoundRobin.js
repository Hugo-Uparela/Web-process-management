import { useState, useRef, useEffect } from 'react';
import { delay } from '../utils/delay';

export function useRoundRobin(quantum) {
  const [readyQueue, setReadyQueue] = useState([]);
  const [execProcess, setExecProcess] = useState(null);
  const [doneList, setDoneList] = useState([]);
  const [isSimulating, setIsSimulating] = useState(false);
  const [isPaused, setIsPaused] = useState(false);

  const queueRef = useRef([]);
  const pausedRef = useRef(false);
  const timeRef = useRef(0);

  // Iniciar o pausar
  const toggle = () => {
    if (!isSimulating) start();
    else {
      pausedRef.current = !pausedRef.current;
      setIsPaused(pausedRef.current);
    }
  };

  async function start() {
    setIsSimulating(true);
    pausedRef.current = false;
    setIsPaused(false);
    timeRef.current = 0;

    let queue = [...queueRef.current];
    setDoneList([]);
    while (queue.length) {
      while (pausedRef.current) await delay(50);

      const proc = queue.shift();
      setExecProcess(proc);
      setReadyQueue(queue);

      const runTime = proc.prioridad === 1
        ? proc.remaining
        : Math.min(proc.remaining, quantum);

      let elapsed = 0;
      while (elapsed < runTime) {
        if (pausedRef.current) { await delay(50); continue; }
        const step = Math.min(20, runTime - elapsed);
        await delay(step);
        elapsed += step;
      }

      timeRef.current += runTime;
      proc.executions++;
      proc.remaining -= runTime;

      if (proc.prioridad === 0 && proc.remaining > 0) queue.push(proc);
      else {
        proc.finish = timeRef.current;
        setDoneList(dl => [...dl, proc]);
      }

      setExecProcess(null);
    }
    setIsSimulating(false);
  }

  // Cargar nuevos procesos
  const load = procs => {
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
