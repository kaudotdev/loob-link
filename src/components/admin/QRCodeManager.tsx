import React, { useState } from 'react';
import { db } from '@/lib/firebase';
import { addDoc, collection, doc, deleteDoc, updateDoc } from 'firebase/firestore';

interface QRCode {
  id: string;
  code: string;
  response: string[];
}

interface QRCodeManagerProps {
  qrCodes: QRCode[];
  isLoading: boolean;
}

export function QRCodeManager({ qrCodes, isLoading }: QRCodeManagerProps) {
  const [activeTab, setActiveTab] = useState<'list' | 'create'>('list');
  const [newCode, setNewCode] = useState('');
  const [newResponse, setNewResponse] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCode || !newResponse) return;

    const responseArray = newResponse.includes('\n') 
        ? newResponse.split('\n').filter(line => line.trim() !== '')
        : [newResponse];

    try {
      if (editingId) {
                await updateDoc(doc(db, 'qrcodes', editingId), {
           code: newCode,
           response: responseArray
        });
        setEditingId(null);
      } else {
                await addDoc(collection(db, 'qrcodes'), {
          code: newCode,
          response: responseArray
        });
      }
      setNewCode('');
      setNewResponse('');
      setActiveTab('list');
    } catch (error) {
       console.error("Error saving QR Code:", error);
    }
  };

  const handleEdit = (qr: QRCode) => {
    setNewCode(qr.code);
    setNewResponse(Array.isArray(qr.response) ? qr.response.join('\n') : qr.response);
    setEditingId(qr.id);
    setActiveTab('create');
  };

  const handleDelete = async (id: string) => {
    if(!confirm('Deletar este QR Code?')) return;
    try {
        await deleteDoc(doc(db, 'qrcodes', id));
    } catch (e) {
        console.error("Error deleting QR:", e);
    }
  };

  const cancelEdit = () => {
    setEditingId(null);
    setNewCode('');
    setNewResponse('');
    setActiveTab('list');
  };

  const handleSeedDefaults = async () => {
      const DEFAULTS = [
        {
          code: 'LOOB_MALETA',
          response: [
              '> 🔓 BIOMETRIA DETECTADA...',
              '> AUTENTICAÇÃO: TOKEN ORGÂNICO VÁLIDO.',
              '> Conteúdo: Tecido Biológico Humano em Formol.',
              '> Órgão: Fígado.',
              '> Assinatura de DNA: Compatível com Victor Krov (99.9% - Gêmeo ou Clone).',
              '> Função: Token de Acesso. A barreira da Ilha reconhece este DNA como "Autorizado".',
              '> Status da Tranca: Bloqueio Biométrico. Necessário polegar do Krov para abrir sem detonar.'
          ]
        },
        {
          code: 'LOOB_ACESSO',
          response: [
              '> 🔑 CÓDIGO DE ACESSO ESCANEADO.',
              '> Porta desbloqueada. Vocês têm 30 segundos.'
          ]
        },
        {
          code: 'LOOB_SEGREDO',
          response: [
              '> 📜 ARQUIVO CRIPTOGRAFADO DECODIFICADO.',
              '> O Maestro está na Ilha. Coordenadas: -23.5505, -46.6333',
              '> Boa sorte. Vocês vão precisar.'
          ]
        }
      ];

      if (!confirm('Isso irá criar os QR Codes padrão. Continuar?')) return;

      try {
          const existingCodes = new Set(qrCodes.map(q => q.code));
          
          for (const def of DEFAULTS) {
              if (!existingCodes.has(def.code)) {
                  await addDoc(collection(db, 'qrcodes'), def);
              }
          }
      } catch (e) {
          console.error("Error seeding:", e);
      }
  };

  return (
    <div>
        <div className="flex gap-4 mb-4 border-b border-[var(--admin-border)] pb-2 justify-between">
            <div className="flex gap-4">
                <button 
                onClick={() => setActiveTab('list')}
                className={`text-xs uppercase tracking-wider font-bold transition-colors ${activeTab === 'list' ? 'text-[var(--admin-text)]' : 'text-[var(--admin-text-dim)] hover:text-white'}`}
                >
                📋 Lista ({qrCodes.length})
                </button>
                <button 
                onClick={() => setActiveTab('create')}
                className={`text-xs uppercase tracking-wider font-bold transition-colors ${activeTab === 'create' ? 'text-[var(--admin-text)]' : 'text-[var(--admin-text-dim)] hover:text-white'}`}
                >
                {editingId ? '✏️ Editando' : '➕ Novo QR'}
                </button>
            </div>
            {qrCodes.length === 0 && (
                <button onClick={handleSeedDefaults} className="text-xs text-[var(--admin-accent)] hover:text-white transition-colors">
                    ↻ Padrões
                </button>
            )}
        </div>

        {activeTab === 'list' ? (
             <div className="space-y-2 max-h-60 overflow-y-auto pr-2">
                {qrCodes.map(qr => (
                    <div key={qr.id} className="bg-[var(--admin-bg)] border border-[var(--admin-border)] p-3 rounded group relative">
                        <div className="flex justify-between items-start mb-2">
                            <span className="text-xs font-bold text-white bg-[var(--admin-surface)] px-2 py-0.5 rounded">
                                {qr.code}
                            </span>
                            <div className="flex gap-2">
                                <button onClick={() => handleEdit(qr)} className="text-[var(--admin-text-dim)] hover:text-white" title="Editar">✏️</button>
                                <button onClick={() => handleDelete(qr.id)} className="text-[var(--admin-text-dim)] hover:text-red-500" title="Excluir">🗑️</button>
                            </div>
                        </div>
                        <div className="text-xs text-[var(--admin-text-dim)] pl-2 border-l border-[var(--admin-border)]">
                            {Array.isArray(qr.response) ? qr.response.map((line, i) => (
                                <div key={i} className="truncate">&gt; {line}</div>
                            )) : (
                                <div className="truncate">&gt; {qr.response}</div>
                            )}
                        </div>
                    </div>
                ))}
                {qrCodes.length === 0 && <p className="text-xs text-[var(--admin-text-dim)]">Nenhum QR Code configurado.</p>}
             </div>
        ) : (
             <form onSubmit={handleSave} className="space-y-4">
                <div>
                    <label className="block text-xs uppercase text-[var(--admin-text-dim)] mb-1">Gatilho (Texto do QR Code)</label>
                    <input 
                        type="text" 
                        value={newCode}
                        onChange={(e) => setNewCode(e.target.value)}
                        placeholder="Ex: LOOB_MALETA"
                        className="admin-input w-full"
                    />
                    <p className="text-[10px] text-[var(--admin-text-dim)] mt-1">Este é o texto exato que o scanner irá ler.</p>
                </div>

                <div>
                    <label className="block text-xs uppercase text-[var(--admin-text-dim)] mb-1">Resposta do Terminal</label>
                    <textarea 
                        value={newResponse}
                        onChange={(e) => setNewResponse(e.target.value)}
                        placeholder="> Digite a resposta...&#10;> Use múltiplas linhas para sequências."
                        className="admin-input w-full h-24 font-mono text-xs"
                    />
                </div>

                <div className="flex gap-2">
                    {editingId && (
                        <button type="button" onClick={cancelEdit} className="admin-btn w-1/3 opacity-70">
                            CANCELAR
                        </button>
                    )}
                    <button 
                        type="submit" 
                        disabled={isLoading || !newCode || !newResponse}
                        className="admin-btn admin-btn-primary flex-1"
                    >
                        {editingId ? 'SALVAR ALTERAÇÕES' : 'CRIAR GATILHO'}
                    </button>
                </div>
            </form>
        )}
    </div>
  );
}
