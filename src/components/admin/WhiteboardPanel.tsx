/**
 * Painel Admin - Whiteboard Colaborativo
 * 
 * Funcionalidades:
 * - Cole URL de imagem de fundo (igual Image3D)
 * - Gerenciamento de templates salvos
 * - Envio de mensagem para ativar whiteboard nos terminais
 */

'use client';

import { useState, useEffect } from 'react';
import { db } from '@/lib/firebase';
import {
  collection,
  addDoc,
  deleteDoc,
  updateDoc,
  doc,
  query,
  orderBy,
  onSnapshot
} from 'firebase/firestore';
import { 
  PencilLine, 
  Save, 
  Rocket, 
  BookOpen, 
  Download, 
  Trash2, 
  Loader2,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Lock,
  Unlock
} from 'lucide-react';

interface WhiteboardPanelProps {
  isLoading?: boolean;
  onSendWhiteboard?: (templateId: string) => void;
}

interface WhiteboardTemplate {
  id: string;
  name: string;
  backgroundImage: string;
  locked?: boolean;
}

export function WhiteboardPanel({ isLoading = false, onSendWhiteboard }: WhiteboardPanelProps) {
  const [backgroundUrl, setBackgroundUrl] = useState('');
  const [templateName, setTemplateName] = useState('');
  const [templates, setTemplates] = useState<WhiteboardTemplate[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);

  /**
   * Carrega templates do Firestore
   */
  useEffect(() => {
    const templatesQuery = query(
      collection(db, 'whiteboard_templates'),
      orderBy('name')
    );

    const unsubscribe = onSnapshot(templatesQuery, (snapshot) => {
      const loadedTemplates: WhiteboardTemplate[] = [];
      snapshot.forEach((docSnap) => {
        loadedTemplates.push({
          id: docSnap.id,
          name: docSnap.data().name,
          backgroundImage: docSnap.data().backgroundImage,
          locked: docSnap.data().locked || false
        });
      });
      setTemplates(loadedTemplates);
    });

    return () => unsubscribe();
  }, []);

  /**
   * Salva template no Firestore
   */
  const handleSaveTemplate = async () => {
    if (!templateName || !backgroundUrl) {
      alert('Preencha o nome do template e a URL da imagem');
      return;
    }

    setIsSaving(true);
    try {
      await addDoc(collection(db, 'whiteboard_templates'), {
        name: templateName,
        backgroundImage: backgroundUrl,
        locked: false
      });
      
      setTemplateName('');
      setBackgroundUrl('');
      alert('Template salvo com sucesso!');
    } catch (error) {
      console.error('Erro ao salvar template:', error);
      alert('Erro ao salvar template');
    } finally {
      setIsSaving(false);
    }
  };

  /**
   * Deleta template
   */
  const handleDeleteTemplate = async (id: string) => {
    if (!confirm('Deletar este template?')) return;

    try {
      await deleteDoc(doc(db, 'whiteboard_templates', id));
    } catch (error) {
      console.error('Erro ao deletar:', error);
      alert('Erro ao deletar template');
    }
  };

  /**
   * Carrega template selecionado
   */
  const handleLoadTemplate = (template: WhiteboardTemplate) => {
    setBackgroundUrl(template.backgroundImage);
    setTemplateName(template.name);
  };

  /**
   * Envia whiteboard para os terminais
   */
  const handleSendWhiteboard = () => {
    if (!selectedTemplate) {
      alert('Selecione um template primeiro');
      return;
    }

    if (onSendWhiteboard) {
      onSendWhiteboard(selectedTemplate);
      alert('Whiteboard ativado nos terminais!');
    }
  };

  /**
   * Toggle lock de um template
   */
  const handleToggleLock = async (templateId: string, currentLocked: boolean) => {
    try {
      const templateRef = doc(db, 'whiteboard_templates', templateId);
      await updateDoc(templateRef, {
        locked: !currentLocked
      });
    } catch (error) {
      console.error('Erro ao alterar lock:', error);
      alert('Erro ao alterar bloqueio');
    }
  };

  return (
    <div className="bg-[#00ff88]/5 border border-[#00ff88] rounded-lg p-5 mb-5">
      <h3 className="text-[#00ff88] text-lg font-bold border-b border-[#00ff88] pb-2.5 mb-5 flex items-center gap-2">
        <PencilLine className="w-5 h-5" />
        Whiteboard Colaborativo
      </h3>

      {/* URL da Imagem */}
      <div className="mb-6">
        <h4 className="text-[#00ff88] text-sm mb-3">1. URL da Imagem de Fundo</h4>
        
        <label className="block text-gray-400 text-xs mb-1.5">
          Cole a URL de uma imagem (Imgur, Firebase, etc):
        </label>
        <input
          type="text"
          value={backgroundUrl}
          onChange={(e) => setBackgroundUrl(e.target.value)}
          placeholder="https://i.imgur.com/exemplo.png"
          className="w-full p-2.5 bg-black/50 border border-[#00ff88] rounded text-white font-mono focus:outline-none focus:border-cyan-500 transition-colors"
          disabled={isLoading}
        />

        {backgroundUrl && (
          <div className="mt-4 text-center">
            <img 
              src={backgroundUrl} 
              alt="Preview" 
              className="max-w-full max-h-[200px] border-2 border-[#00ff88] rounded-md mx-auto object-contain"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = 'none';
                alert('Erro ao carregar imagem. Verifique a URL.');
              }}
            />
            <p className="text-[#00ff88] text-xs mt-2 flex items-center justify-center gap-1">
              <CheckCircle className="w-3 h-3" />
              Preview da imagem
            </p>
          </div>
        )}
      </div>

      {/* Salvar Template */}
      <div className="mb-6">
        <h4 className="text-[#00ff88] text-sm mb-3">2. Salvar como Template (Opcional)</h4>
        <input
          type="text"
          value={templateName}
          onChange={(e) => setTemplateName(e.target.value)}
          placeholder="Nome do template..."
          className="w-full p-2.5 bg-black/50 border border-[#00ff88] rounded text-white font-mono mb-3"
        />
        <button
          onClick={handleSaveTemplate}
          disabled={isSaving || !backgroundUrl}
          className="w-full py-3.5 border-2 border-blue-500 rounded-md font-bold cursor-pointer transition-all text-sm bg-blue-500/20 text-blue-500 hover:bg-blue-500 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {isSaving ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Salvando...
            </>
          ) : (
            <>
              <Save className="w-4 h-4" />
              Salvar Template
            </>
          )}
        </button>
      </div>

      {/* Enviar Whiteboard */}
      <div className="mb-6">
        <h4 className="text-[#00ff88] text-sm mb-3">3. Ativar Whiteboard</h4>
        
        {selectedTemplate && (
          <div className="mb-3 p-2 bg-[#00ff88]/10 border border-[#00ff88] rounded text-[#00ff88] text-xs">
            <CheckCircle className="w-3 h-3 inline mr-1" />
            Template selecionado: <strong>{templates.find(t => t.id === selectedTemplate)?.name}</strong>
          </div>
        )}

        <button
          onClick={handleSendWhiteboard}
          disabled={isLoading || !selectedTemplate}
          className="w-full py-3.5 border-2 border-[#00ff88] rounded-md font-bold cursor-pointer transition-all text-sm bg-[#00ff88]/20 text-[#00ff88] hover:bg-[#00ff88] hover:text-black disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Enviando...
            </>
          ) : (
            <>
              <Rocket className="w-4 h-4" />
              Ativar nos Terminais
            </>
          )}
        </button>
      </div>

      {/* Templates Salvos */}
      {templates.length > 0 && (
        <div className="border-t border-[#00ff88]/30 pt-5 mt-5">
          <h4 className="text-[#00ff88] text-sm mb-3 flex items-center gap-2">
            <BookOpen className="w-4 h-4" />
            Templates Salvos
          </h4>
          {templates.map((template) => (
            <div 
              key={template.id} 
              className={`flex gap-3 p-3 bg-black/30 border rounded-md mb-3 transition-all ${
                selectedTemplate === template.id 
                  ? 'border-[#00ff88] shadow-[0_0_10px_rgba(0,255,136,0.3)]' 
                  : 'border-[#00ff88]/30'
              }`}
            >
              <img
                src={template.backgroundImage}
                alt={template.name}
                className="w-20 h-20 object-cover rounded border border-[#00ff88]"
              />
              <div className="flex-1 flex flex-col justify-between">
                <div className="flex items-center gap-2">
                  <strong className="text-[#00ff88]">{template.name}</strong>
                  {template.locked && (
                    <span className="text-xs text-orange-500 flex items-center gap-1">
                      <Lock className="w-3 h-3" />
                      Bloqueado
                    </span>
                  )}
                </div>
                <div className="flex gap-2 flex-wrap">
                  <button
                    onClick={() => setSelectedTemplate(template.id)}
                    className={`px-3 py-1.5 border rounded cursor-pointer text-xs transition-all flex items-center gap-1 ${
                      selectedTemplate === template.id
                        ? 'border-[#00ff88] bg-[#00ff88] text-black'
                        : 'border-[#00ff88] bg-[#00ff88]/10 text-[#00ff88] hover:bg-[#00ff88] hover:text-black'
                    }`}
                  >
                    <CheckCircle className="w-3 h-3" />
                    {selectedTemplate === template.id ? 'Selecionado' : 'Selecionar'}
                  </button>
                  <button
                    onClick={() => handleToggleLock(template.id, template.locked || false)}
                    className={`px-3 py-1.5 border rounded cursor-pointer text-xs transition-all flex items-center gap-1 ${
                      template.locked
                        ? 'border-orange-500 bg-orange-500/10 text-orange-500 hover:bg-orange-500 hover:text-white'
                        : 'border-gray-500 bg-gray-500/10 text-gray-400 hover:bg-gray-500 hover:text-white'
                    }`}
                  >
                    {template.locked ? (
                      <>
                        <Unlock className="w-3 h-3" />
                        Desbloquear
                      </>
                    ) : (
                      <>
                        <Lock className="w-3 h-3" />
                        Bloquear
                      </>
                    )}
                  </button>
                  <button
                    onClick={() => handleLoadTemplate(template)}
                    className="px-3 py-1.5 border border-blue-500 rounded bg-blue-500/10 text-blue-500 cursor-pointer text-xs transition-all hover:bg-blue-500 hover:text-white flex items-center gap-1"
                  >
                    <Download className="w-3 h-3" />
                    Editar
                  </button>
                  <button
                    onClick={() => handleDeleteTemplate(template.id)}
                    className="px-3 py-1.5 border border-red-500 rounded bg-red-500/10 text-red-500 cursor-pointer text-xs transition-all hover:bg-red-500 hover:text-white flex items-center gap-1"
                  >
                    <Trash2 className="w-3 h-3" />
                    Deletar
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
