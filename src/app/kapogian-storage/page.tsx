'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { 
  File, 
  FolderOpen, 
  PlusCircle, 
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
  Layers,
  HardDrive
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { PageHeader } from '@/components/kapogian/page-header';
import { PageFooter } from '@/components/kapogian/page-footer';

// ─── Constants & Types ────────────────────────────────────────────────────────

const GROUP_PALETTE = [
  'bg-gradient-to-br from-sky-100 to-blue-100',
  'bg-gradient-to-br from-cyan-100 to-blue-100',
  'bg-gradient-to-br from-pink-100 to-rose-100',
  'bg-gradient-to-br from-violet-100 to-purple-100',
  'bg-gradient-to-br from-emerald-100 to-teal-100',
  'bg-gradient-to-br from-orange-100 to-red-100',
  'bg-gradient-to-br from-indigo-100 to-blue-100',
  'bg-gradient-to-br from-fuchsia-100 to-pink-100',
];

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
}

interface Toast {
  id: number;
  message: string;
  type: 'info' | 'success' | 'error';
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

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

const RI = () => {
  let s = '';
  const c = 'abcdefghijklmnopqrstuvwxyz0123456789';
  for (let i = 0; i < 36; i++) s += (i === 8 || i === 13 || i === 18 || i === 23) ? '-' : c[Math.floor(Math.random() * c.length)];
  return s;
};

export default function KapogianStoragePage() {
  const [page, setPage] = useState<'files' | 'groups'>('files');
  const [activeTab, setActiveTab] = useState<'public' | 'private'>('public');
  const [typeFilter, setTypeFilter] = useState<'all' | 'image' | 'gif' | 'other'>('all');
  const [view, setView] = useState<'grid' | 'list'>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortOption, setSortOption] = useState('date-desc');
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(12);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  
  const [files, setFiles] = useState<KapoFile[]>([]);
  const [groups, setGroups] = useState<KapoGroup[]>([]);
  const [isLoadingFiles, setIsLoadingFiles] = useState(true);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);

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

        const foundGroups = new Set<string>();
        parsedFiles.forEach(f => { if (f.group) foundGroups.add(f.group); });
        const initialGroups: KapoGroup[] = Array.from(foundGroups).map(name => ({
          id: RI(),
          name,
          emoji: '📦',
          date: new Date().toISOString()
        }));
        setGroups(initialGroups);
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

  const addToast = (message: string, type: Toast['type'] = 'info') => {
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
      .filter(f => !q || f.name.toLowerCase().includes(q) || f.cid.toLowerCase().includes(q))
      .sort((a, b) => {
        let va: any = (a as any)[sk === 'date' ? 'date' : sk];
        let vb: any = (b as any)[sk === 'date' ? 'date' : sk];
        if (sk === 'size') { va = a.size; vb = b.size; }
        return (va < vb ? -1 : va > vb ? 1 : 0) * (sd === 'desc' ? -1 : 1);
      });
  }, [files, activeTab, typeFilter, searchQuery, sortOption]);

  const totalPages = Math.max(1, Math.ceil(filteredFiles.length / rowsPerPage));
  const currentFiles = useMemo(() => {
    const start = (currentPage - 1) * rowsPerPage;
    return filteredFiles.slice(start, start + rowsPerPage);
  }, [filteredFiles, currentPage, rowsPerPage]);

  const toggleSelection = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedIds(next);
  };

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
        .file-card.selected { background:linear-gradient(145deg,#eff6ff,#dbeafe); border-color:#38bdf8; }
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
              <div className="text-[11px] font-black text-slate-800 uppercase tracking-tight">KAPOGIAN</div>
              <div className="text-[10px] font-extrabold text-sky-400 tracking-widest uppercase mt-0.5">STORAGE</div>
            </div>
          </div>
          <nav className="flex-1 space-y-1">
            <button onClick={() => setPage('files')} className={cn("w-full nav-item flex items-center gap-3 px-4 py-2.5 rounded-2xl font-black text-xs transition-all border-2 border-transparent", page === 'files' ? "active" : "text-slate-400 hover:bg-amber-50")}>
              <File className={cn("w-4 h-4", page === 'files' ? "text-sky-500" : "text-slate-300")} />
              Files
            </button>
            <button onClick={() => setPage('groups')} className={cn("w-full nav-item flex items-center gap-3 px-4 py-2.5 rounded-2xl font-black text-xs transition-all border-2 border-transparent", page === 'groups' ? "active" : "text-slate-400 hover:bg-amber-50")}>
              <FolderOpen className={cn("w-4 h-4", page === 'groups' ? "text-sky-500" : "text-slate-300")} />
              Groups
              <span className="ml-auto bg-sky-100 text-sky-600 text-[9px] font-black px-2 py-0.5 rounded-full">{groups.length}</span>
            </button>
          </nav>
        </aside>

        <main className="flex-1 lg:ml-52 min-w-0">
          <div className="max-w-6xl mx-auto px-5 pt-10 pb-28">
            {page === 'files' && (
              <div className="animate-in fade-in duration-500">
                <div className="flex items-center justify-between mb-7 flex-wrap gap-4">
                  <h1 className="text-4xl font-black text-slate-800 tracking-tight leading-none uppercase italic">Files</h1>
                  <div className="flex gap-2">
                    <button onClick={fetchFiles} disabled={isLoadingFiles} className="squishy bg-white border-2 border-slate-100 rounded-2xl w-12 h-12 flex items-center justify-center text-slate-400 hover:text-sky-500 transition-all shadow-sm">
                      <RefreshCw size={18} className={isLoadingFiles ? "animate-spin" : ""} />
                    </button>
                    <button onClick={() => setUploadModalOpen(true)} className="squishy bg-gradient-to-r from-sky-400 to-blue-600 text-white font-black px-6 py-3 rounded-2xl text-xs flex items-center gap-2 hover:shadow-lg transition-all uppercase tracking-widest shadow-[4px_4px_0_0_#0369a1]">
                      <PlusCircle size={18} /> Upload New
                    </button>
                  </div>
                </div>

                {isLoadingFiles ? (
                  <div className="flex flex-col items-center justify-center py-32 gap-4">
                    <LoaderCircle size={48} className="animate-spin text-sky-400" />
                    <p className="font-black uppercase tracking-widest text-slate-400">Syncing with Pinata...</p>
                  </div>
                ) : filteredFiles.length === 0 ? (
                  <div className="text-center py-32 opacity-40">
                    <Database size={64} className="mx-auto mb-4 text-slate-200" />
                    <p className="font-black uppercase tracking-widest text-slate-400">Empty Chamber</p>
                  </div>
                ) : (
                  <>
                    <div className={cn(view === 'grid' ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6" : "space-y-3")}>
                      {currentFiles.map((file, i) => (
                        <div key={file.id} className={cn("file-card group rounded-[2.5rem] overflow-hidden", selectedIds.has(file.id) && "selected")} style={{ animationDelay: `${i * 0.05}s` }}>
                          <div className="flex flex-col">
                            <div className={cn("relative h-48 flex items-center justify-center cursor-pointer overflow-hidden", thCls(file.name))} onClick={() => toggleSelection(file.id)}>
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

                              <div>
                                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1 flex items-center gap-1"><Copy size={10} /> CID</p>
                                  <div className="flex items-center gap-2 bg-slate-50 border border-slate-100 rounded-lg px-2 py-1.5 group/cid cursor-pointer hover:bg-sky-50 transition-colors" onClick={() => copyText(file.cid, "CID")}>
                                      <span className="font-mono text-[9px] text-slate-400 truncate flex-1 uppercase">{file.cid}</span>
                                      <Copy size={10} className="text-slate-200 group-hover/cid:text-sky-400" />
                                  </div>
                              </div>

                              <div>
                                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1 flex items-center gap-1"><Layers size={10} /> File ID</p>
                                  <div className="flex items-center gap-2 bg-slate-50 border border-slate-100 rounded-lg px-2 py-1.5 group/id cursor-pointer hover:bg-sky-50 transition-colors" onClick={() => copyText(file.id, "ID")}>
                                      <span className="font-mono text-[9px] text-slate-400 truncate flex-1 uppercase">{file.id}</span>
                                      <Copy size={10} className="text-slate-200 group-hover/id:text-sky-400" />
                                  </div>
                              </div>

                              <div className="pt-2 flex gap-2">
                                  <button onClick={() => copyText(file.url, "URL")} className="flex-1 h-9 bg-sky-50 rounded-xl flex items-center justify-center gap-2 border-2 border-sky-100 text-sky-500 font-black text-[10px] uppercase tracking-widest hover:bg-sky-500 hover:text-white transition-all shadow-sm">
                                    <LinkIcon size={12} /> Copy Link
                                  </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Pagination Controls */}
                    {filteredFiles.length > 0 && (
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
                              className="bg-sky-50 border-2 border-sky-100 rounded-xl px-2 py-1 text-xs font-black text-slate-600 cursor-pointer focus:border-sky-400 outline-none"
                            >
                              <option value={8}>8</option>
                              <option value={12}>12</option>
                              <option value={24}>24</option>
                              <option value={48}>48</option>
                            </select>
                          </div>
                          
                          <div className="h-6 w-px bg-slate-100" />
                          
                          <div className="flex items-center gap-4">
                            <button 
                              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                              disabled={currentPage === 1}
                              className="squishy w-10 h-10 neo-sm rounded-xl flex items-center justify-center text-slate-400 hover:text-sky-500 disabled:opacity-20 disabled:cursor-not-allowed transition-all border border-white"
                            >
                              <ArrowLeft size={18} />
                            </button>
                            
                            <div className="flex flex-col items-center min-w-[80px]">
                              <span className="text-[9px] font-black text-slate-300 uppercase tracking-widest mb-0.5">Page</span>
                              <span className="text-sm font-black text-slate-700">{currentPage} <span className="text-slate-300 font-bold mx-1">/</span> {totalPages}</span>
                            </div>
                            
                            <button 
                              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                              disabled={currentPage === totalPages}
                              className="squishy w-10 h-10 neo-sm rounded-xl flex items-center justify-center text-slate-400 hover:text-sky-500 disabled:opacity-20 disabled:cursor-not-allowed transition-all border border-white"
                            >
                              <ArrowRight size={18} />
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            )}

            {page === 'groups' && (
              <div className="animate-in fade-in duration-500">
                <div className="flex items-center justify-between mb-7">
                  <h1 className="text-4xl font-black text-slate-800 tracking-tight leading-none uppercase italic">Groups</h1>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {groups.map((group, i) => {
                    const fc = files.filter(f => f.group === group.name);
                    const ts = fc.reduce((a, f) => a + f.size, 0);
                    return (
                      <div key={group.id} className="file-card group rounded-[2.5rem] overflow-hidden flex flex-col h-full bg-white transition-all hover:scale-105">
                        <div className={cn("relative h-32 flex items-center justify-center", GROUP_PALETTE[i % GROUP_PALETTE.length])}>
                          <span className="text-6xl drop-shadow-xl z-10">{group.emoji}</span>
                        </div>
                        <div className="p-6 flex flex-col flex-1">
                          <h3 className="text-xl font-black text-slate-800 uppercase italic tracking-tighter mb-1 truncate">{group.name}</h3>
                          <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest mb-6">Total weight: {fmtSz(ts)}</p>
                        </div>
                      </div>
                    );
                  })}
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
            <div className="border-4 border-dashed border-sky-100 rounded-[2.5rem] p-12 text-center mb-6 hover:border-sky-400 hover:bg-sky-50 transition-all cursor-pointer group" onClick={() => document.getElementById('upload-input')?.click()}>
              <div className="text-6xl mb-4 group-hover:scale-110 transition-transform">🚀</div>
              <p className="font-black text-slate-500 text-sm uppercase tracking-widest">Drop files or <span className="text-sky-500 underline">Browse</span></p>
              <input id="upload-input" type="file" multiple className="hidden" onChange={(e) => setPendingFiles(Array.from(e.target.files || []))} />
            </div>
            {pendingFiles.length > 0 && (
              <div className="space-y-2 mb-6 max-h-40 overflow-y-auto custom-scrollbar pr-2">
                {pendingFiles.map((f, i) => (
                  <div key={i} className="flex items-center gap-3 bg-sky-50 border border-sky-100 rounded-xl px-4 py-2 shadow-sm">
                    <span className="text-xl">{emoF(f.name)}</span>
                    <span className="flex-1 text-xs font-black text-slate-600 truncate">{f.name}</span>
                    <span className="text-[9px] font-black text-slate-400">{fmtSz(f.size)}</span>
                  </div>
                ))}
              </div>
            )}
            <button onClick={handleUpload} className="w-full py-5 bg-black text-white rounded-[2rem] font-black uppercase tracking-[0.2em] text-sm shadow-[6px_6px_0_0_#0ea5e9] hover:bg-slate-800 transition-all active:translate-y-1 active:shadow-none flex items-center justify-center gap-3">
              <Upload size={20} /> Deploy to IPFS
            </button>
          </div>
        </div>
      )}

      {/* Toast Host */}
      <div className="fixed bottom-10 right-10 z-[200] flex flex-col gap-3 pointer-events-none">
        {toasts.map(t => (
          <div key={t.id} className={cn("pointer-events-auto flex items-center gap-3 px-6 py-4 rounded-[1.5rem] border-4 border-black font-black text-xs uppercase tracking-widest shadow-[6px_6px_0_0_rgba(0,0,0,1)] animate-in slide-in-from-right-4 duration-300", 
            t.type === 'success' ? 'bg-green-400 text-black' : t.type === 'error' ? 'bg-red-400 text-white' : 'bg-white')}>
            {t.type === 'success' ? <CheckCircle size={18} /> : t.type === 'error' ? <AlertCircle size={18} /> : <Database size={18} />}
            {t.message}
          </div>
        ))}
      </div>

      <PageFooter />
    </div>
  );
}
