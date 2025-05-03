import React from 'react';

export default function CargaArchivo({ onFileChange }) {
  return (
    <div className="file-input">
      <label>Carga tu archivo <code>.db</code>:</label>
      <input type="file" accept=".db" onChange={onFileChange} />
    </div>
  );
}
