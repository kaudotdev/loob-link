import React, { memo } from 'react';
import { Timestamp } from 'firebase/firestore';
import { PollMessage } from './PollMessage';
import { ImageMessage } from './ImageMessage';
import { Image3DMessage } from './Image3DMessage';

interface Message {
  id: string;
  content: string;
  type?: 'text' | 'image' | 'image3d' | 'poll' | 'glitch' | 'vibrate' | 'theme';
  payload?: any;
  timestamp: Timestamp;
}

interface TerminalMessageItemProps {
  message: Message;
  displayedContent: string;
  formatTime: (ts: Timestamp) => string;
}

export const TerminalMessageItem = memo(function TerminalMessageItem({
  message,
  displayedContent,
  formatTime,
}: TerminalMessageItemProps) {
  
  if (['glitch', 'vibrate', 'theme'].includes(message.type || '')) {
     if (!message.content || message.content.startsWith('[')) return null;
  }

  return (
    <div className="message-line mb-4 block">
      <div className="flex items-start">
          <span className="message-timestamp mr-2 whitespace-nowrap">
            [{formatTime(message.timestamp)}]
          </span>
          
          <div className="flex-1">
              {message.type === 'image3d' ? (
                 <Image3DMessage 
                   frontImage={message.payload?.frontImage}
                   backImage={message.payload?.backImage}
                   caption={message.payload?.caption || message.content}
                   aspectRatio={message.payload?.aspectRatio || 0.75}
                 />
              ) : message.type === 'image' ? (
                 <ImageMessage 
                   url={message.payload?.url} 
                   caption={message.payload?.caption || message.content} 
                 />
              ) : message.type === 'poll' ? (
                 <PollMessage 
                   id={message.id}
                   question={message.payload?.question || message.content}
                   options={message.payload?.options || ['SIM', 'NÃO']}
                 />
              ) : (
                 <div className="inline-block">
                     <span className="message-prompt mr-2">L00B&gt;</span>
                     <span className="text-glow whitespace-pre-wrap">
                       {displayedContent}
                     </span>
                 </div>
              )}
          </div>
      </div>
    </div>
  );
});
