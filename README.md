# Web-process-management
# Simulador Round Robin

Este proyecto es una aplicación web desarrollada con **React** que simula la planificación de procesos mediante el algoritmo **Round Robin**, siguiendo la guía de laboratorio de Gestión de Procesos.

## 🔍 Descripción

Según la guía de laboratorio, el modelo de estados se implementa con los tres estados clásicos:

* **Listo**: cola dinámica de procesos preparados para ejecutarse.
* **Ejecución**: un único proceso hace uso de la CPU.
* **Terminado**: procesos que han completado su ráfaga.

La política de planificación es **ROUND ROBIN**, donde:

* La **unidad de tiempo** (TH) está expresada en milisegundos y es ingresada por el usuario.
* El **tiempo de ráfaga** (TR) de cada proceso se calcula como:

  ````
  TR = TH × (cantidad de caracteres de la descripción)
 
  ````
* La **simulación** puede **interrumpirse** y **reanudar** en cualquier momento.

## 📦 Estructura del Proyecto

```text
src/
├─ components/           # Componentes de UI
│  ├─ CargaArchivo.jsx   # Selector de archivo SQLite
│  ├─ ControlesSimulacion.jsx  # Selección de tipo y quantum
│  ├─ ListaCatalogos.jsx  # Listado de catálogos disponibles
│  ├─ BotonSimulacion.jsx # Botón de iniciar/pausar
│  ├─ PanelListos.jsx     # Muestra la cola Listo
│  ├─ PanelEjecucion.jsx  # Muestra proceso en Ejecución
│  ├─ PanelTerminados.jsx # Muestra lista Terminados
│  ├─ GraficoTurnaround.jsx # Gráfico de Turnaround final
│  └─ Footer.jsx
├─ hooks/
│  ├─ useSql.js           # Hook para inicializar SQL.js y cargar BD
│  └─ useRoundRobin.js    # Lógica de simulación Round Robin
├─ utils/
│  └─ delay.js            # Utilidad para pausas en la simulación
└─ App.jsx                # Componente principal
```

## ⚙️ Instalación y Ejecución

1. Clonar el repositorio:

   ```bash
   git clone https://github.com/Hugo-Uparela/Web-process-management.git
   cd Web-process-management && cd frontend
   ```
2. Instalar dependencias:

   ```bash
   npm install
   ```
3. Ejecutar en modo desarrollo:

   ```bash
   npm start
   ```

## 🚀 Uso

1. **Cargar** un archivo SQLite que contenga las tablas `cpu` o `memoria` con los procesos catalogados con el formato que se genera en la primera parte del laboratorio **(https://github.com/Hugo-Uparela/Desktop-process-management.git)**.
2. **Seleccionar** el tipo de recurso (`cpu` o `memoria`) y el valor de **quantum** (TH).
3. Hacer clic en **Cargar Procesos** para llenar la **cola Listo**.
4. Presionar **Iniciar/pausar** la simulación:

   * Cada proceso avanza en segmentos de hasta 20 ms para poder pausar ágilmente.
   * Procesos con prioridad `1` (no expulsivos) corren hasta finalizar.
   * Procesos con prioridad `0` (expulsivos) corren máximo `quantum` y, si no terminan, regresan a Listo.
5. Al finalizar, se muestra un gráfico de **Turnaround** con el tiempo de respuesta de cada proceso.

## 📐 Detalles de Implementación

* **useSql**: hook que inicializa SQL.js, carga el archivo SQLite y expone el objeto `Database`.
* **useRoundRobin**: hook con la lógica principal:

  * Referencias internas para evitar cierres stale (`readyQueue`, `pausedRef`, `timeRef`).
  * Bucle `start()` que consume la **cola Listo** hasta vaciarla, gestionando pausas, ejecuciones y cambios de estado según la guía. citeturn2file1
  * Funciones `toggleSimulation` y `loadProcesses` para controlar el flujo.

## 📝 Reportes y Métricas

Al terminar la simulación, se generan los siguientes reportes:

| P (Proceso) | T.L (Llegada) | R (Ráfaga) | P.R (Prioridad) | T.R (Turnaround) | T.F (Finalización) |
| ----------- | ------------- | ---------- | --------------- | ---------------- | ------------------ |
| Nombre      | entero        | entero     | 0 ó 1           | entero           | entero             |





