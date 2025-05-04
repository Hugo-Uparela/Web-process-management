import { useState, useEffect } from 'react';
import initSqlJs from 'sql.js';

export function useSql(wasmPath = '/sql-wasm.wasm') {
  const [SQL, setSQL] = useState(null);
  useEffect(() => {
    initSqlJs({ locateFile: () => wasmPath })
      .then(setSQL)
      .catch(console.error);
  }, [wasmPath]);
  return SQL;
}