
import React, { useState, useEffect } from 'react';
import Layout from './components/Layout';
import Stats from './components/Stats';
import DocumentUploader from './components/DocumentUploader';
import DocumentList from './components/DocumentList';
import Scanner from './components/Scanner';
import SearchOverlay from './components/SearchOverlay';
import { LogisticsDocument } from './types';
import RecentDocuments from './components/RecentDocuments';
import { Cpu, Camera, Sparkles, FileText, Bot } from 'lucide-react';
import { useLanguage } from './i18n/LanguageContext';

const App: React.FC = () => {
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [documents, setDocuments] = useState<LogisticsDocument[]>([]);
  const [showStartupMessage, setShowStartupMessage] = useState(false);

  useEffect(() => {
    // Show startup message once on mount
    setShowStartupMessage(true);
    // Automatically hide after 4 seconds
    const timer = setTimeout(() => {
      setShowStartupMessage(false);
    }, 4000);
    return () => clearTimeout(timer);
  }, []);

  // Load from database on mount
  useEffect(() => {
    const loadDocs = async () => {
      if ((window as any).electronAPI) {
        try {
          // Utilise le handler db-query exposé dans preload.cjs
          const rows = await (window as any).electronAPI.query('SELECT content FROM documents ORDER BY created_at DESC');
          const docs = rows.map((r: any) => JSON.parse(r.content));
          setDocuments(docs);
        } catch (err) {
          console.error('Failed to load from SQLite:', err);
          // Fallback to local storage
          const saved = localStorage.getItem('vaulty_docs');
          if (saved) setDocuments(JSON.parse(saved));
        }
      } else {
        // Mode Web
        const saved = localStorage.getItem('logisarchiv_docs');
        if (saved) setDocuments(JSON.parse(saved));
      }
    };
    loadDocs();
  }, []);

  // Save to database/localstorage on changes
  const saveDocuments = async (newDocs: LogisticsDocument[]) => {
    if ((window as any).electronAPI) {
      try {
        // On vide la table et on réinsère tout pour la simplicité de la synchro
        // (Pour un grand nombre de docs, on ferait des updates individuels)
        await (window as any).electronAPI.run('DELETE FROM documents');
        for (const doc of newDocs) {
          await (window as any).electronAPI.run(
            'INSERT INTO documents (type, content) VALUES (?, ?)',
            [doc.type, JSON.stringify(doc)]
          );
        }
      } catch (err) {
        console.error('Failed to save to SQLite:', err);
      }
    }
    // Backup/Sync LocalStorage (utile pour le mode web ou fallback)
    localStorage.setItem('vaulty_docs', JSON.stringify(newDocs));
  };

  const handleDocumentProcessed = (doc: LogisticsDocument) => {
    const newDocs = [doc, ...documents];
    setDocuments(newDocs);
    saveDocuments(newDocs); // Persist
    setActiveTab('archive');
  };

  const handleDelete = (id: string) => {
    if (confirm(t('common.confirm_delete'))) {
      const newDocs = documents.filter(d => d.id !== id);
      setDocuments(newDocs);
      saveDocuments(newDocs); // Persist
    }
  };

  const handleExport = () => {
    const backup = {
      version: '1.0',
      timestamp: new Date().toISOString(),
      documents: documents
    };
    const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `vaulty_backup_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const content = JSON.parse(e.target?.result as string);
        if (content.documents && Array.isArray(content.documents)) {
          if (confirm(t('common.confirm_import').replace('{count}', content.documents.length.toString()))) {
            const merged = [...content.documents, ...documents];
            // Éviter les doublons par ID
            const uniqueDocs = Array.from(new Map(merged.map(item => [item.id, item])).values());
            setDocuments(uniqueDocs);
            saveDocuments(uniqueDocs);
            alert(t('common.import_success'));
          }
        }
      } catch (err) {
        alert(t('common.import_error'));
      }
    };
    reader.readAsText(file);
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return (
          <div className="space-y-8">
            <div>
              <h2 className="text-3xl font-bold text-slate-800">{t('dashboard.welcome')}</h2>
              <p className="text-slate-500">{t('dashboard.subtitle')}</p>
            </div>
            <Stats documents={documents} />
            <RecentDocuments documents={documents} />
          </div>
        );
      case 'archive':
        return (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold text-slate-800">{t('archive.title')}</h2>
              <div className="flex gap-2">
                <button
                  onClick={() => setActiveTab('scan')}
                  className="bg-indigo-100 text-indigo-700 px-4 py-2 rounded-xl text-sm font-bold shadow-sm hover:bg-indigo-200 transition-all flex items-center gap-2"
                >
                  📷 {t('menu.scanner')}
                </button>
                <button
                  onClick={() => setActiveTab('upload')}
                  className="bg-indigo-600 text-white px-4 py-2 rounded-xl text-sm font-bold shadow-md hover:bg-indigo-700 transition-all"
                >
                  + {t('archive.new_doc')}
                </button>
              </div>
            </div>
            <DocumentList documents={documents} onDelete={handleDelete} />
          </div>
        );
      case 'upload':
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-slate-800">{t('importer.title')}</h2>
            <DocumentUploader onDocumentProcessed={handleDocumentProcessed} existingDocuments={documents} />
          </div>
        );
      case 'scan':
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-slate-800">{t('menu.scanner')}</h2>
            <Scanner
              onScanComplete={handleDocumentProcessed}
              onCancel={() => setActiveTab('dashboard')}
            />
          </div>
        );
      case 'search':
        return <SearchOverlay documents={documents} />;
      default:
        return <div>Contenu non trouvé</div>;
    }
  };

  return (
    <Layout
      activeTab={activeTab}
      setActiveTab={setActiveTab}
      onExport={handleExport}
      onImport={handleImport}
    >
      {renderContent()}

      {/* Startup Message Overlay */}
      {showStartupMessage && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-slate-900/40 backdrop-blur-md animate-in fade-in duration-500">
          <div className="bg-white/90 backdrop-blur-xl border border-white/20 p-8 rounded-[2.5rem] shadow-[0_20px_50px_-12px_rgba(0,0,0,0.3)] max-w-sm w-full text-center transform animate-in zoom-in slide-in-from-bottom-12 duration-700">
            <div className="w-20 h-20 bg-gradient-to-tr from-indigo-500 to-blue-600 rounded-3xl mx-auto mb-6 flex items-center justify-center shadow-lg shadow-indigo-500/30 text-white">
              <Sparkles size={40} />
            </div>
            <h2 className="text-2xl font-black text-slate-800 mb-2 font-['Outfit'] select-none leading-relaxed">
              اللهم صلِّ وسلم على سيدنا محمد
            </h2>
            <div className="h-1 w-12 bg-indigo-500 rounded-full mx-auto mt-4 opacity-50"></div>
          </div>
        </div>
      )}
    </Layout>
  );
};

export default App;
