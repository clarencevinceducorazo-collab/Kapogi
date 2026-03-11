'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  File, 
  FolderOpen, 
  Search, 
  LayoutGrid, 
  List, 
  Trash2, 
  Link as LinkIcon, 
  Upload, 
  ArrowLeft, 
  ArrowRight, 
  LoaderCircle, 
  CheckCircle, 
  AlertCircle, 
  Database,
  RefreshCw,
  X,
  Copy,
  Calendar,
  HardDrive,
  Pencil,
  Plus,
  Hash,
  Eye
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { PageHeader } from '@/components/kapogian/page-header';
import { PageFooter } from '@/components/kapogian/page-footer';

// ─── Types ────────────────────────────────────────────────────────────────────

interface KapoFile {
  id: string;
  name: string;
  cid: string;
  size: number;
  date: string;
  vis: 'public' | 'private';
  group: string;
  url: string;
}

interface KapoGroup {
  id: string;
  name: string;
  emoji: string;
  date: string;
  vis: 'public' | 'private';
}

const fmtSz = (b: number) => b >= 1048576 ? (b / 1048576).toFixed(2) + ' MB' : (b / 1024).toFixed(2) + ' KB';
const fmtDt = (d: string) => {
  if (!d) return '—';
  try {
    const date = new Date(d);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  } catch {
    return d;
  }
};
const sCID = (c: string) => c.length > 12 ? c.slice(0, 6) + '…' + c.slice(-5) : c;
const ext = (n: string) => (n.split('.').pop() || '').toLowerCase();
const emoF = (n: string) => {
  const e = ext(n);
  const map: Record<string, string> = { gif: '🎞️', png: '🖼️', jpg: '🖼️', jpeg: '🖼️', svg: '📐', mp4: '🎬', mp3: '🎵', pdf: '📄', zip: '📦', json: '📋', webp: '🖼️' };
  return map[e] || '📁';
};
const thCls = (n: string) => {
  const e = ext(n);
  const map: Record<string, string> = { gif: 'th-gif', png: 'th-png', jpg: 'th-jpg', jpeg: 'th-jpeg', svg: 'th-svg', mp4: 'th-mp4', pdf: 'th-pdf', zip: 'th-zip', json: 'th-json', webp: 'th-webp' };
  return map[e] || 'th-def';
};
const tyGrp = (n: string) => {
  const e = ext(n);
  if (['gif'].includes(e)) return 'gif';
  if (['png', 'jpg', 'jpeg', 'webp', 'svg'].includes(e)) return 'image';
  return 'other';
};

const generateId = () => {
  return Math.random().toString(36).substr(2, 9);
};

const GROUP_EMOJIS = ['📁', '🛍️', '🎞️', '🖼️', '🎨', '🔥', '⭐', '🌐', '🎵', '📦', '💎', '🏆'];

export default function KapogianStoragePage() {
  const [mounted, setMounted] = useState(false);
  const [page, setPage] = useState<'files' | 'groups'>('files');
  const [activeTab, setActiveTab] = useState<'public' | 'private'>('public');
  const [typeFilter, setTypeFilter] = useState<'all' | 'image' | 'gif' | 'other'>('all');
  const [groupFilter, setGroupFilter] = useState<string | null>(null);
  const [view, setView] = useState<'grid' | 'list'>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortOption, setSortOption] = useState('date-desc');
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(12);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  
  const [files, setFiles] = useState<KapoFile[]>([]);
  const [isLoadingFiles, setIsLoadingFiles] = useState(true);
  const [toasts, setToasts] = useState<{ id: number; message: string; type: 'info' | 'success' | 'error' }[]>([]);
  
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [groupModalOpen, setGroupModalOpen] = useState(false);
  
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);
  const [uploadGroup, setUploadGroup] = useState("");
  const [uploadVis, setUploadVis] = useState<'public' | 'private'>('public');

  const [newGroupName, setNewGroupName] = useState("");
  const [newGroupEmoji, setNewGroupEmoji] = useState("📁");

  const [groups, setGroups] = useState<KapoGroup[]>([]);

  // ─── Hydration & Persistence ───
  useEffect(() => {
    setMounted(true);
    const saved = localStorage.getItem('kapogian-groups');
    if (saved) {
      try {
        setGroups(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to load groups", e);
      }
    }
  }, []);

  useEffect(() => {
    if (mounted) {
      localStorage.setItem('kapogian-groups', JSON.stringify(groups));
    }
  }, [groups, mounted]);

  const fetchFiles = async () => {
    setIsLoadingFiles(true);
    try {
      const res = await fetch("/api/pinata/list");
      if (!res.ok) throw new Error("Failed to fetch from Pinata");
      const data = await res.json();
      if (data.files) {
        const parsedFiles: KapoFile[] = data.files.map((f: any) => ({
          id: f.ipfsHash, 
          name: f.name,
          cid: f.ipfsHash,
          size: f.size || 0,
          date: f.date || new Date().toISOString(),
          vis: 'public', 
          group: f.group || '',
          url: f.url
        }));
        setFiles(parsedFiles);

        // Deduce groups from Pinata metadata
        const foundGroups = new Set<string>();
        parsedFiles.forEach(f => { if (f.group) foundGroups.add(f.group); });
        
        setGroups(prev => {
          const existingNames = new Set(prev.map(g => g.name));
          const newGroups: KapoGroup[] = Array.from(foundGroups)
            .filter(name => !existingNames.has(name))
            .map(name => ({
              id: generateId(),
              name,
              emoji: '📦',
              date: new Date().toISOString(),
              vis: 'public'
            }));
          return [...prev, ...newGroups];
        });
      }
    } catch (err) {
      console.error(err);
      addToast("Failed to sync storage with Pinata", "error");
    } finally {
      setIsLoadingFiles(false);
    }
  };

  useEffect(() => {
    fetchFiles();
  }, []);

  const addToast = (message: string, type: 'info' | 'success' | 'error' = 'info') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 2500);
  };

  const copyText = (text: string, label: string) => {
    navigator.clipboard.writeText(text)
      .then(() => addToast(`${label} copied!`, 'success'))
      .catch(() => addToast('Copy failed', 'error'));
  };

  const filteredFiles = useMemo(() => {
    const q = searchQuery.toLowerCase();
    const [sk, sd] = sortOption.split('-');
    
    return files
      .filter(f => f.vis === activeTab)
      .filter(f => typeFilter === 'all' || tyGrp(f.name) === typeFilter)
      .filter(f => !groupFilter || f.group === groupFilter)
      .filter(f => !q || f.name.toLowerCase().includes(q) || f.cid.toLowerCase().includes(q))
      .sort((a, b) => {
        let va: any = (a as any)[sk === 'date' ? 'date' : sk];
        let vb: any = (b as any)[sk === 'date' ? 'date' : sk];
        if (sk === 'size') { va = a.size; vb = b.size; }
        return (va < vb ? -1 : va > vb ? 1 : 0) * (sd === 'desc' ? -1 : 1);
      });
  }, [files, activeTab, typeFilter, groupFilter, searchQuery, sortOption]);

  const filteredGroups = useMemo(() => {
    const q = searchQuery.toLowerCase();
    return groups
      .filter(g => g.vis === activeTab)
      .filter(g => !q || g.name.toLowerCase().includes(q) || g.id.toLowerCase().includes(q));
  }, [groups, activeTab, searchQuery]);

  const totalPages = Math.max(1, Math.ceil(filteredFiles.length / rowsPerPage));
  const currentFiles = useMemo(() => {
    const start = (currentPage - 1) * rowsPerPage;
    return filteredFiles.slice(start, start + rowsPerPage);
  }, [filteredFiles, currentPage, rowsPerPage]);

  const deleteFile = async (id: string) => {
    try {
      const res = await fetch("/api/pinata/unpin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ hash: id })
      });
      if (!res.ok) throw new Error("Unpin request failed");
      
      setFiles(prev => prev.filter(f => f.id !== id));
      addToast('File removed from IPFS', 'success');
    } catch (err) {
      console.error(err);
      addToast("Failed to delete file", "error");
    }
  };

  const handleUpload = async () => {
    if (pendingFiles.length === 0) return addToast('No files selected', 'error');
    setIsLoadingFiles(true);
    try {
      for (const file of pendingFiles) {
        const presignRes = await fetch("/api/pinata/upload");
        const { url } = await presignRes.json();
        const formData = new FormData();
        formData.append("file", file);
        await fetch(url, { method: "POST", body: formData });
      }
      await fetchFiles(); 
      setUploadModalOpen(false);
      setPendingFiles([]);
      addToast(`Upload complete!`, 'success');
    } catch (err) {
      addToast("Upload failed", "error");
    } finally {
      setIsLoadingFiles(false);
    }
  };

  const saveGroup = () => {
    if (!newGroupName.trim()) return addToast('Name required', 'error');
    const newG: KapoGroup = {
      id: generateId(),
      name: newGroupName.trim(),
      emoji: newGroupEmoji,
      date: new Date().toISOString().split('T')[0],
      vis: activeTab
    };
    setGroups(prev => [newG, ...prev]);
    setNewGroupName("");
    setGroupModalOpen(false);
    addToast(`Group "${newG.name}" created!`, 'success');
  };

  const navigateToGroup = (groupName: string) => {
    setGroupFilter(groupName);
    setPage('files');
    setCurrentPage(1);
    addToast(`Viewing group: ${groupName}`, 'info');
  };

  const toggleSel = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedIds(next);
  };

  const copyUrl = (url: string) => {
    copyText(url, "URL");
  };

  if (!mounted) return null;

  return (
    <div className="bg-gradient-to-b from-amber-100 via-yellow-50 to-white text-slate-700 min-h-screen font-body selection:bg-blue-200 selection:text-pink-900">
      <style jsx global>{`
        @keyframes blob-pulse { 0%,100%{transform:scale(1);opacity:.4} 50%{transform:scale(1.08);opacity:.6} }
        @keyframes card-in    { from{transform:translateY(18px) scale(.97);opacity:0} to{transform:translateY(0) scale(1);opacity:1} }
        .animate-blob { animation: blob-pulse 9s infinite; }
        .neo { background:linear-gradient(145deg,#fff,#f0f4ff); box-shadow:8px 8px 18px #bcd4e6,-8px -8px 18px #fff; }
        .neo-sm { background:linear-gradient(145deg,#fff,#f8faff); box-shadow:5px 5px 12px #b8d4e8,-5px -5px 12px #fff; }
        .sidebar { background: linear-gradient(170deg,#ffffff 60%,#f0f8ff); box-shadow: 6px 0 28px rgba(209,217,230,.45); border-right: 2px solid rgba(255,255,255,.95); }
        .file-card { background:linear-gradient(145deg,#fff,#fffdf5); box-shadow:7px 7px 16px #ddd5c0,-7px -7px 16px #fff; border:2px solid rgba(255,255,255,.9); transition:all .32s cubic-bezier(.34,1.56,.64,1); animation:card-in .38s cubic-bezier(.34,1.56,.64,1) both; }
        .file-card:hover { transform:translateY(-8px) scale(1.025); box-shadow:12px 12px 28px #cfc7b0,-12px -12px 24px #fff; }
        .th-gif  { background:linear-gradient(135deg,#fce7f3,#fbcfe8); }
        .th-png  { background:linear-gradient(135deg,#e0f2fe,#bae6fd); }
        .th-jpg,.th-jpeg { background:linear-gradient(135deg,#dcfce7,#bbf7d0); }
        .th-svg  { background:linear-gradient(135deg,#ede9fe,#ddd6fe); }
        .th-mp4  { background:linear-gradient(135deg,#fef9c3,#fef08a); }
        .th-pdf  { background:linear-gradient(135deg,#fee2e2,#fecaca); }
        .th-zip  { background:linear-gradient(135deg,#f1f5f9,#e2e8f0); }
        .th-json { background:linear-gradient(135deg,#f0fdf4,#dcfce7); }
        .th-webp { background:linear-gradient(135deg,#fff7ed,#fed7aa); }
        .th-def  { background:linear-gradient(135deg,#f8fafc,#f1f5f9); }
        .squishy { transition:transform .13s cubic-bezier(.34,1.56,.64,1); cursor:pointer; }
        .squishy:active { transform:scale(.88); }
        .tab-btn { position:relative; padding-bottom:8px; font-weight:800; font-size:.875rem; color:#94a3b8; transition:color .2s; }
        .tab-btn::after { content:''; position:absolute; bottom:0; left:0; width:0; height:3px; background:linear-gradient(90deg,#38bdf8,#3b82f6); border-radius:99px; transition:width .3s cubic-bezier(.34,1.56,.64,1); }
        .tab-btn.active { color:#1e293b; }
        .tab-btn.active::after { width:100%; }
        .nav-item { transition:all .22s cubic-bezier(.34,1.56,.64,1); cursor:pointer; }
        .nav-item.active { background:linear-gradient(135deg,rgba(251,191,36,.2),rgba(249,115,22,.13)); color:#0284c7; border-color:rgba(251,191,36,.32); box-shadow:3px 3px 10px rgba(251,191,36,.18),-3px -3px 8px #fff; }
      `}</style>

      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute top-6 left-6 w-80 h-80 bg-sky-300 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob" />
        <div className="absolute top-16 right-8 w-64 h-64 bg-blue-200 rounded-full mix-blend-multiply filter blur-3xl opacity-15 animate-blob" style={{ animationDelay: '2.5s' }} />
      </div>

      <PageHeader />

      <div className="relative z-10 flex min-h-screen pt-20">
        <aside className="sidebar fixed top-20 left-0 h-[calc(100vh-5rem)] w-52 z-40 flex flex-col py-7 px-3 hidden lg:flex">
          <div className="flex items-center gap-2.5 px-3 mb-7">
            <span className="text-3xl animate-bounce inline-block leading-none">🪅</span>
            <div>
              <div className="text-[11px] font-black text-slate-800 uppercase tracking-tight leading-none">KAPOGIAN</div>
              <div className="text-[10px] font-extrabold text-sky-400 tracking-widest uppercase mt-0.5">STORAGE</div>
            </div>
          </div>
          <nav className="flex-1 space-y-1">
            <button onClick={() => setPage('files')} className={cn("w-full nav-item flex items-center gap-3 px-4 py-2.5 rounded-2xl font-black text-xs transition-all border-2 border-transparent", page === 'files' ? "active" : "text-slate-400 hover:bg-amber-50")}>
              <File className={cn("w-4 h-4", page === 'files' ? "text-sky-50" : "text-slate-300")} />
              Files
            </button>
            <button onClick={() => setPage('groups')} className={cn("w-full nav-item flex items-center gap-3 px-4 py-2.5 rounded-2xl font-black text-xs transition-all border-2 border-transparent", page === 'groups' ? "active" : "text-slate-400 hover:bg-amber-50")}>
              <FolderOpen className={cn("w-4 h-4", page === 'groups' ? "text-sky-50" : "text-slate-300")} />
              Groups
              <span className="ml-auto bg-sky-100 text-sky-600 text-[9px] font-black px-2 py-0.5 rounded-full">{groups.length}</span>
            </button>
          </nav>
        </aside>

        <main className="flex-1 lg:ml-52 min-w-0">
          <div className="max-w-6xl mx-auto px-5 pt-10 pb-28">
            
            <div className="flex items-center justify-between mb-7 flex-wrap gap-4 pl-12 lg:pl-0">
              <div className="flex items-center gap-4">
                <h1 className="text-4xl font-black text-slate-800 tracking-tight leading-none uppercase">
                  {page === 'files' ? 'Files' : 'Groups'}
                </h1>
                {page === 'files' && groupFilter && (
                  <div className="flex items-center gap-2 bg-sky-50 border-2 border-sky-100 px-3 py-1.5 rounded-2xl shadow-sm">
                    <span className="text-[10px] font-black text-sky-400 uppercase tracking-widest">Group:</span>
                    <span className="text-xs font-black text-sky-600 uppercase italic">{groupFilter}</span>
                    <button onClick={() => setGroupFilter(null)} className="w-5 h-5 flex items-center justify-center rounded-full bg-sky-100 text-sky-500 hover:bg-red-500 hover:text-white transition-all">
                      <X size={10} />
                    </button>
                  </div>
                )}
              </div>
              <div className="flex gap-2">
                <button onClick={fetchFiles} disabled={isLoadingFiles} className="squishy bg-white border-2 border-slate-100 rounded-2xl w-12 h-12 flex items-center justify-center text-slate-400 hover:text-sky-500 transition-all shadow-sm">
                  <RefreshCw size={18} className={isLoadingFiles ? "animate-spin" : ""} />
                </button>
                <button 
                  onClick={() => page === 'files' ? setUploadModalOpen(true) : setGroupModalOpen(true)} 
                  className="squishy bg-indigo-500 text-white font-black px-6 py-3 rounded-full text-xs flex items-center gap-2 hover:bg-indigo-600 transition-all uppercase tracking-widest shadow-lg"
                >
                  <Plus size={18} /> Add
                </button>
              </div>
            </div>

            <div className="flex gap-6 mb-6 border-b-2 border-slate-100">
              <button onClick={() => setActiveTab('public')} className={cn("tab-btn", activeTab === 'public' && "active")}>PUBLIC</button>
              <button onClick={() => setActiveTab('private')} className={cn("tab-btn", activeTab === 'private' && "active")}>PRIVATE</button>
            </div>

            <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <p className="text-sm font-medium text-slate-400">
                {activeTab === 'public' 
                  ? `All ${page} in this section are public and accessible via public IPFS.` 
                  : `Private ${page} are only visible to authorized explorers.`}
              </p>
              <div className="relative w-full max-w-sm">
                <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300" />
                <input 
                  type="text" 
                  placeholder={`Search by IPFS ${page}`} 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-white border-2 border-slate-100 rounded-xl pl-10 pr-4 py-2 text-sm font-medium focus:border-indigo-300 outline-none transition-all shadow-sm"
                />
              </div>
            </div>

            {page === 'files' && (
              <div className="animate-in fade-in duration-500">
                <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
                  <div className="flex gap-1.5 flex-wrap">
                    <button onClick={() => setTypeFilter('all')} className={cn("px-3 py-1.5 rounded-full font-extrabold text-[10px] border-2 uppercase transition-all", typeFilter === 'all' ? "bg-sky-500 text-white border-sky-600" : "bg-white text-slate-400 border-slate-100")}>All</button>
                    <button onClick={() => setTypeFilter('image')} className={cn("px-3 py-1.5 rounded-full font-extrabold text-[10px] border-2 uppercase transition-all", typeFilter === 'image' ? "bg-sky-500 text-white border-sky-600" : "bg-white text-slate-400 border-slate-100")}>🖼️ Images</button>
                    <button onClick={() => setTypeFilter('gif')} className={cn("px-3 py-1.5 rounded-full font-extrabold text-[10px] border-2 uppercase transition-all", typeFilter === 'gif' ? "bg-sky-500 text-white border-sky-600" : "bg-white text-slate-400 border-slate-100")}>🎞️ GIFs</button>
                    <button onClick={() => setTypeFilter('other')} className={cn("px-3 py-1.5 rounded-full font-extrabold text-[10px] border-2 uppercase transition-all", typeFilter === 'other' ? "bg-sky-500 text-white border-sky-600" : "bg-white text-slate-400 border-slate-100")}>📁 Other</button>
                  </div>
                  <div className="flex items-center gap-2">
                    <select value={sortOption} onChange={(e) => setSortOption(e.target.value)} className="bg-white border-2 border-slate-100 rounded-xl px-3 py-2 text-xs font-black text-slate-600 cursor-pointer focus:border-sky-400 outline-none shadow-sm">
                      <option value="date-desc">Newest First</option>
                      <option value="date-asc">Oldest First</option>
                      <option value="size-desc">Largest First</option>
                      <option value="size-asc">Smallest First</option>
                    </select>
                    <div className="bg-white p-1 rounded-xl border-2 border-slate-100 flex gap-1 shadow-sm">
                      <button onClick={() => setView('grid')} className={cn("p-1.5 rounded-lg transition-all", view === 'grid' ? "bg-sky-100 text-sky-600" : "text-slate-300 hover:text-slate-400")}>
                        <LayoutGrid size={16} />
                      </button>
                      <button onClick={() => setView('list')} className={cn("p-1.5 rounded-lg transition-all", view === 'list' ? "bg-sky-100 text-sky-600" : "text-slate-300 hover:text-slate-400")}>
                        <List size={16} />
                      </button>
                    </div>
                  </div>
                </div>

                {isLoadingFiles ? (
                  <div className="flex flex-col items-center justify-center py-32 gap-4">
                    <LoaderCircle size={48} className="animate-spin text-sky-400" />
                    <p className="font-black uppercase tracking-widest text-slate-400">Syncing with Pinata...</p>
                  </div>
                ) : currentFiles.length === 0 ? (
                  <div className="text-center py-32 opacity-40">
                    <Database size={64} className="mx-auto mb-4 text-slate-200" />
                    <p className="font-black uppercase tracking-widest text-slate-400">Empty Chamber</p>
                  </div>
                ) : (
                  <>
                    <div className={cn(view === 'grid' ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6" : "space-y-3")}>
                      {currentFiles.map((file, i) => (
                        <div key={file.id} className={cn("file-card group rounded-[2.5rem] overflow-hidden", selectedIds.has(file.id) && "selected")}>
                          <div className="flex flex-col">
                            <div className={cn("relative h-48 flex items-center justify-center cursor-pointer overflow-hidden", thCls(file.name))} onClick={() => toggleSel(file.id)}>
                              <div className="absolute inset-0 opacity-20 bg-[radial-gradient(#000_1px,transparent_1px)] [background-size:12px_12px]" />
                              {tyGrp(file.name) === 'image' || tyGrp(file.name) === 'gif' ? (
                                <div className="absolute inset-0 p-3 flex items-center justify-center">
                                  <img src={file.url} alt={file.name} className="w-full h-full object-contain drop-shadow-xl rounded-2xl transition-transform duration-500 group-hover:scale-110" loading="lazy" />
                                </div>
                              ) : (
                                <span className="text-6xl drop-shadow-lg group-hover:scale-110 transition-transform duration-500 select-none relative z-10">{emoF(file.name)}</span>
                              )}
                              <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                                  <button onClick={(e) => { e.stopPropagation(); deleteFile(file.id); }} className="w-8 h-8 bg-red-500 text-white rounded-xl flex items-center justify-center shadow-lg hover:bg-red-600 transition-colors">
                                      <Trash2 size={14} />
                                  </button>
                              </div>
                            </div>
                            <div className="p-5 bg-white space-y-3">
                              <div>
                                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Name</p>
                                  <p className="font-black text-slate-800 text-sm truncate leading-tight" title={file.name}>{file.name}</p>
                              </div>
                              <div className="grid grid-cols-2 gap-4">
                                  <div>
                                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-0.5 flex items-center gap-1"><HardDrive size={10} /> Size</p>
                                      <p className="font-bold text-slate-600 text-[11px]">{fmtSz(file.size)}</p>
                                  </div>
                                  <div>
                                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-0.5 flex items-center gap-1"><Calendar size={10} /> Date</p>
                                      <p className="font-bold text-slate-600 text-[11px]">{fmtDt(file.date)}</p>
                                  </div>
                              </div>
                              <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1 flex items-center gap-1"><Copy size={10} /> CID</p>
                                    <div className="flex items-center gap-2 bg-slate-50 border border-slate-100 rounded-lg px-2 py-1.5 group/cid cursor-pointer hover:bg-sky-50 transition-colors" onClick={() => copyText(file.cid, "CID")}>
                                        <span className="font-mono text-[9px] text-slate-400 truncate flex-1 uppercase">{sCID(file.cid)}</span>
                                        <Copy size={10} className="text-slate-200" />
                                    </div>
                                </div>
                                <div>
                                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1 flex items-center gap-1"><Hash size={10} /> File ID</p>
                                    <div className="flex items-center gap-2 bg-slate-50 border border-slate-100 rounded-lg px-2 py-1.5 group/id cursor-pointer hover:bg-sky-50 transition-colors" onClick={() => copyText(file.id, "File ID")}>
                                        <span className="font-mono text-[9px] text-slate-400 truncate flex-1 uppercase">{sCID(file.id)}</span>
                                        <Copy size={10} className="text-slate-200" />
                                    </div>
                                </div>
                              </div>
                              <button onClick={() => copyUrl(file.url)} className="w-full h-9 bg-sky-50 rounded-xl flex items-center justify-center gap-2 border-2 border-sky-100 text-sky-500 font-black text-[10px] uppercase tracking-widest hover:bg-sky-500 hover:text-white transition-all shadow-sm">
                                <LinkIcon size={12} /> Copy Link
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="mt-12 flex justify-center">
                      <div className="neo-sm rounded-2xl px-6 py-3 border-2 border-white flex items-center gap-6">
                        <div className="flex items-center gap-3">
                          <span className="text-xs font-black text-slate-400 uppercase tracking-widest">Rows:</span>
                          <select 
                            value={rowsPerPage} 
                            onChange={(e) => {
                              setRowsPerPage(Number(e.target.value));
                              setCurrentPage(1);
                            }}
                            className="bg-sky-50 border-2 border-sky-100 rounded-xl px-2 py-1 text-xs font-black text-slate-600 cursor-pointer outline-none"
                          >
                            <option value={8}>8</option>
                            <option value={12}>12</option>
                            <option value={24}>24</option>
                            <option value={48}>48</option>
                          </select>
                        </div>
                        <div className="flex items-center gap-4">
                          <button onClick={() => changePage(-1)} disabled={currentPage === 1} className="squishy w-10 h-10 neo-sm rounded-xl flex items-center justify-center text-slate-400 hover:text-sky-500 disabled:opacity-20 transition-all border border-white">
                            <ArrowLeft size={18} />
                          </button>
                          <div className="flex flex-col items-center min-w-[80px]">
                            <span className="text-[9px] font-black text-slate-300 uppercase tracking-widest">Page</span>
                            <span className="text-sm font-black text-slate-700">{currentPage} / {totalPages}</span>
                          </div>
                          <button onClick={() => changePage(1)} disabled={currentPage === totalPages} className="squishy w-10 h-10 neo-sm rounded-xl flex items-center justify-center text-slate-400 hover:text-sky-500 disabled:opacity-20 transition-all border border-white">
                            <ArrowRight size={18} />
                          </button>
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </div>
            )}

            {page === 'groups' && (
              <div className="animate-in fade-in duration-500">
                <div className="bg-white border-2 border-slate-50 rounded-3xl overflow-hidden shadow-sm">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50/50 border-b border-slate-100 text-[10px] font-black uppercase text-slate-400 tracking-widest">
                        <th className="px-6 py-4">Name</th>
                        <th className="px-6 py-4">Created At</th>
                        <th className="px-6 py-4 text-center">Group ID</th>
                        <th className="px-6 py-4 text-center">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {filteredGroups.length === 0 ? (
                        <tr>
                          <td colSpan={4} className="px-6 py-12 text-center text-slate-300 font-bold italic">No groups found.</td>
                        </tr>
                      ) : (
                        filteredGroups.map((group) => (
                          <tr key={group.id} className="hover:bg-slate-50 transition-colors group">
                            <td className="px-6 py-4">
                              <button onClick={() => navigateToGroup(group.name)} className="flex items-center gap-3 hover:translate-x-1 transition-transform group/btn">
                                <span className="text-xl group-hover/btn:scale-110 transition-transform">{group.emoji}</span>
                                <span className="font-black text-slate-700 uppercase italic tracking-tight underline decoration-2 decoration-sky-100 group-hover/btn:text-sky-500 group-hover/btn:decoration-sky-400">{group.name}</span>
                              </button>
                            </td>
                            <td className="px-6 py-4 text-slate-400 font-bold text-sm">{fmtDt(group.date)}</td>
                            <td className="px-6 py-4 text-center">
                              <button onClick={() => copyText(group.id, "Group ID")} className="p-2 text-slate-300 hover:text-indigo-500 transition-colors">
                                <Copy size={18} />
                              </button>
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex items-center justify-center gap-2">
                                <button className="p-2 text-slate-300 hover:text-rose-500 transition-colors" onClick={() => {
                                  setGroups(prev => prev.filter(g => g.id !== group.id));
                                  addToast('Group deleted', 'success');
                                }}>
                                  <Trash2 size={18} />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </main>
      </div>

      {/* Upload Modal */}
      {uploadModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setUploadModalOpen(false)} />
          <div className="relative bg-white border-4 border-black rounded-[3rem] p-8 max-w-lg w-full shadow-[12px_12px_0_0_rgba(0,0,0,1)] animate-in zoom-in-95">
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-2xl font-black text-slate-800 uppercase italic tracking-tight">Upload Asset</h3>
              <button onClick={() => setUploadModalOpen(false)} className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 hover:bg-red-500 hover:text-white transition-all shadow-sm">✕</button>
            </div>
            <div id="drop-zone" onClick={() => document.getElementById('upload-input')?.click()} className="border-4 border-dashed border-sky-100 rounded-[2.5rem] p-12 text-center mb-6 hover:border-sky-400 hover:bg-sky-50 transition-all cursor-pointer group">
              <div className="text-6xl mb-4 group-hover:scale-110 transition-transform">🚀</div>
              <p className="font-black text-slate-500 text-sm uppercase tracking-widest">Browse Files</p>
              <input id="upload-input" type="file" multiple className="hidden" onChange={(e) => setPendingFiles(Array.from(e.target.files || []))} />
            </div>
            <div className="grid grid-cols-2 gap-3 mb-6">
                <div>
                    <label className="block text-[10px] font-black text-slate-400 mb-1 uppercase tracking-widest ml-2">Visibility</label>
                    <select value={uploadVis} onChange={(e) => setUploadVis(e.target.value as any)} className="w-full h-12 bg-sky-50 border-2 border-sky-100 rounded-2xl px-4 font-bold text-slate-700 text-sm outline-none focus:border-sky-400">
                        <option value="public">🌐 Public</option>
                        <option value="private">🔒 Private</option>
                    </select>
                </div>
                <div>
                    <label className="block text-[10px] font-black text-slate-400 mb-1 uppercase tracking-widest ml-2">Group</label>
                    <select value={uploadGroup || groupFilter || ""} onChange={(e) => setUploadGroup(e.target.value)} className="w-full h-12 bg-sky-50 border-2 border-sky-100 rounded-2xl px-4 font-bold text-slate-700 text-sm outline-none focus:border-sky-400">
                        <option value="">No Group</option>
                        {groups.map(g => (
                          <option key={g.id} value={g.name}>{g.emoji} {g.name}</option>
                        ))}
                    </select>
                </div>
            </div>
            <button onClick={handleUpload} className="w-full py-5 bg-black text-white rounded-[2rem] font-black uppercase tracking-[0.2em] text-sm shadow-[6px_6px_0_0_#0ea5e9] hover:bg-slate-800 transition-all active:translate-y-1 flex items-center justify-center gap-3">
              <Upload size={20} /> Deploy to IPFS
            </button>
          </div>
        </div>
      )}

      {/* New Group Modal */}
      {groupModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-md" onClick={() => setGroupModalOpen(false)} />
          <div className="relative bg-white border-4 border-black rounded-[3rem] p-8 max-w-sm w-full shadow-[12px_12px_0_0_rgba(0,0,0,1)] animate-in zoom-in-95">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-black text-slate-800">New Group 📂</h3>
              <button onClick={() => setGroupModalOpen(false)} className="w-9 h-9 bg-slate-100 rounded-full flex items-center justify-center font-bold text-slate-400 hover:bg-red-500 hover:text-white transition-all">✕</button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-[10px] font-black text-slate-400 mb-1 uppercase tracking-widest ml-2">Group Name</label>
                <input type="text" value={newGroupName} onChange={(e) => setNewGroupName(e.target.value)} placeholder="e.g. shop-assets" className="w-full h-12 bg-sky-50 border-2 border-sky-100 rounded-2xl px-4 font-bold text-slate-700 text-sm outline-none focus:border-indigo-400" />
              </div>
              <div>
                <label className="block text-[10px] font-black text-slate-400 mb-2 uppercase tracking-widest ml-2">Emoji Badge</label>
                <div className="grid grid-cols-6 gap-2">
                  {GROUP_EMOJIS.map(e => (
                    <button key={e} onClick={() => setNewGroupEmoji(e)} className={cn("w-10 h-10 rounded-xl flex items-center justify-center text-xl border-2 transition-all", newGroupEmoji === e ? "bg-indigo-50 border-indigo-400 shadow-sm" : "bg-slate-50 border-slate-100 hover:border-slate-200")}>{e}</button>
                  ))}
                </div>
              </div>
              <div className="pt-4 flex gap-3">
                <button onClick={() => setGroupModalOpen(false)} className="flex-1 h-12 bg-slate-100 text-slate-500 font-black rounded-2xl text-xs uppercase tracking-widest">Cancel</button>
                <button onClick={saveGroup} className="flex-1 h-12 bg-indigo-500 text-white font-black rounded-2xl shadow-[4px_4px_0_0_#3730a3] text-xs uppercase tracking-widest">Create</button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="fixed bottom-10 right-10 z-[200] flex flex-col gap-3 pointer-events-none">
        {toasts.map(t => (
          <div key={t.id} className={cn("pointer-events-auto flex items-center gap-3 px-6 py-4 rounded-[1.5rem] border-4 border-black font-black text-xs uppercase tracking-widest shadow-[6px_6px_0_0_rgba(0,0,0,1)] animate-in slide-in-from-right-4 duration-300", t.type === 'success' ? 'bg-green-400 text-black' : t.type === 'error' ? 'bg-red-400 text-white' : 'bg-white')}>
            {t.type === 'success' ? <CheckCircle size={18} /> : t.type === 'error' ? <AlertCircle size={18} /> : <Database size={18} />}
            {t.message}
          </div>
        ))}
      </div>

      <PageFooter />
    </div>
  );
}
