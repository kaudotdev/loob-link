import { useCallback } from 'react';

const SOUNDS = {
  keypress: 'https://assets.mixkit.co/active_storage/sfx/2358/2358-preview.mp3',
  system_startup: 'https://assets.mixkit.co/active_storage/sfx/2575/2575-preview.mp3',
  access_denied: 'https://assets.mixkit.co/active_storage/sfx/2955/2955-preview.mp3',
  message_notification: 'https://assets.mixkit.co/active_storage/sfx/2354/2354-preview.mp3',
  alarm_proximity: 'https://assets.mixkit.co/active_storage/sfx/2867/2867-preview.mp3',
  scanner_read: 'https://assets.mixkit.co/active_storage/sfx/2574/2574-preview.mp3',
  access_granted: 'https://assets.mixkit.co/active_storage/sfx/2018/2018-preview.mp3',
  glitch_static: 'https://assets.mixkit.co/active_storage/sfx/2955/2955-preview.mp3',
  emp_blast: 'https://assets.mixkit.co/active_storage/sfx/2572/2572-preview.mp3'
};

export const useSound = () => {
  const playSound = useCallback((soundId: keyof typeof SOUNDS) => {
    try {
      const audio = new Audio(SOUNDS[soundId]);
      
            const highVolumeSounds = ['alarm_proximity', 'access_denied', 'glitch_static', 'emp_blast'];
      
      if (soundId === 'keypress') {
        audio.volume = 0.2; 
      } else if (highVolumeSounds.includes(soundId)) {
        audio.volume = 0.8; 
      } else {
        audio.volume = 0.5; 
      }

      audio.play().catch(e => {
               });
    } catch (e) {
           }
  }, []);

  return { playSound };
};
