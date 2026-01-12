import React from 'react';

interface StatusMessageProps {
  status: string;
}

export function StatusMessage({ status }: StatusMessageProps) {
  if (!status) return null;
  
  return (
    <div className={`mb-4 p-3 rounded text-center ${
      status.includes('✓') ? 'bg-green-900/30 text-green-400' : 
      status.includes('✗') ? 'bg-red-900/30 text-red-400' : 
      'bg-blue-900/30 text-blue-400'
    }`}>
      {status}
    </div>
  );
}
