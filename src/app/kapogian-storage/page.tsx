'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { 
  File as FileIcon, 
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
  Plus,
  Hash,
  Eye,

} from 'lucide-react';
import { cn } from '@/lib/utils';
import { PageHeader } from '@/components/kapogian/page-header';
import { PageFooter } from '@/components/kapogian/page-footer';
import { StorageGate } from '@/components/kapogian/StorageGate';
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
  } catch { return d; }
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

const GROUP_EMOJIS = ['📁', '🛍️', '🎞️', '🖼️', '🎨', '🔥', '⭐', '🌐', '🎵', '📦', '💎', '🏆'];

export default function KapogianStoragePage() {
  const [mounted, setMounted] = useState(false);
  const [unlocked, setUnlocked] = useState(false);
  const [page, setPage] = useState<'files' | 'groups'>('files');
  const [activeTab, setActiveTab] = useState<'public' | 'private'>('public');
  const [typeFilter, setTypeFilter] = useState<'all' | 'image' | 'gif' | 'other'>('all');
  const [groupFilter, setGroupFilter] = useState<string | null>(null); 
  const [view, setView] = useState<'grid' | 'list'>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortOption, setSortOption] = useState('date-desc');
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(12);
  
  const [files, setFiles] = useState<KapoFile[]>([]);
  const [groups, setGroups] = useState<KapoGroup[]>([]);
  const [isLoadingFiles, setIsLoadingFiles] = useState(true);
  const [isLoadingGroups, setIsLoadingGroups] = useState(true);
  const [toasts, setToasts] = useState<{ id: number; message: string; type: 'info' | 'success' | 'error' }[]>([]);
  
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [groupModalOpen, setGroupModalOpen] = useState(false);
  
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);
  const [uploadGroup, setUploadGroup] = useState(""); 
  const [uploadVis, setUploadVis] = useState<'public' | 'private'>('public');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const [newGroupName, setNewGroupName] = useState("");
  const [newGroupEmoji, setNewGroupEmoji] = useState("📁");

  useEffect(() => {
    setMounted(true);
    fetchFiles();
    fetchGroups();
  }, []);

  const addToast = (message: string, type: 'info' | 'success' | 'error' = 'info') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 2500);
  };

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
      }
    } catch (err) {
      console.error(err);
      addToast("Failed to sync storage", "error");
    } finally {
      setIsLoadingFiles(false);
    }
  };

  const fetchGroups = async () => {
    setIsLoadingGroups(true);
    try {
      const res = await fetch('/api/pinata/groups');
      const data = await res.json();
      const savedEmojis = typeof window !== 'undefined' ? localStorage.getItem('kapo-group-emojis') : null;
      const emojiMap = savedEmojis ? JSON.parse(savedEmojis) : {};
      if (data.data) {
        const list = Array.isArray(data.data) ? data.data : (data.data.groups || []);
        const parsed: KapoGroup[] = list.map((g: any) => ({
          id: g.id,
          name: g.name,
          emoji: emojiMap[g.id] || '📁',
          date: g.createdAt || g.created_at || new Date().toISOString(),
          vis: 'public'
        }));
        setGroups(parsed);
      }
    } catch (err) {
      console.error(err);
      addToast('Failed to load groups', 'error');
    } finally {
      setIsLoadingGroups(false);
    }
  };

  const saveGroup = async () => {
    if (!newGroupName.trim()) return addToast('Name required', 'error');
    setIsLoadingGroups(true);
    try {
      const res = await fetch('/api/pinata/groups', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newGroupName.trim() })
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      const realId = data.data.id;
      const savedEmojis = JSON.parse(localStorage.getItem('kapo-group-emojis') || '{}');
      savedEmojis[realId] = newGroupEmoji;
      localStorage.setItem('kapo-group-emojis', JSON.stringify(savedEmojis));
      const newG: KapoGroup = {
        id: realId,
        name: data.data.name,
        emoji: newGroupEmoji,
        date: data.data.createdAt || new Date().toISOString(),
        vis: 'public'
      };
      setGroups(prev => [newG, ...prev]);
      setNewGroupName("");
      setGroupModalOpen(false);
      addToast(`Group "${newG.name}" created!`, 'success');
    } catch (err: any) {
      addToast(err.message || 'Failed to create group', 'error');
    } finally {
      setIsLoadingGroups(false);
    }
  };

  const deleteGroup = async (id: string) => {
    try {
      const res = await fetch(`/api/pinata/groups/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Delete failed');
      setGroups(prev => prev.filter(g => g.id !== id));
      addToast('Group deleted', 'success');
    } catch {
      addToast('Failed to delete group', 'error');
    }
  };

  const copyText = (text: string, label: string = "Value") => {
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

  // ✅ Same pattern as generate page — POST with FormData directly to server
  const handleUpload = async () => {
    if (pendingFiles.length === 0) return addToast('No files selected', 'error');
    setIsUploading(true);
    setUploadProgress(0);
    try {
      for (let i = 0; i < pendingFiles.length; i++) {
        const file = pendingFiles[i];
        const uploadForm = new FormData();
        uploadForm.append("file", file, file.name);
        uploadForm.append("name", file.name);
        const uploadRes = await fetch("/api/pinata/upload", {
          method: "POST",
          body: uploadForm,
        });
        if (!uploadRes.ok) {
          const err = await uploadRes.json().catch(() => ({}));
          throw new Error(err.error || "IPFS upload failed");
        }
        setUploadProgress(Math.round(((i + 1) / pendingFiles.length) * 100));
      }
      await fetchFiles();
      setUploadModalOpen(false);
      setPendingFiles([]);
      setUploadGroup("");
      setUploadProgress(0);
      addToast(`${pendingFiles.length} file${pendingFiles.length > 1 ? 's' : ''} uploaded!`, 'success');
    } catch (err: any) {
      addToast(err.message || "Upload failed", "error");
    } finally {
      setIsUploading(false);
    }
  };

  const closeUploadModal = () => {
    if (isUploading) return; // prevent closing while uploading
    setUploadModalOpen(false);
    setPendingFiles([]);
    setUploadGroup("");
    setUploadProgress(0);
  };

  const deleteFile = async (id: string) => {
    try {
      const res = await fetch("/api/pinata/unpin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ hash: id })
      });
      if (!res.ok) throw new Error("Unpin failed");
      setFiles(prev => prev.filter(f => f.id !== id));
      addToast('File unpinned', 'success');
    } catch {
      addToast("Unpin failed", "error");
    }
  };

  const navigateToGroup = (groupId: string) => {
    setGroupFilter(groupId);
    setPage('files');
    setCurrentPage(1);
    const g = groups.find(x => x.id === groupId);
    addToast(`Viewing group: ${g?.name || 'Collection'}`, 'info');
  };

  if (!mounted) return null;
  if (!unlocked) {
    return <StorageGate onUnlocked={() => setUnlocked(true)} />;
  }

  return (
    <div className="bg-gradient-to-br from-sky-50 via-white to-amber-50 text-slate-700 min-h-screen font-body selection:bg-sky-200 selection:text-blue-900">
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes blob-pulse { 0%,100%{transform:scale(1);opacity:.4} 50%{transform:scale(1.08);opacity:.6} }
        @keyframes card-in    { from{transform:translateY(18px) scale(.97);opacity:0} to{transform:translateY(0) scale(1);opacity:1} }
        @keyframes float      { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-10px)} }
        .animate-blob { animation: blob-pulse 8s infinite; }
        .neo { background: rgba(255, 255, 255, 0.7); backdrop-filter: blur(16px); border: 2px solid rgba(255, 255, 255, 0.9); box-shadow: 0 10px 30px rgba(186, 230, 253, 0.4); }
        .neo-sm { background: rgba(255, 255, 255, 0.8); backdrop-filter: blur(12px); border: 2px solid rgba(255, 255, 255, 0.95); box-shadow: 0 4px 15px rgba(186, 230, 253, 0.25); }
        .sidebar { background: rgba(255, 255, 255, 0.85); backdrop-filter: blur(24px); border-right: 2px solid rgba(255, 255, 255, 0.9); box-shadow: 4px 0 24px rgba(186, 230, 253, 0.3); z-index: 40; }
        .file-card { background: linear-gradient(145deg, rgba(255,255,255,0.95), rgba(240,249,255,0.8)); backdrop-filter: blur(12px); border: 3px solid #fff; transition: all .35s cubic-bezier(.34,1.56,.64,1); animation: card-in .4s cubic-bezier(.34,1.56,.64,1) both; box-shadow: 0 8px 24px rgba(186, 230, 253, 0.25); border-radius: 2.5rem; }
        .file-card:hover { transform: translateY(-10px) scale(1.02); border-color: rgba(56, 189, 248, 0.4); box-shadow: 0 20px 40px -5px rgba(56, 189, 248, 0.35); }
        .squishy { transition: transform .15s cubic-bezier(.34,1.56,.64,1); cursor: pointer; }
        .squishy:active { transform: scale(.85) rotate(-3deg); }
        .nav-item { transition: all .25s cubic-bezier(.34,1.56,.64,1); cursor: pointer; border: 2px solid transparent; }
        .nav-item.active { background: linear-gradient(135deg, rgba(56,189,248,0.15), rgba(253,1ba,116,0.1)); color: #0284c7; border-color: rgba(56,189,248,0.3); box-shadow: 0 4px 15px rgba(56,189,248,0.15); }
        .tab-btn { position: relative; padding-bottom: 8px; font-weight: 800; font-size: .875rem; color: #94a3b8; transition: color .2s; }
        .tab-btn::after { content: ''; position: absolute; bottom: 0; left: 0; width: 0; height: 3px; background: linear-gradient(90deg, #38bdf8, #fbbf24); border-radius: 99px; transition: width .3s cubic-bezier(.34,1.56,.64,1); }
        .tab-btn.active { color: #0f172a; }
        .tab-btn.active::after { width: 100%; }
        .modal-box { background: rgba(255, 255, 255, 0.95); backdrop-filter: blur(24px); border: 4px solid #fff; box-shadow: 0 25px 50px -12px rgba(14, 165, 233, 0.3); }
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #bae6fd; border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #7dd3fc; }
` }} />

      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute top-6 left-6 w-96 h-96 bg-sky-300 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob" />
        <div className="absolute top-16 right-8 w-80 h-80 bg-amber-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob" style={{ animationDelay: '2.5s' }} />
      </div>

      <PageHeader />

      <div className="relative z-10 flex min-h-screen pt-20">
        <aside className="sidebar fixed top-20 left-0 h-[calc(100vh-5rem)] w-52 z-40 flex flex-col py-7 px-3 hidden lg:flex">
          <div className="flex items-center gap-2.5 px-3 mb-7">
<img src="/images/KapogianLogo.webp" alt="Kapogian" className="w-8 h-8 object-contain" />              <div>
              <div className="text-[11px] font-black text-slate-800 uppercase tracking-tight leading-none">KAPOGIAN</div>
              <div className="text-[10px] font-extrabold text-sky-500 tracking-widest uppercase mt-0.5">STORAGE</div>
            </div>
          </div>
          <nav className="flex-1 space-y-1">
            <button onClick={() => setPage('files')} className={cn("w-full nav-item flex items-center gap-3 px-4 py-2.5 rounded-2xl font-black text-xs transition-all border-2 border-transparent", page === 'files' ? "active" : "text-slate-400 hover:bg-slate-50")}>
              <FileIcon className={cn("w-4 h-4", page === 'files' ? "text-sky-50" : "text-slate-600")} />
              Files
            </button>
            <button onClick={() => setPage('groups')} className={cn("w-full nav-item flex items-center gap-3 px-4 py-2.5 rounded-2xl font-black text-xs transition-all border-2 border-transparent", page === 'groups' ? "active" : "text-slate-400 hover:bg-slate-50")}>
              <FolderOpen className={cn("w-4 h-4", page === 'groups' ? "text-sky-50" : "text-slate-600")} />
              Groups
              <span className="ml-auto bg-sky-100 text-sky-400 text-[10px] font-black px-2 py-0.5 rounded-full">{groups.length}</span>
            </button>
          </nav>
        </aside>

        <main className="flex-1 lg:ml-52 min-w-0">
          <div className="max-w-6xl mx-auto px-5 pt-10 pb-28">
            
            <div className="flex items-center justify-between mb-7 flex-wrap gap-4 pl-12 lg:pl-0">
              <div className="flex items-center gap-4">
                <h1 className="text-4xl font-black text-slate-800 drop-shadow-sm tracking-tight leading-none uppercase">
                  {page === 'files' ? '☁️ Files' : '🎈 Groups'}
                </h1>
                {page === 'files' && groupFilter && (
                  <div className="flex items-center gap-2 bg-sky-50 border border-sky-100 px-3 py-1.5 rounded-2xl shadow-sm">
                    <span className="text-[10px] font-black text-sky-500 uppercase tracking-widest">Group:</span>
                    <span className="text-xs font-black text-sky-400 uppercase italic">
                      {groups.find(g => g.id === groupFilter)?.name || 'Selected'}
                    </span>
                    <button onClick={() => setGroupFilter(null)} className="w-5 h-5 flex items-center justify-center rounded-full bg-sky-100 text-sky-500 hover:bg-red-500 hover:text-white transition-all">
                      <X size={10} />
                    </button>
                  </div>
                )}
              </div>
              <div className="flex gap-2">
                <button onClick={() => { fetchFiles(); fetchGroups(); }} className="squishy bg-white border border-slate-100 rounded-2xl w-12 h-12 flex items-center justify-center text-slate-400 hover:text-sky-500 transition-all shadow-sm">
                  <RefreshCw size={18} className={isLoadingFiles || isLoadingGroups ? "animate-spin" : ""} />
                </button>
                <button 
                  onClick={() => page === 'files' ? setUploadModalOpen(true) : setGroupModalOpen(true)} 
                  className="squishy bg-sky-500 text-white font-black px-6 py-3 rounded-full text-xs flex items-center gap-2 hover:bg-sky-400 transition-all uppercase tracking-widest shadow-[6px_6px_0_0_#bae6fd]"
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
                  ? `Public assets permanently pinned via Pinata Groups API.` 
                  : `Private assets encrypted for administrative vault access.`}
              </p>
              <div className="relative w-full max-w-sm">
                <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-600" />
                <input 
                  type="text" 
                  placeholder={`Search IPFS manifests…`} 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-white border border-slate-100 rounded-xl pl-10 pr-4 py-2 text-sm font-medium focus:border-indigo-300 outline-none transition-all shadow-sm"
                />
              </div>
            </div>

            {page === 'files' ? (
              <div className="animate-in fade-in duration-500">
                {isLoadingFiles ? (
                  <div className="flex flex-col items-center justify-center py-32 gap-4">
                    <LoaderCircle size={48} className="animate-spin text-sky-500" />
                    <p className="font-black uppercase tracking-widest text-slate-400">Syncing with Pinata...</p>
                  </div>
                ) : currentFiles.length === 0 ? (
                  <div className="text-center py-32 opacity-40">
                    <Database size={64} className="mx-auto mb-4 text-slate-700" />
                    <p className="font-black uppercase tracking-widest text-slate-400">Empty Chamber</p>
                  </div>
                ) : (
                  <>
                    <div className={cn(view === 'grid' ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6" : "space-y-3")}>
                      {currentFiles.map((file) => (
                        <div key={file.id} className="file-card group rounded-[2.5rem] overflow-hidden">
                          <div className={cn("relative h-48 flex items-center justify-center overflow-hidden", thCls(file.name))}>
                            <div className="absolute inset-0 opacity-20 bg-[radial-gradient(#000_1px,transparent_1px)] [background-size:12px_12px]" />
                            {tyGrp(file.name) === 'image' || tyGrp(file.name) === 'gif' ? (
                              <img src={file.url} alt={file.name} className="w-full h-full object-contain p-3 transition-transform duration-500 group-hover:scale-110" loading="lazy" />
                            ) : (
                              <span className="text-6xl drop-shadow-[6px_6px_0_0_#bae6fd] group-hover:scale-110 transition-transform duration-500">{emoF(file.name)}</span>
                            )}
                            <button onClick={() => deleteFile(file.id)} className="absolute top-4 right-4 w-8 h-8 bg-red-500 text-white rounded-xl flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-[6px_6px_0_0_#bae6fd]">
                              <Trash2 size={14} />
                            </button>
                          </div>
                          <div className="p-5 bg-white space-y-3">
                            <div>
                              <p className="text-[10px] font-black text-slate-400 uppercase mb-0.5">Name</p>
                              <p className="font-black text-slate-800 text-sm truncate uppercase">{file.name}</p>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <p className="text-[9px] font-black text-slate-400 uppercase mb-0.5 flex items-center gap-1"><HardDrive size={10} /> Size</p>
                                <p className="font-bold text-slate-600 text-[11px]">{fmtSz(file.size)}</p>
                              </div>
                              <div>
                                <p className="text-[9px] font-black text-slate-400 uppercase mb-0.5 flex items-center gap-1"><Calendar size={10} /> Date</p>
                                <p className="font-bold text-slate-600 text-[11px]">{fmtDt(file.date)}</p>
                              </div>
                            </div>
                            <div className="space-y-2">
                              <div>
                                <p className="text-[9px] font-black text-slate-400 uppercase mb-1 flex items-center gap-1"><Copy size={10} /> CID</p>
                                <div onClick={() => copyText(file.cid, "CID")} className="flex items-center gap-2 bg-slate-50 border border-slate-100 rounded-lg px-2 py-1.5 cursor-pointer hover:bg-sky-50 transition-colors">
                                  <span className="font-mono text-[9px] text-slate-400 truncate flex-1 uppercase">{sCID(file.cid)}</span>
                                  <Copy size={10} className="text-slate-700" />
                                </div>
                              </div>
                              <div>
                                <p className="text-[9px] font-black text-slate-400 uppercase mb-1 flex items-center gap-1"><Hash size={10} /> File ID</p>
                                <div onClick={() => copyText(file.id, "ID")} className="flex items-center gap-2 bg-slate-50 border border-slate-100 rounded-lg px-2 py-1.5 cursor-pointer hover:bg-sky-50 transition-colors">
                                  <span className="font-mono text-[9px] text-slate-400 truncate flex-1 uppercase">{sCID(file.id)}</span>
                                  <Copy size={10} className="text-slate-700" />
                                </div>
                              </div>
                            </div>
                            <button onClick={() => copyText(file.url, "URL")} className="w-full h-9 bg-sky-50 rounded-xl flex items-center justify-center gap-2 border border-sky-100 text-sky-500 font-black text-[10px] uppercase tracking-widest hover:bg-sky-500 hover:text-white transition-all shadow-sm">
                              <LinkIcon size={12} /> Copy Link
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="mt-12 flex justify-center">
                      <div className="neo-sm rounded-2xl px-6 py-3 border-2 border-white flex items-center gap-6">
                        <select value={rowsPerPage} onChange={(e) => { setRowsPerPage(Number(e.target.value)); setCurrentPage(1); }} className="bg-sky-50 border border-sky-100 rounded-xl px-2 py-1 text-xs font-black text-slate-600">
                          <option value={8}>8</option><option value={12}>12</option><option value={24}>24</option>
                        </select>
                        <div className="flex gap-4 items-center">
                          <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className="squishy w-10 h-10 neo-sm rounded-xl flex items-center justify-center text-slate-400 hover:text-sky-500 disabled:opacity-20 border-2 border-white">
                            <ArrowLeft size={18} />
                          </button>
                          <span className="text-sm font-black text-slate-700 font-mono">{currentPage} / {totalPages}</span>
                          <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className="squishy w-10 h-10 neo-sm rounded-xl flex items-center justify-center text-slate-400 hover:text-sky-500 disabled:opacity-20 border-2 border-white">
                            <ArrowRight size={18} />
                          </button>
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </div>
            ) : (
              <div className="animate-in fade-in duration-500">
                {isLoadingGroups ? (
                  <div className="flex flex-col items-center justify-center py-32 gap-4">
                    <LoaderCircle size={48} className="animate-spin text-sky-500" />
                    <p className="font-black uppercase tracking-widest text-slate-400">Syncing Groups...</p>
                  </div>
                ) : filteredGroups.length === 0 ? (
                  <div className="text-center py-32 opacity-40">
                    <FolderOpen size={64} className="mx-auto mb-4 text-slate-700" />
                    <p className="font-black uppercase tracking-widest text-slate-400">No Groups Found</p>
                  </div>
                ) : (
                  <div className="bg-white border border-slate-100 rounded-[2.5rem] overflow-hidden shadow-sm">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-sky-50/50 border-b-2 border-slate-100 text-[10px] font-black uppercase text-slate-400 tracking-widest">
                          <th className="px-8 py-5">Group Name</th>
                          <th className="px-8 py-5">Created At</th>
                          <th className="px-8 py-5">Group ID</th>
                          <th className="px-8 py-5 text-center">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50">
                        {filteredGroups.map((group) => (
                          <tr key={group.id} className="hover:bg-slate-50 transition-colors group">
                            <td className="px-8 py-5">
                              <button onClick={() => navigateToGroup(group.id)} className="flex items-center gap-3 hover:translate-x-1 transition-transform group/btn">
                                <span className="text-2xl group-hover/btn:scale-110 transition-transform">{group.emoji}</span>
                                <span className="font-black text-slate-700 uppercase italic tracking-tighter underline decoration-2 decoration-sky-100 group-hover/btn:text-sky-500 group-hover/btn:decoration-sky-400">{group.name}</span>
                              </button>
                            </td>
                            <td className="px-8 py-5 text-slate-400 font-bold text-sm">{fmtDt(group.date)}</td>
                            <td className="px-8 py-5">
                              <div onClick={() => copyText(group.id, "Group ID")} className="flex items-center gap-2 bg-slate-50 border border-slate-100 rounded-xl px-3 py-1.5 cursor-pointer w-fit">
                                <span className="font-mono text-[10px] text-slate-400 uppercase">{sCID(group.id)}</span>
                                <Copy size={12} className="text-slate-700" />
                              </div>
                            </td>
                            <td className="px-8 py-5">
                              <div className="flex items-center justify-center gap-3">
                                <button onClick={() => deleteGroup(group.id)} className="w-9 h-9 rounded-xl bg-red-50 text-red-400 flex items-center justify-center hover:bg-red-500 hover:text-white transition-all shadow-sm">
                                  <Trash2 size={16} />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}
          </div>
        </main>
      </div>

      {/* Upload Modal */}
      {uploadModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={closeUploadModal} />
          <div className="modal-box relative bg-white border-2 border-white rounded-[3rem] p-8 max-w-lg w-full shadow-[12px_12px_0_0_#7dd3fc]">

            {/* Loading overlay */}
            {isUploading && (
              <div className="absolute inset-0 z-10 bg-white/90 backdrop-blur-sm rounded-[3rem] flex flex-col items-center justify-center gap-6">
                <div className="w-20 h-20 bg-blue-50 rounded-[2rem] border-4 border-sky-300 flex items-center justify-center shadow-[6px_6px_0_0_#bae6fd]">
                  <LoaderCircle className="animate-spin text-sky-500" size={40} />
                </div>
                <div className="text-center">
                  <p className="text-xl font-black uppercase tracking-tight text-slate-800 italic">Deploying to IPFS...</p>
                  <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest mt-1">
                    {pendingFiles.length > 1 ? `${uploadProgress}% — please wait` : 'Pinning your asset'}
                  </p>
                </div>
                {pendingFiles.length > 1 && (
                  <div className="w-48 h-3 bg-white rounded-full border-2 border-slate-200 overflow-hidden">
                    <div
                      className="h-full bg-sky-500 rounded-full transition-all duration-300"
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                )}
              </div>
            )}

            <div className="flex items-center justify-between mb-8">
              <h3 className="text-2xl font-black text-slate-800 uppercase italic tracking-tight">Upload Asset</h3>
              <button onClick={closeUploadModal} disabled={isUploading} className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 hover:bg-red-500 hover:text-white transition-all shadow-sm disabled:opacity-30">✕</button>
            </div>

            {/* Drop zone */}
            <div
              onClick={() => !isUploading && document.getElementById('file-input-up')?.click()}
              className={cn(
                "border-2 border-dashed border-sky-100 rounded-[2.5rem] p-6 text-center mb-6 transition-all",
                isUploading ? "border-indigo-200 bg-blue-50 cursor-not-allowed" : "border-sky-100 hover:border-sky-400 hover:bg-sky-50 cursor-pointer group"
              )}
            >
              {pendingFiles.length === 0 ? (
                <>
                  <div className="text-5xl mb-3 group-hover:scale-110 transition-transform">🚀</div>
                  <p className="font-black text-slate-500 text-sm uppercase tracking-widest">Browse Files</p>
                  <p className="text-[10px] text-slate-600 font-bold mt-1">Click to select one or more files</p>
                </>
              ) : (
                <div>
                  <p className="font-black text-sky-500 text-sm uppercase tracking-widest mb-4">
                    {pendingFiles.length} file{pendingFiles.length > 1 ? 's' : ''} selected — click to change
                  </p>
                  {/* Image previews grid */}
                  <div className="grid grid-cols-3 gap-3">
                    {pendingFiles.map((f, i) => {
                      const isImage = f.type.startsWith('image/');
                      const previewUrl = isImage ? URL.createObjectURL(f) : null;
                      return (
                        <div key={i} className="relative group/preview">
                          <div className="aspect-square rounded-2xl border border-slate-100 overflow-hidden bg-slate-50 flex items-center justify-center">
                            {previewUrl ? (
                              <img src={previewUrl} alt={f.name} className="w-full h-full object-cover" />
                            ) : (
                              <span className="text-3xl">{emoF(f.name)}</span>
                            )}
                          </div>
                          <p className="text-[9px] font-mono text-slate-400 truncate mt-1 text-center">{f.name}</p>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
              <input
                id="file-input-up"
                type="file"
                multiple
                className="hidden"
                onChange={(e) => setPendingFiles(Array.from(e.target.files || []))}
              />
            </div>

            <div className="grid grid-cols-2 gap-3 mb-6">
              <div>
                <label className="block text-[10px] font-black text-slate-400 mb-1 uppercase tracking-widest ml-2">Visibility</label>
                <select value={uploadVis} onChange={(e) => setUploadVis(e.target.value as any)} disabled={isUploading} className="w-full h-12 bg-sky-50 border border-sky-100 rounded-2xl px-4 font-bold text-slate-700 text-sm outline-none focus:border-sky-400 disabled:opacity-50">
                  <option value="public">🌐 Public</option><option value="private">🔒 Private</option>
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-black text-slate-400 mb-1 uppercase tracking-widest ml-2">Group</label>
                <select value={uploadGroup || groupFilter || ""} onChange={(e) => setUploadGroup(e.target.value)} disabled={isUploading} className="w-full h-12 bg-sky-50 border border-sky-100 rounded-2xl px-4 font-bold text-slate-700 text-sm outline-none focus:border-sky-400 disabled:opacity-50">
                  <option value="">No Group</option>
                  {groups.map(g => (
                    <option key={g.id} value={g.id}>{g.emoji} {g.name}</option>
                  ))}
                </select>
              </div>
            </div>

            <button
              onClick={handleUpload}
              disabled={pendingFiles.length === 0 || isUploading}
              className="w-full py-5 bg-gradient-to-r from-sky-400 to-blue-500 text-white border-2 border-white border-0 rounded-[2rem] font-black uppercase tracking-[0.2em] text-sm shadow-[8px_8px_0_0_#38bdf8] hover:bg-slate-800 transition-all active:translate-y-1 flex items-center justify-center gap-3 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {isUploading
                ? <><LoaderCircle size={20} className="animate-spin" /> Uploading...</>
                : <><Upload size={20} /> Deploy to IPFS</>
              }
            </button>
          </div>
        </div>
      )}

      {/* New Group Modal */}
      {groupModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-md" onClick={() => setGroupModalOpen(false)} />
          <div className="modal-box relative bg-white border-2 border-white rounded-[3rem] p-8 max-w-sm w-full shadow-[12px_12px_0_0_#7dd3fc]">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-black text-slate-800">New Group 📂</h3>
              <button onClick={() => setGroupModalOpen(false)} className="w-9 h-9 bg-white rounded-full flex items-center justify-center font-bold text-slate-400 hover:bg-red-500 hover:text-white transition-all">✕</button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-[10px] font-black text-slate-400 mb-1 uppercase tracking-widest ml-2">Group Name</label>
                <input type="text" value={newGroupName} onChange={(e) => setNewGroupName(e.target.value)} placeholder="e.g. shop-assets" className="w-full h-12 bg-sky-50 border border-sky-100 rounded-2xl px-4 font-bold text-slate-700 text-sm outline-none focus:border-sky-300" />
              </div>
              <div>
                <label className="block text-[10px] font-black text-slate-400 mb-2 uppercase tracking-widest ml-2">Emoji Badge</label>
                <div className="grid grid-cols-6 gap-2">
                  {GROUP_EMOJIS.map(e => (
                    <button key={e} onClick={() => setNewGroupEmoji(e)} className={cn("w-10 h-10 rounded-xl flex items-center justify-center text-xl border-2 transition-all", newGroupEmoji === e ? "bg-blue-50 border-sky-300 shadow-sm" : "bg-slate-50 border-slate-100 hover:border-slate-200")}>{e}</button>
                  ))}
                </div>
              </div>
              <div className="pt-4 flex gap-3">
                <button onClick={() => setGroupModalOpen(false)} className="flex-1 h-12 bg-white text-slate-500 font-black rounded-2xl text-xs uppercase tracking-widest">Cancel</button>
                <button onClick={saveGroup} className="flex-1 h-12 bg-sky-500 text-white font-black rounded-2xl shadow-[6px_6px_0_0_#bae6fd] text-xs uppercase tracking-widest">Create</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Toast Host */}
      <div className="fixed bottom-10 right-10 z-[200] flex flex-col gap-3 pointer-events-none">
        {toasts.map(t => (
          <div key={t.id} className={cn("pointer-events-auto flex items-center gap-3 px-6 py-4 rounded-[1.5rem] border-2 border-white font-black text-xs uppercase tracking-widest shadow-[6px_6px_0_0_#bae6fd] animate-in slide-in-from-right-4 duration-300", t.type === 'success' ? 'bg-green-400 text-black' : t.type === 'error' ? 'bg-red-400 text-white' : 'bg-white')}>
            {t.type === 'success' ? <CheckCircle size={18} /> : t.type === 'error' ? <AlertCircle size={18} /> : <Database size={18} />}
            {t.message}
          </div>
        ))}
      </div>

      <PageFooter />
    </div>
  );
}