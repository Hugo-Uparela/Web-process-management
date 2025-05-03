import React from 'react';

export default function ListaCatalogos({ catalogos, isSimulating, loadProcesos }) {
  return (
    catalogos.length > 0 && (
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
    )
  );
}
