import React, { useState, useEffect } from 'react';
import { db } from '@/lib/firebase';
import { 
  collection, 
  addDoc, 
  deleteDoc, 
  doc, 
  onSnapshot, 
  query, 
  orderBy 
} from 'firebase/firestore';

interface Template {
  id: string;
  label: string;
  content: string | string[]; 
  category: string;
}

interface TemplateManagerProps {
  templates: Template[];
}

export function TemplateManager({ templates }: TemplateManagerProps) {
    const [newLabel, setNewLabel] = useState('');
  const [newContent, setNewContent] = useState('');
  const [newCategory, setNewCategory] = useState('Personalizado');

  
  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLabel || !newContent) return;

        const finalContent = newContent.includes('\n') 
      ? newContent.split('\n').filter(line => line.trim() !== '')
      : newContent;

    try {
      await addDoc(collection(db, 'templates'), {
        label: newLabel,
        content: finalContent,
        category: newCategory
      });
      setNewLabel('');
      setNewContent('');
    } catch (e) {
      console.error("Error adding template:", e);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('⚠️ Tem certeza que deseja excluir este template permanentemente?')) return;
    try {
      await deleteDoc(doc(db, 'templates', id));
    } catch (e) {
      console.error("Error deleting:", e);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      
      <div className="space-y-2 max-h-40 overflow-y-auto pr-2">
        {templates.map(t => (
          <div key={t.id} className="flex justify-between items-center bg-[var(--admin-bg)] border border-[var(--admin-border)] p-2 rounded hover:border-[var(--admin-border-hover)] group transition-all">
            <div className="text-xs truncate flex-1">
              <span className="text-[var(--admin-text-dim)]">[{t.category}]</span> 
              <span className="text-[var(--admin-text)] ml-2 font-bold">{t.label}</span>
              <p className="text-[var(--admin-text-dim)] opacity-50 truncate">
                {Array.isArray(t.content) ? t.content.join(' / ') : t.content}
              </p>
            </div>
            <button 
              onClick={(e) => {
                e.stopPropagation();
                handleDelete(t.id);
              }}
              className="text-[var(--admin-text-dim)] hover:text-red-500 px-2 py-1 transition-colors"
              title="Excluir Template Permanente"
            >
              🗑️
            </button>
          </div>
        ))}
        {templates.length === 0 && <p className="text-xs text-[var(--admin-text-dim)]">Nenhum template salvo.</p>}
      </div>

      
      <form onSubmit={handleAdd} className="space-y-2 pt-4 border-t border-[var(--admin-border)]">
        <div className="grid grid-cols-2 gap-2">
          <input
            value={newLabel}
            onChange={e => setNewLabel(e.target.value)}
            placeholder="Nome (Ex: Fuga)"
            className="admin-input text-xs py-1"
          />
          <input
            value={newCategory}
            onChange={e => setNewCategory(e.target.value)}
            placeholder="Categoria"
            className="admin-input text-xs py-1"
          />
        </div>
        <div className="flex flex-col gap-2">
            <textarea
              value={newContent}
              onChange={e => setNewContent(e.target.value)}
              placeholder="Conteúdo (Quebra de linha cria msgs sequenciais)..."
              className="admin-input text-xs flex-1 py-1 h-20 resize-none"
            />
            <button type="submit" className="admin-btn text-xs py-1 w-full opacity-80 hover:opacity-100">
              + SALVAR NOVO TEMPLATE
            </button>
        </div>
      </form>
    </div>
  );
}
