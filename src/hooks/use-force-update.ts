import { useState, useCallback } from 'react';

/**
 * Hook para forçar re-renderização de componentes
 */
export function useForceUpdate() {
  const [, setTick] = useState(0);
  
  const forceUpdate = useCallback(() => {
    setTick(tick => tick + 1);
  }, []);
  
  return forceUpdate;
}
