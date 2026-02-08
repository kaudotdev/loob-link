'use client';

import React, { useState, useEffect } from 'react';
import { Image3DViewer } from './Image3DViewer';
import { db } from '@/lib/firebase';
import { 
  collection, 
  addDoc, 
  getDocs, 
  deleteDoc, 
  doc,
  query,
  orderBy,
  onSnapshot
} from 'firebase/firestore';

interface Image3DPanelProps {
  isLoading?: boolean;
  onSend3DImage?: (frontImage: string, backImage: string, caption: string, aspectRatio: number) => void;
}

interface Image3DTemplate {
  id: string;
  name: string;
  frontImage: string;
  backImage: string;
  caption: string;
  aspectRatio: number;
}

export function Image3DPanel({ isLoading = false, onSend3DImage }: Image3DPanelProps) {
  const [frontImageUrl, setFrontImageUrl] = useState('');
  const [backImageUrl, setBackImageUrl] = useState('');
  const [caption, setCaption] = useState('');
  const [templateName, setTemplateName] = useState('');
  const [aspectRatio, setAspectRatio] = useState(0.75);
  const [showViewer, setShowViewer] = useState(false);
  const [viewerWidth] = useState(600);
  const [viewerHeight] = useState(400);
  const [templates, setTemplates] = useState<Image3DTemplate[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  // Load templates from Firebase
  useEffect(() => {
    const templatesQuery = query(
      collection(db, 'image3d_templates'),
      orderBy('name')
    );

    const unsubscribe = onSnapshot(templatesQuery, (snapshot) => {
      const loadedTemplates: Image3DTemplate[] = [];
      snapshot.forEach((doc) => {
        loadedTemplates.push({
          id: doc.id,
          ...doc.data()
        } as Image3DTemplate);
      });
      setTemplates(loadedTemplates);
    });

    return () => unsubscribe();
  }, []);

  const handleSaveTemplate = async () => {
    if (!templateName || !frontImageUrl || !backImageUrl) {
      alert('Preencha o nome do template e as URLs das imagens');
      return;
    }

    setIsSaving(true);
    try {
      await addDoc(collection(db, 'image3d_templates'), {
        name: templateName,
        frontImage: frontImageUrl,
        backImage: backImageUrl,
        caption: caption || '',
        aspectRatio
      });
      setTemplateName('');
      alert('✓ Template salvo com sucesso!');
    } catch (error) {
      console.error('Erro ao salvar template:', error);
      alert('✗ Erro ao salvar template');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteTemplate = async (id: string) => {
    if (!confirm('Tem certeza que deseja deletar este template?')) {
      return;
    }

    try {
      await deleteDoc(doc(db, 'image3d_templates', id));
    } catch (error) {
      console.error('Erro ao deletar template:', error);
      alert('✗ Erro ao deletar template');
    }
  };

  const handleLoadTemplate = (template: Image3DTemplate) => {
    setFrontImageUrl(template.frontImage);
    setBackImageUrl(template.backImage);
    setCaption(template.caption);
    setAspectRatio(template.aspectRatio);
    setShowViewer(true);
  };

  const handleCustomLoad = () => {
    if (frontImageUrl && backImageUrl) {
      setShowViewer(true);
    }
  };

  const handleReset = () => {
    setShowViewer(false);
    setFrontImageUrl('');
    setBackImageUrl('');
    setCaption('');
    setTemplateName('');
  };

  return (
    <div className="space-y-6">
      {/* Configuration Section */}
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Front Image Input */}
          <div>
            <label className="block text-xs text-gray-400 mb-2 font-mono">
              🖼 URL da Imagem Frontal
            </label>
            <input
              type="text"
              value={frontImageUrl}
              onChange={(e) => setFrontImageUrl(e.target.value)}
              placeholder="https://exemplo.com/frente.jpg"
              className="w-full bg-black border border-[var(--admin-border)] text-[var(--admin-text)] px-3 py-2 rounded text-sm font-mono focus:outline-none focus:border-cyan-500 transition-colors"
              disabled={isLoading}
            />
          </div>

          {/* Back Image Input */}
          <div>
            <label className="block text-xs text-gray-400 mb-2 font-mono">
              🖼 URL da Imagem Traseira
            </label>
            <input
              type="text"
              value={backImageUrl}
              onChange={(e) => setBackImageUrl(e.target.value)}
              placeholder="https://exemplo.com/verso.jpg"
              className="w-full bg-black border border-[var(--admin-border)] text-[var(--admin-text)] px-3 py-2 rounded text-sm font-mono focus:outline-none focus:border-cyan-500 transition-colors"
              disabled={isLoading}
            />
          </div>
        </div>

        {/* Caption Input */}
        <div>
          <label className="block text-xs text-gray-400 mb-2 font-mono">
            💬 Legenda / Descrição
          </label>
          <input
            type="text"
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            placeholder="Ex: > Documentos encontrados no servidor..."
            className="w-full bg-black border border-[var(--admin-border)] text-[var(--admin-text)] px-3 py-2 rounded text-sm font-mono focus:outline-none focus:border-cyan-500 transition-colors"
            disabled={isLoading}
          />
        </div>

        {/* Aspect Ratio Selector */}
        <div>
          <label className="block text-xs text-gray-400 mb-2 font-mono">
            📐 Proporção do Documento
          </label>
          <div className="grid grid-cols-4 gap-2">
            <button
              onClick={() => setAspectRatio(0.75)}
              className={`px-3 py-2 rounded text-xs font-mono transition-all ${
                aspectRatio === 0.75 
                  ? 'bg-cyan-600 text-white border-2 border-cyan-400' 
                  : 'bg-gray-800 text-gray-300 border border-[var(--admin-border)] hover:bg-gray-700'
              }`}
              disabled={isLoading}
            >
              3:4<br/>Retrato
            </button>
            <button
              onClick={() => setAspectRatio(1.33)}
              className={`px-3 py-2 rounded text-xs font-mono transition-all ${
                aspectRatio === 1.33
                  ? 'bg-cyan-600 text-white border-2 border-cyan-400' 
                  : 'bg-gray-800 text-gray-300 border border-[var(--admin-border)] hover:bg-gray-700'
              }`}
              disabled={isLoading}
            >
              4:3<br/>Paisagem
            </button>
            <button
              onClick={() => setAspectRatio(1.0)}
              className={`px-3 py-2 rounded text-xs font-mono transition-all ${
                aspectRatio === 1.0
                  ? 'bg-cyan-600 text-white border-2 border-cyan-400' 
                  : 'bg-gray-800 text-gray-300 border border-[var(--admin-border)] hover:bg-gray-700'
              }`}
              disabled={isLoading}
            >
              1:1<br/>Quadrado
            </button>
            <button
              onClick={() => setAspectRatio(1.77)}
              className={`px-3 py-2 rounded text-xs font-mono transition-all ${
                aspectRatio === 1.77
                  ? 'bg-cyan-600 text-white border-2 border-cyan-400' 
                  : 'bg-gray-800 text-gray-300 border border-[var(--admin-border)] hover:bg-gray-700'
              }`}
              disabled={isLoading}
            >
              16:9<br/>Wide
            </button>
          </div>
        </div>

        {/* Template Name for Saving */}
        <div className="border-t border-[var(--admin-border)] pt-4">
          <label className="block text-xs text-gray-400 mb-2 font-mono">
            💾 Nome do Template (para salvar)
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={templateName}
              onChange={(e) => setTemplateName(e.target.value)}
              placeholder="Ex: Cartão de Identificação Médica"
              className="flex-1 bg-black border border-[var(--admin-border)] text-[var(--admin-text)] px-3 py-2 rounded text-sm font-mono focus:outline-none focus:border-cyan-500 transition-colors"
              disabled={isLoading || isSaving}
            />
            <button
              onClick={handleSaveTemplate}
              disabled={!templateName || !frontImageUrl || !backImageUrl || isLoading || isSaving}
              className="bg-purple-600 hover:bg-purple-500 disabled:bg-gray-600 disabled:cursor-not-allowed text-white px-4 py-2 rounded font-mono text-sm transition-all"
            >
              {isSaving ? '⏳ Salvando...' : '💾 Salvar Template'}
            </button>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3">
          <button
            onClick={handleCustomLoad}
            disabled={!frontImageUrl || !backImageUrl || isLoading}
            className="flex-1 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 disabled:from-gray-600 disabled:to-gray-700 disabled:cursor-not-allowed text-white px-4 py-2 rounded font-mono text-sm transition-all transform hover:scale-[1.02] active:scale-[0.98]"
          >
            {showViewer ? '🔄 Atualizar Visualizador' : '▶ Carregar Visualizador 3D'}
          </button>
          
          {showViewer && onSend3DImage && (
            <button
              onClick={() => onSend3DImage(frontImageUrl, backImageUrl, caption, aspectRatio)}
              disabled={!frontImageUrl || !backImageUrl || isLoading}
              className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 disabled:from-gray-600 disabled:to-gray-700 disabled:cursor-not-allowed text-white px-4 py-2 rounded font-mono text-sm transition-all transform hover:scale-[1.02] active:scale-[0.98]"
            >
              📤 Enviar ao Chat
            </button>
          )}
          
          {showViewer && (
            <button
              onClick={handleReset}
              disabled={isLoading}
              className="bg-red-600 hover:bg-red-500 disabled:bg-gray-600 disabled:cursor-not-allowed text-white px-4 py-2 rounded font-mono text-sm transition-all"
            >
              ✕ Limpar
            </button>
          )}
        </div>

        {/* Saved Templates */}
        {templates.length > 0 && (
          <div className="border-t border-[var(--admin-border)] pt-4">
            <label className="block text-xs text-gray-400 mb-3 font-mono">
              📚 Templates Salvos ({templates.length})
            </label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {templates.map((template) => (
                <div
                  key={template.id}
                  className="bg-gray-800 border border-[var(--admin-border)] rounded p-3 hover:border-cyan-600 transition-colors"
                >
                  {/* Template Preview */}
                  <div className="flex gap-3 mb-2">
                    <img
                      src={template.frontImage}
                      alt={`${template.name} - Frente`}
                      className="w-16 h-16 object-cover rounded border border-gray-600"
                      onError={(e) => {
                        e.currentTarget.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="64" height="64"%3E%3Crect fill="%23333" width="64" height="64"/%3E%3Ctext x="50%25" y="50%25" fill="%23666" text-anchor="middle" dominant-baseline="middle" font-size="10"%3E?%3C/text%3E%3C/svg%3E';
                      }}
                    />
                    <img
                      src={template.backImage}
                      alt={`${template.name} - Verso`}
                      className="w-16 h-16 object-cover rounded border border-gray-600"
                      onError={(e) => {
                        e.currentTarget.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="64" height="64"%3E%3Crect fill="%23333" width="64" height="64"/%3E%3Ctext x="50%25" y="50%25" fill="%23666" text-anchor="middle" dominant-baseline="middle" font-size="10"%3E?%3C/text%3E%3C/svg%3E';
                      }}
                    />
                    <div className="flex-1">
                      <h4 className="text-sm font-mono text-white mb-1">{template.name}</h4>
                      <p className="text-xs text-gray-400 font-mono mb-1">
                        Proporção: {template.aspectRatio === 0.75 ? '3:4' : template.aspectRatio === 1.33 ? '4:3' : template.aspectRatio === 1.0 ? '1:1' : '16:9'}
                      </p>
                      {template.caption && (
                        <p className="text-xs text-gray-500 font-mono truncate">
                          {template.caption}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Template Actions */}
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleLoadTemplate(template)}
                      disabled={isLoading}
                      className="flex-1 bg-cyan-700 hover:bg-cyan-600 disabled:bg-gray-700 text-white px-3 py-1 rounded text-xs font-mono transition-colors"
                    >
                      📂 Carregar
                    </button>
                    <button
                      onClick={() => handleDeleteTemplate(template.id)}
                      disabled={isLoading}
                      className="bg-red-700 hover:bg-red-600 disabled:bg-gray-700 text-white px-3 py-1 rounded text-xs font-mono transition-colors"
                    >
                      🗑 Deletar
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* 3D Viewer */}
      {showViewer && frontImageUrl && backImageUrl && (
        <div className="border-t border-[var(--admin-border)] pt-6">
          <div className="flex justify-center">
            <div className="space-y-4">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-mono text-gray-300">
                  🎯 Visualizador 3D Interativo
                </h3>
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 bg-green-500 rounded-full animate-pulse"></div>
                  <span className="text-xs text-green-400 font-mono">ATIVO</span>
                </div>
              </div>
              
              <Image3DViewer
                frontImage={frontImageUrl}
                backImage={backImageUrl}
                width={viewerWidth}
                height={viewerHeight}
                aspectRatio={aspectRatio}
              />

              <div className="bg-gray-900 border border-[var(--admin-border)] rounded p-4 space-y-2">
                <h4 className="text-xs font-mono text-cyan-400 mb-2">ℹ Instruções de Uso</h4>
                <ul className="text-xs text-gray-400 font-mono space-y-1">
                  <li>• <span className="text-white">Arraste</span> com o mouse para rotacionar o objeto</li>
                  <li>• <span className="text-white">Scroll</span> do mouse para zoom in/out</li>
                  <li>• <span className="text-white">1 dedo</span> em dispositivos móveis para girar</li>
                  <li>• <span className="text-white">2 dedos</span> para mover ou zoom (pinch/pan)</li>
                  <li>• <span className="text-white">Auto-rotação</span> ativa quando não estiver arrastando</li>
                  <li>• <span className="text-white">Iluminação dinâmica</span> para melhor visualização</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Info Box */}
      <div className="bg-blue-950 bg-opacity-30 border border-blue-800 rounded p-4">
        <h4 className="text-xs font-mono text-blue-300 mb-2 flex items-center gap-2">
          <span>💡</span> Dicas para Melhores Resultados
        </h4>
        <ul className="text-xs text-blue-200 font-mono space-y-1 opacity-80">
          <li>• Use imagens com proporções similares (ex: 800x1000px)</li>
          <li>• Formatos suportados: JPG, PNG, WebP</li>
          <li>• Para melhor performance, use imagens otimizadas (&lt;2MB)</li>
          <li>• URLs devem ser acessíveis publicamente (HTTPS recomendado)</li>
          <li>• Salve templates para reutilizar configurações frequentemente usadas</li>
        </ul>
      </div>
    </div>
  );
}
