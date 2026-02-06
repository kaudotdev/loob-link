'use client';

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

// Tipos de ação disponíveis em uma macro
export type MacroActionType = 'message' | 'glitch' | 'vibrate' | 'theme' | 'delay';

export interface MacroAction {
  type: MacroActionType;
  value: string;
  delay?: number; // delay em ms após esta ação
}

export interface SceneMacro {
  id: string;
  name: string;
  description?: string;
  actions: MacroAction[];
}

interface SceneMacrosPanelProps {
  onExecuteMacro: (actions: MacroAction[]) => Promise<void>;
  isLoading: boolean;
}

// Macros pré-definidas para começar
const DEFAULT_MACROS: Omit<SceneMacro, 'id'>[] = [
  {
    name: '🚨 Alerta de Invasão',
    description: 'Sequência de alerta quando inimigos são detectados',
    actions: [
      { type: 'vibrate', value: '', delay: 500 },
      { type: 'message', value: '⚠ ALERTA: MOVIMENTO DETECTADO', delay: 1500 },
      { type: 'message', value: '> Escaneando assinaturas térmicas...', delay: 2000 },
      { type: 'glitch', value: '', delay: 500 },
      { type: 'message', value: '☠ MÚLTIPLOS HOSTIS CONFIRMADOS', delay: 0 },
    ]
  },
  {
    name: '🔓 Hack Bem-Sucedido',
    description: 'Sequência de sucesso ao hackear algo',
    actions: [
      { type: 'message', value: '> INICIANDO QUEBRA DE CRIPTOGRAFIA...', delay: 1500 },
      { type: 'message', value: '> INJETANDO PAYLOAD...', delay: 1500 },
      { type: 'message', value: '> BYPASS DE FIREWALL...', delay: 1000 },
      { type: 'glitch', value: '', delay: 800 },
      { type: 'theme', value: 'green', delay: 500 },
      { type: 'message', value: '✓ ACESSO CONCEDIDO', delay: 0 },
    ]
  },
  {
    name: '🚫 Acesso Negado',
    description: 'Sequência de falha ao tentar acessar algo',
    actions: [
      { type: 'message', value: '> TENTANDO ACESSO...', delay: 1500 },
      { type: 'vibrate', value: '', delay: 300 },
      { type: 'glitch', value: '', delay: 500 },
      { type: 'theme', value: 'red', delay: 500 },
      { type: 'message', value: '✗ ACESSO NEGADO', delay: 1000 },
      { type: 'message', value: '⚠ TENTATIVA REGISTRADA', delay: 0 },
    ]
  },
  {
    name: '👁 Presença Detectada',
    description: 'Algo sobrenatural foi detectado',
    actions: [
      { type: 'glitch', value: '', delay: 1000 },
      { type: 'vibrate', value: '', delay: 500 },
      { type: 'message', value: '> ANOMALIA DETECTADA...', delay: 2000 },
      { type: 'glitch', value: '', delay: 500 },
      { type: 'message', value: 'Ψ LEITURA DE MEMBRANA: INSTÁVEL', delay: 1500 },
      { type: 'theme', value: 'red', delay: 500 },
      { type: 'message', value: '◉◉ ALGO ESTÁ OBSERVANDO ◉◉', delay: 0 },
    ]
  },
  {
    name: '📡 Interceptação',
    description: 'L00B interceptou uma comunicação',
    actions: [
      { type: 'message', value: '> ESCANEANDO FREQUÊNCIAS...', delay: 1500 },
      { type: 'message', value: '> SINAL DETECTADO...', delay: 1000 },
      { type: 'message', value: '> DECODIFICANDO...', delay: 2000 },
      { type: 'glitch', value: '', delay: 300 },
      { type: 'message', value: '✓ TRANSMISSÃO INTERCEPTADA:', delay: 0 },
    ]
  },
  {
    name: '💀 Perigo Iminente',
    description: 'Situação crítica, precisam fugir',
    actions: [
      { type: 'vibrate', value: '', delay: 300 },
      { type: 'glitch', value: '', delay: 500 },
      { type: 'theme', value: 'red', delay: 300 },
      { type: 'message', value: '☠☠☠ ALERTA CRÍTICO ☠☠☠', delay: 1000 },
      { type: 'vibrate', value: '', delay: 500 },
      { type: 'message', value: '> PROBABILIDADE DE SOBREVIVÊNCIA: < 5%', delay: 1500 },
      { type: 'message', value: '☠ CORRAM. AGORA.', delay: 0 },
    ]
  },
];

export function SceneMacrosPanel({ onExecuteMacro, isLoading }: SceneMacrosPanelProps) {
  const [macros, setMacros] = useState<SceneMacro[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const [executingMacroId, setExecutingMacroId] = useState<string | null>(null);
  
  // Form state para nova macro
  const [newMacroName, setNewMacroName] = useState('');
  const [newMacroDesc, setNewMacroDesc] = useState('');
  const [newMacroActions, setNewMacroActions] = useState<MacroAction[]>([
    { type: 'message', value: '', delay: 1000 }
  ]);

  // Carregar macros do Firebase
  useEffect(() => {
    const macrosQuery = query(collection(db, 'macros'), orderBy('name'));
    const unsub = onSnapshot(macrosQuery, (snapshot) => {
      const loadedMacros: SceneMacro[] = [];
      snapshot.forEach(doc => {
        loadedMacros.push({ id: doc.id, ...doc.data() } as SceneMacro);
      });
      setMacros(loadedMacros);
    });
    return () => unsub();
  }, []);

  const handleExecute = async (macro: SceneMacro | Omit<SceneMacro, 'id'>) => {
    const macroId = 'id' in macro ? macro.id : macro.name;
    setExecutingMacroId(macroId);
    try {
      await onExecuteMacro(macro.actions);
    } finally {
      setExecutingMacroId(null);
    }
  };

  const handleSaveMacro = async () => {
    if (!newMacroName.trim()) return;
    
    try {
      await addDoc(collection(db, 'macros'), {
        name: newMacroName.trim(),
        description: newMacroDesc.trim(),
        actions: newMacroActions.filter(a => a.type !== 'message' || a.value.trim()),
      });
      
      // Reset form
      setNewMacroName('');
      setNewMacroDesc('');
      setNewMacroActions([{ type: 'message', value: '', delay: 1000 }]);
      setIsCreating(false);
    } catch (error) {
      console.error('Erro ao salvar macro:', error);
    }
  };

  const handleDeleteMacro = async (macroId: string) => {
    if (!confirm('Deletar esta macro?')) return;
    try {
      await deleteDoc(doc(db, 'macros', macroId));
    } catch (error) {
      console.error('Erro ao deletar macro:', error);
    }
  };

  const addAction = () => {
    setNewMacroActions([...newMacroActions, { type: 'message', value: '', delay: 1000 }]);
  };

  const updateAction = (index: number, field: keyof MacroAction, value: any) => {
    const updated = [...newMacroActions];
    updated[index] = { ...updated[index], [field]: value };
    setNewMacroActions(updated);
  };

  const removeAction = (index: number) => {
    setNewMacroActions(newMacroActions.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-4">
      {/* Macros Pré-definidas */}
      <div>
        <h4 className="text-[var(--admin-text-dim)] text-xs font-bold mb-2 uppercase tracking-wide">
          ► Macros Rápidas
        </h4>
        <div className="grid grid-cols-2 gap-2">
          {DEFAULT_MACROS.map((macro, index) => (
            <button
              key={index}
              onClick={() => handleExecute(macro)}
              disabled={isLoading || executingMacroId !== null}
              className="admin-btn text-left text-xs p-2 hover:bg-[var(--admin-text)] hover:text-black disabled:opacity-50"
              title={macro.description}
            >
              <div className="font-bold">{macro.name}</div>
              <div className="text-[var(--admin-text-dim)] text-[10px] truncate">
                {macro.actions.length} ações
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Macros Personalizadas */}
      {macros.length > 0 && (
        <div>
          <h4 className="text-[var(--admin-text-dim)] text-xs font-bold mb-2 uppercase tracking-wide">
            ► Suas Macros
          </h4>
          <div className="grid grid-cols-2 gap-2">
            {macros.map((macro) => (
              <div key={macro.id} className="relative group">
                <button
                  onClick={() => handleExecute(macro)}
                  disabled={isLoading || executingMacroId !== null}
                  className="admin-btn text-left text-xs p-2 w-full hover:bg-[var(--admin-text)] hover:text-black disabled:opacity-50"
                  title={macro.description}
                >
                  <div className="font-bold">{macro.name}</div>
                  <div className="text-[var(--admin-text-dim)] text-[10px] truncate">
                    {macro.actions.length} ações
                  </div>
                </button>
                <button
                  onClick={() => handleDeleteMacro(macro.id)}
                  className="absolute top-1 right-1 text-red-500 opacity-0 group-hover:opacity-100 text-xs p-1"
                  title="Deletar"
                >
                  ✗
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Botão para criar nova macro */}
      {!isCreating ? (
        <button
          onClick={() => setIsCreating(true)}
          className="admin-btn w-full text-xs py-2"
        >
          + Criar Nova Macro
        </button>
      ) : (
        <div className="border border-[var(--admin-border)] rounded p-3 space-y-3">
          <h4 className="text-[var(--admin-text)] text-xs font-bold uppercase">Nova Macro</h4>
          
          <input
            type="text"
            placeholder="Nome da macro..."
            value={newMacroName}
            onChange={(e) => setNewMacroName(e.target.value)}
            className="w-full bg-black border border-[var(--admin-border)] rounded px-2 py-1 text-xs text-[var(--admin-text)]"
          />
          
          <input
            type="text"
            placeholder="Descrição (opcional)..."
            value={newMacroDesc}
            onChange={(e) => setNewMacroDesc(e.target.value)}
            className="w-full bg-black border border-[var(--admin-border)] rounded px-2 py-1 text-xs text-[var(--admin-text)]"
          />

          <div className="space-y-2">
            <label className="text-[var(--admin-text-dim)] text-[10px] uppercase">Ações:</label>
            {newMacroActions.map((action, index) => (
              <div key={index} className="flex gap-2 items-center">
                <select
                  value={action.type}
                  onChange={(e) => updateAction(index, 'type', e.target.value)}
                  className="bg-black border border-[var(--admin-border)] rounded px-1 py-1 text-xs text-[var(--admin-text)]"
                >
                  <option value="message">Mensagem</option>
                  <option value="glitch">Glitch</option>
                  <option value="vibrate">Vibrar</option>
                  <option value="theme">Tema</option>
                  <option value="delay">Delay</option>
                </select>
                
                {action.type === 'message' && (
                  <input
                    type="text"
                    placeholder="Texto..."
                    value={action.value}
                    onChange={(e) => updateAction(index, 'value', e.target.value)}
                    className="flex-1 bg-black border border-[var(--admin-border)] rounded px-2 py-1 text-xs text-[var(--admin-text)]"
                  />
                )}
                
                {action.type === 'theme' && (
                  <select
                    value={action.value}
                    onChange={(e) => updateAction(index, 'value', e.target.value)}
                    className="flex-1 bg-black border border-[var(--admin-border)] rounded px-1 py-1 text-xs text-[var(--admin-text)]"
                  >
                    <option value="cyan">Cyan</option>
                    <option value="green">Green</option>
                    <option value="red">Red</option>
                    <option value="amber">Amber</option>
                  </select>
                )}
                
                <input
                  type="number"
                  placeholder="Delay"
                  value={action.delay || 0}
                  onChange={(e) => updateAction(index, 'delay', parseInt(e.target.value) || 0)}
                  className="w-16 bg-black border border-[var(--admin-border)] rounded px-1 py-1 text-xs text-[var(--admin-text)]"
                  title="Delay após esta ação (ms)"
                />
                <span className="text-[var(--admin-text-dim)] text-[10px]">ms</span>
                
                <button
                  onClick={() => removeAction(index)}
                  className="text-red-500 text-xs px-1"
                  disabled={newMacroActions.length <= 1}
                >
                  ✗
                </button>
              </div>
            ))}
            
            <button
              onClick={addAction}
              className="text-[var(--admin-text-dim)] text-xs hover:text-[var(--admin-text)]"
            >
              + Adicionar Ação
            </button>
          </div>

          <div className="flex gap-2">
            <button
              onClick={handleSaveMacro}
              disabled={!newMacroName.trim()}
              className="admin-btn flex-1 text-xs py-1 disabled:opacity-50"
            >
              Salvar
            </button>
            <button
              onClick={() => setIsCreating(false)}
              className="admin-btn text-xs py-1 px-3 text-red-400"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}

      {/* Indicador de execução */}
      {executingMacroId && (
        <div className="text-center text-[var(--admin-text)] text-xs animate-pulse">
          ▶ Executando macro...
        </div>
      )}
    </div>
  );
}

export default SceneMacrosPanel;
