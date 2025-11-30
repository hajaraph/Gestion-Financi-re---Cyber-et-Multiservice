import React from 'react';

const PageWrapper = ({ children }) => {
  return (
    <div className="w-full h-full animate-in fade-in slide-in-from-top-2 duration-300 ease-out">
      {children}
    </div>
  );
};

export default PageWrapper;
