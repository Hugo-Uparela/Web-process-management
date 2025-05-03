import React from 'react';

export default function TooltipPersonalizado({ active, payload, label }) {
  if (active && payload && payload.length) {
    return (
      <div className="custom-tooltip">
        <div className="tooltip-label">{label}</div>
        <div className="tooltip-value">Turnaround: {payload[0].value}</div>
      </div>
    );
  }
  return null;
}
