
export type MessageType = 'text' | 'image' | 'audio' | 'glitch' | 'vibrate' | 'poll' | 'theme';

export interface MessagePayload {
    text?: string;
    url?: string;
  caption?: string;     question?: string;
  options?: string[];
  pollId?: string;
  allowMultiple?: boolean;
    theme?: 'cyan' | 'green' | 'red' | 'amber';
    autoPlay?: boolean;
}

export interface TerminalMessage {
  id: string;
  type: MessageType;
  content: string;   payload?: MessagePayload;
  timestamp: any; }
