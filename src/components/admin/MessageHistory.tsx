import React from 'react';
import { Timestamp } from 'firebase/firestore';

interface Message {
  id: string;
  content: string;
  timestamp: Timestamp;
}

interface MessageHistoryProps {
  messages: Message[];
}

export function MessageHistory({ messages }: MessageHistoryProps) {
  return (
    <section>
      <h2 className="text-gray-400 mb-4 text-sm uppercase tracking-wider border-b border-gray-700 pb-2">
        📜 Histórico do Terminal
      </h2>
      <div className="bg-black/50 rounded-lg p-4 max-h-64 overflow-y-auto border border-gray-800">
        {messages.length === 0 ? (
          <p className="text-gray-600 text-center italic">
            Nenhuma mensagem no terminal
          </p>
        ) : (
          messages.map((msg) => (
            <div key={msg.id} className="mb-2 text-sm">
              <span className="text-green-600">
                [{msg.timestamp?.toDate?.()?.toLocaleTimeString('pt-BR') || '...'}]
              </span>
              <span className="text-green-400 ml-2">{msg.content}</span>
            </div>
          ))
        )}
      </div>
    </section>
  );
}
