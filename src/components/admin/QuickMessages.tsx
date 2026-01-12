import React, { useMemo } from 'react';
import { MESSAGE_CATEGORIES } from './constants';

interface QuickMessagesProps {
  onSendQuick: (content: string | string[]) => void;
  isLoading: boolean;
  templates: any[];
}

export function QuickMessages({ onSendQuick, isLoading, templates }: QuickMessagesProps) {
  
  const customCategories = useMemo(() => {
     const grouped: Record<string, any[]> = {};
      
     templates.forEach(t => {
        const cat = t.category || 'Personalizado';
        if (!grouped[cat]) grouped[cat] = [];
        
        grouped[cat].push({
          label: t.label,
          content: t.content
        });
      });

      return Object.entries(grouped).map(([name, messages]) => ({
        name: `⭐ ${name}`,
        icon: '📝',
        messages
      }));
  }, [templates]);

  const allCategories = [...customCategories, ...MESSAGE_CATEGORIES];

  return (
    <div className="space-y-6">
        {allCategories.map((category, catIndex) => (
          <div key={catIndex} className="category-section">
            <h3 className="text-[var(--admin-text-dim)] text-xs font-bold mb-3 flex items-center gap-2 uppercase tracking-wide">
              <span>{category.icon}</span>
              <span>{category.name}</span>
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {category.messages.map((quick, msgIndex) => (
                <button
                  key={msgIndex}
                  onClick={() => onSendQuick(quick.content)}
                  disabled={isLoading}
                  className="admin-btn text-left truncate text-xs hover:bg-[var(--admin-text)] hover:text-black"
                  title={Array.isArray(quick.content) ? quick.content.join('\n') : quick.content}
                >
                  {quick.label}
                </button>
              ))}
            </div>
          </div>
        ))}
    </div>
  );
}
