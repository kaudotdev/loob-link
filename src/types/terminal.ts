
export type MessageType = 'text' | 'image' | 'audio' | 'glitch' | 'vibrate' | 'poll' | 'theme' | 'image3d' | 'whiteboard';

export interface MessagePayload {
    text?: string;
    url?: string;
  caption?: string;     question?: string;
  options?: string[];
  pollId?: string;
  allowMultiple?: boolean;
    theme?: 'cyan' | 'green' | 'red' | 'amber';
    autoPlay?: boolean;
    // Image3D
    modelUrl?: string;
    // Whiteboard
    templateId?: string;
}

export interface TerminalMessage {
  id: string;
  type: MessageType;
  content: string;   payload?: MessagePayload;
  timestamp: any; }
