import { useState, useEffect } from 'react';
import { ArrowLeft, Bookmark, Check, Search, ExternalLink, AlertTriangle } from 'lucide-react';
import { useApp } from '../../contexts/AppContext';
import { supabase } from '../../lib/supabase';
import { COURSE_DATA, type CourseModule } from '../../lib/contemplative-data';
import { Modal } from '../ui/Modal';

interface Props { onBack: () => void; }

type ModuleStatus = 'not_started' | 'in_progress' | 'completed';

interface StudyProgress {
  module_key: string;
  status: ModuleStatus;
  bookmarked: boolean;
  personal_notes: string;
  last_opened_at: string | null;
}

export function StudyPage({ onBack }: Props) {
  const { user, isDemo, showToast } = useApp();
  const [progress, setProgress] = useState<Record<string, StudyProgress>>({});
  const [selectedModule, setSelectedModule] = useState<CourseModule | null>(null);
  const [notes, setNotes] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProgress();
  }, [user, isDemo]);

  const loadProgress = async () => {
    setLoading(true);
    if (isDemo) {
      const saved = localStorage.getItem('cpv_demo_study_progress');
      if (saved) try { setProgress(JSON.parse(saved)); } catch {}
      setLoading(false);
      return;
    }
    if (!user) { setLoading(false); return; }
    const { data } = await supabase.from('contemplative_study_progress').select('*').eq('user_id', user.id);
    const map: Record<string, StudyProgress> = {};
    (data ?? []).forEach((row: any) => { map[row.module_key] = row; });
    setProgress(map);
    setLoading(false);
  };

  const saveProgress = async (moduleKey: string, updates: Partial<StudyProgress>) => {
    const current = progress[moduleKey] ?? { module_key: moduleKey, status: 'not_started', bookmarked: false, personal_notes: '', last_opened_at: null };
    const updated = { ...current, ...updates };
    setProgress(prev => ({ ...prev, [moduleKey]: updated }));

    if (isDemo) {
      const next = { ...progress, [moduleKey]: updated };
      localStorage.setItem('cpv_demo_study_progress', JSON.stringify(next));
      return;
    }
    if (!user) return;
    await supabase.from('contemplative_study_progress').upsert({
      user_id: user.id,
      module_key: moduleKey,
      ...updated,
    }, { onConflict: 'user_id,module_key' });
  };

  const openModule = async (module: CourseModule) => {
    setSelectedModule(module);
    setNotes(progress[module.key]?.personal_notes ?? '');
    const current = progress[module.key];
    if (!current || current.status === 'not_started') {
      await saveProgress(module.key, { status: 'in_progress', last_opened_at: new Date().toISOString() });
    } else {
      await saveProgress(module.key, { last_opened_at: new Date().toISOString() });
    }
  };

  const markCompleted = async () => {
    if (!selectedModule) return;
    await saveProgress(selectedModule.key, { status: 'completed', personal_notes: notes });
    showToast('Modulo completato!', 'success');
    setSelectedModule(null);
  };

  const saveNotes = async () => {
    if (!selectedModule) return;
    await saveProgress(selectedModule.key, { personal_notes: notes });
    showToast('Note salvate!', 'success');
  };

  const toggleBookmark = async (moduleKey: string) => {
    const current = progress[moduleKey]?.bookmarked ?? false;
    await saveProgress(moduleKey, { bookmarked: !current });
  };

  const STATUS_COLORS: Record<ModuleStatus, string> = {
    not_started: 'bg-warm-gray-200',
    in_progress: 'bg-amber-400',
    completed: 'bg-sage-500',
  };
  const STATUS_LABELS: Record<ModuleStatus, string> = {
    not_started: 'Non iniziato',
    in_progress: 'In corso',
    completed: 'Completato',
  };

  const allModules = COURSE_DATA.flatMap(level => level.modules);
  const filteredModules = searchQuery
    ? allModules.filter(m => m.title.toLowerCase().includes(searchQuery.toLowerCase()) || m.summary.toLowerCase().includes(searchQuery.toLowerCase()))
    : null;

  const totalCompleted = Object.values(progress).filter(p => p.status === 'completed').length;
  const totalModules = allModules.length;

  return (
    <div className="space-y-4 pb-4">
      <div className="flex items-center gap-3">
        <button onClick={onBack} className="p-2 rounded-xl hover:bg-warm-gray-100 transition-colors">
          <ArrowLeft size={20} className="text-warm-gray-700" />
        </button>
        <h1 className="section-title flex-1">Studio — Corso Completo</h1>
      </div>

      {/* Warning */}
      <div className="card bg-amber-50 border-amber-200">
        <div className="flex gap-2">
          <AlertTriangle size={16} className="text-amber-600 flex-shrink-0 mt-0.5" />
          <p className="text-xs text-amber-700">Alcune pratiche spirituali avanzate richiedono la guida di un maestro qualificato. Questa applicazione non fornisce iniziazioni o istruzioni sostitutive.</p>
        </div>
      </div>

      {/* Progress */}
      <div className="card">
        <div className="flex justify-between text-sm mb-2">
          <span className="text-warm-gray-600 font-medium">Progressi</span>
          <span className="text-sage-600 font-semibold">{totalCompleted}/{totalModules} moduli</span>
        </div>
        <div className="w-full bg-warm-gray-100 rounded-full h-2">
          <div className="bg-sage-500 h-2 rounded-full transition-all" style={{ width: `${totalModules ? (totalCompleted / totalModules) * 100 : 0}%` }} />
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-warm-gray-400" />
        <input type="text" className="input-field pl-9" placeholder="Cerca nel corso..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
      </div>

      {/* Course content */}
      {filteredModules ? (
        <div className="space-y-2">
          <p className="text-sm text-warm-gray-500">{filteredModules.length} risultati per "{searchQuery}"</p>
          {filteredModules.map(m => (
            <ModuleCard key={m.key} module={m} prog={progress[m.key]} onOpen={openModule} onBookmark={toggleBookmark} statusColors={STATUS_COLORS} statusLabels={STATUS_LABELS} />
          ))}
        </div>
      ) : (
        COURSE_DATA.map(level => (
          <div key={level.key} className="space-y-2">
            <h2 className="font-bold text-warm-gray-800 text-lg px-1">{level.title}</h2>
            {level.modules.map(m => (
              <ModuleCard key={m.key} module={m} prog={progress[m.key]} onOpen={openModule} onBookmark={toggleBookmark} statusColors={STATUS_COLORS} statusLabels={STATUS_LABELS} />
            ))}
          </div>
        ))
      )}

      {/* Resources */}
      <div className="card">
        <h2 className="font-semibold text-warm-gray-800 mb-3">Risorse esterne</h2>
        <div className="space-y-2 text-sm">
          {[
            { url: 'https://ngalso.org', label: 'ngalso.org', desc: 'Sito ufficiale NgalSo' },
            { url: 'https://www.youtube.com/@NgalSoVideos', label: 'YouTube NgalSo', desc: 'Video di Lama Michel Rinpoche' },
            { url: 'https://kunpen.ngalso.org', label: 'Kunpen Lama Gangchen', desc: 'Centro di meditazione' },
          ].map(r => (
            <a
              key={r.url}
              href={r.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-petrol-600 hover:text-petrol-800 hover:underline"
            >
              <ExternalLink size={14} />
              <span>{r.label}</span>
              <span className="text-warm-gray-400">— {r.desc}</span>
            </a>
          ))}
        </div>
      </div>

      {/* Module detail modal */}
      {selectedModule && (
        <Modal isOpen title={selectedModule.title} onClose={() => setSelectedModule(null)} size="lg">
          <div className="space-y-4">
            <div
              className="prose prose-sm max-w-none text-warm-gray-700 text-sm leading-relaxed"
              dangerouslySetInnerHTML={{ __html: selectedModule.content }}
            />

            {selectedModule.externalLinks?.map(link => (
              <a
                key={link.url}
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-petrol-600 hover:text-petrol-800 text-sm"
              >
                <ExternalLink size={14} />
                <span>{link.label}</span>
                <span className="text-warm-gray-400 text-xs">({link.domain})</span>
              </a>
            ))}

            <div>
              <label className="label">Note personali</label>
              <textarea
                className="input-field h-20 resize-none text-sm"
                placeholder="Le tue riflessioni su questo modulo..."
                value={notes}
                onChange={e => setNotes(e.target.value)}
              />
            </div>

            <div className="flex gap-3">
              <button onClick={saveNotes} className="btn-secondary flex-1">Salva note</button>
              <button
                onClick={markCompleted}
                className={`flex-1 flex items-center justify-center gap-2 font-semibold py-3 px-4 rounded-xl transition-all ${
                  progress[selectedModule.key]?.status === 'completed'
                    ? 'bg-sage-100 text-sage-700'
                    : 'btn-primary'
                }`}
              >
                <Check size={16} />
                {progress[selectedModule.key]?.status === 'completed' ? 'Completato' : 'Segna completato'}
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

function ModuleCard({
  module, prog, onOpen, onBookmark, statusColors, statusLabels,
}: {
  module: CourseModule;
  prog?: StudyProgress;
  onOpen: (m: CourseModule) => void;
  onBookmark: (key: string) => void;
  statusColors: Record<ModuleStatus, string>;
  statusLabels: Record<ModuleStatus, string>;
}) {
  const status: ModuleStatus = prog?.status ?? 'not_started';
  return (
    <div className="card hover:bg-warm-gray-50 transition-all border-l-4 border-sage-300 cursor-pointer" onClick={() => onOpen(module)}>
      <div className="flex items-start gap-3">
        <div className={`w-3 h-3 rounded-full mt-1 flex-shrink-0 ${statusColors[status]}`} />
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-warm-gray-800 text-sm">{module.title}</p>
          <p className="text-xs text-warm-gray-500 mt-0.5">{module.summary}</p>
          <p className="text-xs text-warm-gray-400 mt-1">{statusLabels[status]}</p>
        </div>
        <button
          onClick={e => { e.stopPropagation(); onBookmark(module.key); }}
          className={`p-1 rounded-lg transition-colors flex-shrink-0 ${prog?.bookmarked ? 'text-amber-500' : 'text-warm-gray-300 hover:text-amber-400'}`}
        >
          <Bookmark size={16} fill={prog?.bookmarked ? 'currentColor' : 'none'} />
        </button>
      </div>
    </div>
  );
}
