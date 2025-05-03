import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, LabelList } from 'recharts';
import TooltipPersonalizado from './TooltipPersonalizado';

export default function GraficoTurnaround({ chartReady, doneList }) {
  if (!chartReady) return null;
  return (
    <div className="chart-container">
      <BarChart
        width={1000}
        height={500}
        data={doneList.map(p => ({ name: p.nombre, Turnaround: p.executions }))}
        margin={{ top: 20, right: 30, left: 20, bottom: 80 }}
        barCategoryGap="25%"
        barSize={40}
      >
        {/* Definición del gradiente SVG */}
        <defs>
          <linearGradient id="gradExec" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--primary-color)" stopOpacity={0.9}/>
            <stop offset="100%" stopColor="var(--accent-color)" stopOpacity={0.9}/>
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
          tickFormatter={str => str.length > 12 ? str.slice(0, 12) + '…' : str}
        />

        <YAxis
          domain={[0, 'dataMax']}
          allowDecimals={false}
          tick={{ fill: 'var(--text-color)', fontSize: 12 }}
        />

        <Tooltip content={<TooltipPersonalizado />} cursor={false} />

        <Bar
          dataKey="Turnaround"
          fill="url(#gradExec)"
          background={null}
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
  );
}
