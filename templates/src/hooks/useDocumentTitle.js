import { useEffect } from 'react';

function useDocumentTitle(title) {
  useEffect(() => {
    document.title = `${title} - Gestion Cyber`;
  }, [title]);
}

export default useDocumentTitle;
