import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

const Portal = ({ children }) => {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // Crée un div pour le portail s'il n'existe pas
    let portalRoot = document.getElementById('portal-root');
    if (!portalRoot) {
      portalRoot = document.createElement('div');
      portalRoot.setAttribute('id', 'portal-root');
      document.body.appendChild(portalRoot);
    }
    setMounted(true);
    return () => setMounted(false);
  }, []);

  // Ne rend le portail que côté client
  return mounted
    ? createPortal(children, document.getElementById('portal-root'))
    : null;
};

export default Portal;
