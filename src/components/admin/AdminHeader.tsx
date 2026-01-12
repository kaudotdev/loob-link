import React from 'react';

interface AdminHeaderProps {
  messageCount: number;
}

export function AdminHeader({ messageCount }: AdminHeaderProps) {
  return (
    <header className="admin-header">
      <h1 className="admin-title">L00B CONTROL</h1>
      <p className="text-gray-400 mt-2 text-sm tracking-wider">
        Painel do Mestre • {messageCount} mensagens no terminal
      </p>
    </header>
  );
}
