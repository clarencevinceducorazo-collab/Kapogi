'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  File, 
  FolderOpen, 
  PlusCircle, 
  Search, 
  LayoutGrid, 
  List, 
  Trash2, 
  MoreHorizontal, 
  Copy, 
  Eye, 
  Link as LinkIcon, 
  Pencil, 
  Upload, 
  Globe, 
  Plus, 
  ArrowLeft, 
  ArrowRight, 
  LoaderCircle, 
  CheckCircle, 
  AlertCircle, 
  Folder, 
  X,
  Clock,
  MoreVertical,
  Database,
  Hash,
  Calendar,
  Smartphone,
  ShieldCheck,
  Check as CheckIcon,
  HardDrive,
  RefreshCw
} from 'lucide-react';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import { PageHeader } from '@/components/kapogian/page-header';
import { PageFooter } from '@/components/kapogian/page-footer';

// ─── Constants & Types ────────────────────────────────────────────────────────

const ITEMS_PER_PAGE_OPTIONS = [8, 12, 24];
const GROUP_EMOJIS = ['📁', '🛍️', '🎞️', '🖼️', '🎨', '🔥', '⭐', '🌐', '🎵', '📦', '💎', '🏆'];
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
    return date.toLocaleDateString();
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

// ─── Main Component ───────────────────────────────────────────────────────────

export default function KapogianStoragePage() {
  const [page, setPage] = useState<'files' | 'groups'>('files');
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'public' | 'private'>('public');
  const [typeFilter, setTypeFilter] = useState<'all' | 'image' | 'gif' | 'other'>('all');
  const [view, setView] = useState<'grid' | 'list'>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortOption, setSortOption] = useState('date-desc');
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(12);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  
  // Data State
  const [files, setFiles] = useState<KapoFile[]>([]);
  const [groups, setGroups] = useState<KapoGroup[]>([]);
  const [isLoadingFiles, setIsLoadingFiles] = useState(true);

  // UI State
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [renameModalOpen, setRenameModalOpen] = useState(false);
  const [groupModalOpen, setGroupModalOpen] = useState(false);
  
  const [renamingFileId, setRenamingFileId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState('');
  
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);
  const [uploadVisibility, setUploadVisibility] = useState<'public' | 'private'>('public');
  const [uploadGroup, setUploadGroup] = useState('');
  
  const [newGroupName, setNewGroupName] = useState('');
  const [newGroupEmoji, setNewGroupEmoji] = useState('📁');

  const [activeDropdownId, setActiveDropdownId] = useState<string | null>(null);

  // ─── Data Fetching ──────────────────────────────────────────────────────────

  const fetchFiles = async () => {
    setIsLoadingFiles(true);
    try {
      const res = await fetch("/api/pinata/list");
      if (!res.ok) throw new Error("Failed to fetch from Pinata");
      const data = await res.json();
      if (data.files) {
        const parsedFiles: KapoFile[] = data.files.map((f: any) => ({
          id: f.ipfsHash, // Use IPFS Hash as stable ID
          name: f.name,
          cid: f.ipfsHash,
          size: f.size || 0,
          date: f.date || new Date().toISOString(),
          vis: 'public', // Pinata files are generally public via gateway
          group: f.group || '',
          url: f.url
        }));
        setFiles(parsedFiles);

        // Auto-generate groups based on found metadata
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

  // ─── Logic ──────────────────────────────────────────────────────────────────

  const addToast = (message: string, type: Toast['type'] = 'info') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 2500);
  };

  const copyText = (text: string) => {
    navigator.clipboard.writeText(text)
      .then(() => addToast('Copied to clipboard!', 'success'))
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

  const clearSelection = () => setSelectedIds(new Set());

  const bulkDelete = async () => {
    if (selectedIds.size === 0) return;
    const idsToDelete = Array.from(selectedIds);
    addToast(`Starting bulk unpin of ${idsToDelete.length} files...`, 'info');
    
    let successCount = 0;
    for (const hash of idsToDelete) {
      try {
        const res = await fetch("/api/pinata/unpin", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ hash })
        });
        if (res.ok) successCount++;
      } catch (err) {
        console.error("Failed to unpin", hash, err);
      }
    }

    setFiles(prev => prev.filter(f => !selectedIds.has(f.id)));
    addToast(`${successCount} files unpinned successfully`, 'success');
    clearSelection();
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
      const next = new Set(selectedIds);
      next.delete(id);
      setSelectedIds(next);
      addToast('File removed from IPFS', 'success');
    } catch (err) {
      console.error(err);
      addToast("Failed to delete file from Pinata", "error");
    }
    setActiveDropdownId(null);
  };

  const openRename = (file: KapoFile) => {
    setRenamingFileId(file.id);
    setRenameValue(file.name);
    setRenameModalOpen(true);
    setActiveDropdownId(null);
  };

  const saveRename = () => {
    if (!renameValue.trim() || !renamingFileId) return;
    setFiles(prev => prev.map(f => f.id === renamingFileId ? { ...f, name: renameValue.trim() } : f));
    setRenameModalOpen(false);
    setRenamingFileId(null);
    addToast('Renamed locally', 'success');
  };

  const handleUpload = async () => {
    if (pendingFiles.length === 0) {
      addToast('No files selected', 'error');
      return;
    }
    
    setIsLoadingFiles(true);
    addToast(`Uploading ${pendingFiles.length} manifests to IPFS...`, 'info');
    
    try {
      for (const file of pendingFiles) {
        const presignRes = await fetch("/api/pinata/upload");
        const { url } = await presignRes.json();
        
        const formData = new FormData();
        formData.append("file", file);
        
        const uploadRes = await fetch(url, { method: "POST", body: formData });
        if (!uploadRes.ok) throw new Error(`Upload failed for ${file.name}`);
      }
      
      await fetchFiles(); // Refresh list
      setUploadModalOpen(false);
      setPendingFiles([]);
      addToast(`All files deployed to IPFS! 🚀`, 'success');
    } catch (err) {
      console.error(err);
      addToast("One or more uploads failed", "error");
    } finally {
      setIsLoadingFiles(false);
    }
  };

  const saveGroup = () => {
    if (!newGroupName.trim()) return;
    const newGroup: KapoGroup = {
      id: RI(),
      name: newGroupName.trim(),
      emoji: newGroupEmoji,
      date: new Date().toISOString()
    };
    setGroups(prev => [...prev, newGroup]);
    setGroupModalOpen(false);
    setNewGroupName('');
    addToast(`Group "${newGroup.name}" created`, 'success');
  };

  const deleteGroup = (id: string) => {
    const g = groups.find(x => x.id === id);
    if (!g) return;
    setGroups(prev => prev.filter(x => x.id !== id));
    // Clear group from files
    setFiles(prev => prev.map(f => f.group === g.name ? { ...f, group: '' } : f));
    addToast('Group deleted', 'success');
  };

  const browseGroup = (groupName: string) => {
    setPage('files');
    setActiveTab('public');
    setSearchQuery(groupName);
    setTypeFilter('all');
    addToast(`Filtering by group: ${groupName}`, 'info');
  };

  return (
    <div className="bg-gradient-to-b from-amber-100 via-yellow-50 to-white text-slate-700 min-h-screen font-body selection:bg-blue-200 selection:text-pink-900">
      <style jsx global>{`
        @keyframes blob-pulse { 0%,100%{transform:scale(1);opacity:.4} 50%{transform:scale(1.08);opacity:.6} }
        @keyframes pop-in     { 0%{transform:scale(.72) translateY(36px);opacity:0} 70%{transform:scale(1.04) translateY(-3px)} 100%{transform:scale(1) translateY(0);opacity:1} }
        @keyframes fade-in    { from{opacity:0} to{opacity:1} }
        @keyframes card-in    { from{transform:translateY(18px) scale(.97);opacity:0} to{transform:translateY(0) scale(1);opacity:1} }
        @keyframes toast-in   { 0%{transform:translateY(18px) scale(.9);opacity:0} 70%{transform:translateY(-2px) scale(1.02)} 100%{transform:translateY(0) scale(1);opacity:1} }
        
        .animate-blob { animation: blob-pulse 9s infinite; }
        .neo { background:linear-gradient(145deg,#fff,#f0f4ff); box-shadow:8px 8px 18px #bcd4e6,-8px -8px 18px #fff; }
        .neo-sm { background:linear-gradient(145deg,#fff,#f8faff); box-shadow:5px 5px 12px #b8d4e8,-5px -5px 12px #fff; }
        .sidebar { background: linear-gradient(170deg,#ffffff 60%,#f0f8ff); box-shadow: 6px 0 28px rgba(209,217,230,.45); border-right: 2px solid rgba(255,255,255,.95); }
        .file-card { background:linear-gradient(145deg,#fff,#fffdf5); box-shadow:7px 7px 16px #ddd5c0,-7px -7px 16px #fff; border:2px solid rgba(255,255,255,.9); transition:all .32s cubic-bezier(.34,1.56,.64,1); animation:card-in .38s cubic-bezier(.34,1.56,.64,1) both; }
        .file-card:hover { transform:translateY(-8px) scale(1.025); box-shadow:12px 12px 28px #cfc7b0,-12px -12px 24px #fff; }
        .file-card.selected { background:linear-gradient(145deg,#eff6ff,#dbeafe); border-color:#38bdf8; }
        .list-card { background:linear-gradient(145deg,#fff,#fffdf5); box-shadow:5px 5px 12px #ddd5c0,-5px -5px 12px #fff; border:2px solid rgba(255,255,255,.9); transition:all .25s cubic-bezier(.34,1.56,.64,1); animation:card-in .3s cubic-bezier(.34,1.56,.64,1) both; }
        .list-card.selected { background:linear-gradient(145deg,#eff6ff,#dbeafe); border-color:#38bdf8; }
        .th-gif { background:linear-gradient(135deg,#fce7f3,#fbcfe8); }
        .th-png { background:linear-gradient(135deg,#e0f2fe,#bae6fd); }
        .th-jpg,.th-jpeg { background:linear-gradient(135deg,#dcfce7,#bbf7d0); }
        .th-svg { background:linear-gradient(135deg,#ede9fe,#ddd6fe); }
        .th-mp4 { background:linear-gradient(135deg,#fef9c3,#fef08a); }
        .th-pdf { background:linear-gradient(135deg,#fee2e2,#fecaca); }
        .th-zip { background:linear-gradient(135deg,#f1f5f9,#e2e8f0); }
        .th-json { background:linear-gradient(135deg,#f0fdf4,#dcfce7); }
        .th-webp { background:linear-gradient(135deg,#fff7ed,#fed7aa); }
        .th-def { background:linear-gradient(135deg,#f8fafc,#f1f5f9); }
        .squishy { transition:transform .13s cubic-bezier(.34,1.56,.64,1); cursor:pointer; }
        .squishy:active { transform:scale(.88); }
        .nav-item { transition:all .22s cubic-bezier(.34,1.56,.64,1); }
        .nav-item.active { background:linear-gradient(135deg,rgba(251,191,36,.2),rgba(249,115,22,.13)); color:#0284c7; border-color:rgba(251,191,36,.32); box-shadow:3px 3px 10px rgba(251,191,36,.18),-3px -3px 8px #fff; }
        .custom-scrollbar::-webkit-scrollbar { width: 7px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: #f0f8ff; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #bae6fd; border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #38bdf8; }
      `}</style>

      {/* Floating Background */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute top-6 left-6 w-80 h-80 bg-sky-300 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob" />
        <div className="absolute top-16 right-8 w-64 h-64 bg-blue-200 rounded-full mix-blend-multiply filter blur-3xl opacity-15 animate-blob" style={{ animationDelay: '2.5s' }} />
        <div className="absolute bottom-20 left-1/3 w-96 h-96 bg-indigo-100 rounded-full mix-blend-multiply filter blur-3xl opacity-15 animate-blob" style={{ animationDelay: '4s' }} />
      </div>

      <PageHeader />

      <div className="relative z-10 flex min-h-screen pt-20">
        {/* Sidebar */}
        <aside className="sidebar fixed top-20 left-0 h-[calc(100vh-5rem)] w-52 z-40 flex flex-col py-7 px-3 hidden lg:flex">
          <div className="flex items-center gap-2.5 px-3 mb-7">
            <span className="text-3xl animate-bounce inline-block leading-none">🪅</span>
            <div>
              <div className="text-[11px] font-black text-slate-800 uppercase tracking-tight">KAPOGIAN</div>
              <div className="text-[10px] font-extrabold text-sky-400 tracking-widest uppercase mt-0.5">STORAGE</div>
            </div>
          </div>

          <div className="mx-1 mb-6 bg-gradient-to-r from-sky-50 to-blue-50 border-2 border-sky-100 rounded-2xl px-3 py-2.5 flex items-center gap-2">
            <Globe className="text-sky-400 w-4 h-4 shrink-0" />
            <span className="text-[10px] font-bold text-slate-500 font-mono truncate flex-1">kapo-storage-gateway…</span>
            <button onClick={() => copyText('https://kapo-storage-gateway.kapogian.cloud')} className="squishy shrink-0">
              <Copy className="text-slate-300 w-3 h-3 hover:text-sky-400 transition-colors" />
            </button>
          </div>

          <nav className="flex-1 space-y-1">
            <div className="text-[10px] font-black text-slate-300 uppercase tracking-widest px-3 mb-2">Navigator</div>
            <button onClick={() => setPage('files')} className={cn("w-full nav-item flex items-center gap-3 px-4 py-2.5 rounded-2xl font-black text-xs transition-all border-2 border-transparent", page === 'files' ? "active" : "text-slate-400 hover:bg-amber-50 hover:translate-x-1")}>
              <File className={cn("w-4 h-4", page === 'files' ? "text-sky-500" : "text-slate-300")} />
              Files
            </button>
            <button onClick={() => setPage('groups')} className={cn("w-full nav-item flex items-center gap-3 px-4 py-2.5 rounded-2xl font-black text-xs transition-all border-2 border-transparent", page === 'groups' ? "active" : "text-slate-400 hover:bg-amber-50 hover:translate-x-1")}>
              <FolderOpen className={cn("w-4 h-4", page === 'groups' ? "text-sky-500" : "text-slate-300")} />
              Groups
              <span className="ml-auto bg-sky-100 text-sky-600 text-[9px] font-black px-2 py-0.5 rounded-full">{groups.length}</span>
            </button>
          </nav>

          <div className="mx-1 mt-4 neo-sm rounded-2xl p-3.5 border-2 border-white">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Storage</span>
              <span className="text-[9px] font-black text-sky-500">{fmtSz(files.reduce((a,f)=>a+f.size,0))} used</span>
            </div>
            <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
              <div className="h-full w-[12%] bg-gradient-to-r from-sky-400 to-blue-500 rounded-full transition-all duration-700" />
            </div>
            <p className="text-[8px] font-bold text-slate-300 mt-1.5 uppercase">IPFS Decentralized Vault</p>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 lg:ml-52 min-w-0">
          <div className="max-w-6xl mx-auto px-5 pt-10 pb-28">
            
            {page === 'files' && (
              <div className="animate-in fade-in duration-500">
                <div className="flex items-center justify-between mb-7 flex-wrap gap-4">
                  <div>
                    <h1 className="text-4xl font-black text-slate-800 tracking-tight leading-none uppercase italic">Files</h1>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Kapogian Cloud · IPFS Powered</p>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={fetchFiles} disabled={isLoadingFiles} className="squishy bg-white border-2 border-slate-100 rounded-2xl w-12 h-12 flex items-center justify-center text-slate-400 hover:text-sky-500 transition-all shadow-sm">
                      <RefreshCw size={18} className={isLoadingFiles ? "animate-spin" : ""} />
                    </button>
                    <button onClick={() => setUploadModalOpen(true)} className="squishy bg-gradient-to-r from-sky-400 to-blue-600 text-white font-black px-6 py-3 rounded-2xl text-xs flex items-center gap-2 hover:shadow-lg hover:shadow-sky-200 hover:-translate-y-0.5 transition-all uppercase tracking-widest shadow-[4px_4px_0_0_#0369a1]">
                      <PlusCircle size={18} /> Add New
                    </button>
                  </div>
                </div>

                <div className="flex gap-6 mb-6 border-b-4 border-slate-100">
                  <button onClick={() => setActiveTab('public')} className={cn("tab-btn pb-2 font-black text-xs uppercase tracking-widest transition-all relative", activeTab === 'public' ? "active text-slate-800" : "text-slate-400")}>
                    Public Vault
                    {activeTab === 'public' && <div className="absolute bottom-0 left-0 w-full h-1 bg-sky-400 rounded-t-full" />}
                  </button>
                  <button onClick={() => setActiveTab('private')} className={cn("tab-btn pb-2 font-black text-xs uppercase tracking-widest transition-all relative", activeTab === 'private' ? "active text-slate-800" : "text-slate-400")}>
                    Private (N/A)
                    {activeTab === 'private' && <div className="absolute bottom-0 left-0 w-full h-1 bg-sky-400 rounded-t-full" />}
                  </button>
                </div>

                <div className="neo rounded-[2.5rem] p-5 border-4 border-white mb-6 flex flex-col md:flex-row gap-4 items-stretch md:items-center justify-between flex-wrap">
                  <div className="flex items-center gap-4 flex-1">
                    <div className="relative flex-1 max-w-sm">
                      <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-300 w-4 h-4 pointer-events-none" />
                      <input 
                        type="text" 
                        placeholder="Search CIDs or names…" 
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full bg-sky-50 border-2 border-sky-100 rounded-2xl pl-10 pr-4 py-2.5 font-bold text-slate-700 placeholder-slate-300 text-sm focus:bg-white transition-all" 
                      />
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3 flex-wrap">
                    <div className="flex gap-1.5 p-1 bg-slate-50 rounded-2xl border-2 border-slate-100">
                      {(['all', 'image', 'gif', 'other'] as const).map(type => (
                        <button key={type} onClick={() => setTypeFilter(type)} className={cn("px-3 py-1.5 rounded-xl font-black text-[10px] uppercase transition-all", typeFilter === type ? "bg-sky-400 text-white shadow-md" : "text-slate-400 hover:text-slate-600")}>
                          {type}
                        </button>
                      ))}
                    </div>
                    
                    <select value={sortOption} onChange={(e) => setSortOption(e.target.value)} className="bg-sky-50 border-2 border-sky-100 rounded-2xl px-3 py-2 font-black text-slate-600 text-[10px] uppercase cursor-pointer outline-none">
                      <option value="date-desc">Newest</option>
                      <option value="date-asc">Oldest</option>
                      <option value="name-asc">A–Z</option>
                      <option value="size-desc">Largest</option>
                    </select>

                    <div className="neo-sm rounded-2xl p-1 flex gap-1 border-2 border-white">
                      <button onClick={() => setView('grid')} className={cn("squishy w-8 h-8 rounded-xl flex items-center justify-center transition-all", view === 'grid' ? "bg-sky-400 text-white shadow-sm" : "text-slate-300 hover:text-slate-500")}>
                        <LayoutGrid size={16} />
                      </button>
                      <button onClick={() => setView('list')} className={cn("squishy w-8 h-8 rounded-xl flex items-center justify-center transition-all", view === 'list' ? "bg-sky-400 text-white shadow-sm" : "text-slate-300 hover:text-slate-500")}>
                        <List size={16} />
                      </button>
                    </div>
                  </div>
                </div>

                {selectedIds.size > 0 && (
                  <div className="flex items-center gap-4 bg-white border-4 border-slate-100 rounded-2xl px-6 py-3 mb-6 shadow-sm animate-in slide-in-from-top-2">
                    <span className="text-xs font-black text-sky-600 uppercase tracking-widest">{selectedIds.size} Selected</span>
                    <button onClick={bulkDelete} className="squishy flex items-center gap-2 bg-red-50 text-red-500 px-4 py-1.5 rounded-xl border-2 border-red-100 font-black text-[10px] uppercase hover:bg-red-100 transition-all">
                      <Trash2 size={12} /> Delete All
                    </button>
                    <button onClick={clearSelection} className="ml-auto text-[10px] font-black text-slate-300 uppercase hover:text-slate-500 transition-colors">✕ Cancel</button>
                  </div>
                )}

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
                  <div className={cn(view === 'grid' ? "grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-6" : "space-y-3")}>
                    {currentFiles.map((file, i) => (
                      <div key={file.id} className={cn(
                        view === 'grid' ? "file-card group rounded-[2rem] overflow-hidden" : "list-card group rounded-[1.5rem] overflow-hidden",
                        selectedIds.has(file.id) && "selected"
                      )} style={{ animationDelay: `${i * 0.05}s` }}>
                        {view === 'grid' ? (
                          <div className="flex flex-col">
                            <div 
                              className={cn("relative h-36 flex items-center justify-center cursor-pointer", thCls(file.name))}
                              onClick={() => toggleSelection(file.id)}
                            >
                              <span className="text-5xl drop-shadow-lg group-hover:scale-110 transition-transform duration-500 select-none">
                                {emoF(file.name)}
                              </span>
                              <div className="absolute top-3 left-3">
                                <input 
                                  type="checkbox" 
                                  checked={selectedIds.has(file.id)}
                                  readOnly
                                  className="kapo-check checked:bg-sky-400" 
                                />
                              </div>
                              <div className="absolute bottom-3 left-3 bg-white/80 backdrop-blur-sm border border-white px-2 py-0.5 rounded-lg text-[8px] font-black uppercase text-slate-500 shadow-sm">
                                {ext(file.name)}
                              </div>
                              {file.group && (
                                <div className="absolute top-3 right-3 bg-white/80 backdrop-blur-sm border border-sky-100 px-2 py-0.5 rounded-lg text-[8px] font-black text-sky-500 shadow-sm truncate max-w-[80px]">
                                  {file.group}
                                </div>
                              )}
                            </div>
                            <div className="p-4 bg-white">
                              <p className="font-black text-slate-800 text-xs truncate mb-1 leading-tight">{file.name}</p>
                              <p className="font-mono text-[9px] text-slate-300 truncate mb-3">{sCID(file.cid)}</p>
                              <div className="flex items-center justify-between">
                                <span className="text-[9px] font-black text-slate-300 uppercase">{fmtDt(file.date)}</span>
                                <div className="flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                                  <button onClick={() => copyText(file.url)} className="squishy w-7 h-7 bg-sky-50 rounded-lg flex items-center justify-center border border-sky-100 text-sky-400 hover:bg-sky-400 hover:text-white transition-all shadow-sm">
                                    <LinkIcon size={12} />
                                  </button>
                                  <button onClick={() => deleteFile(file.id)} className="squishy w-7 h-7 bg-red-50 rounded-lg flex items-center justify-center border border-red-100 text-red-400 hover:bg-red-500 hover:text-white transition-all shadow-sm">
                                    <Trash2 size={12} />
                                  </button>
                                </div>
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-center gap-4 px-5 py-3">
                            <input 
                              type="checkbox" 
                              checked={selectedIds.has(file.id)}
                              onChange={() => toggleSelection(file.id)}
                              className="kapo-check checked:bg-sky-400" 
                            />
                            <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center border-2 border-white shadow-sm text-2xl shrink-0 cursor-pointer", thCls(file.name))} onClick={() => toggleSelection(file.id)}>
                              {emoF(file.name)}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-black text-slate-800 text-sm truncate uppercase italic tracking-tighter">{file.name}</p>
                              <div className="flex items-center gap-3 mt-0.5">
                                <p className="font-mono text-[10px] text-slate-300">{sCID(file.cid)}</p>
                                {file.group && <span className="bg-sky-50 text-sky-500 text-[8px] font-black px-2 py-0.5 rounded-full border border-sky-100">{file.group}</span>}
                              </div>
                            </div>
                            <div className="hidden sm:block text-[10px] font-black text-slate-400 w-20 text-right">{fmtSz(file.size)}</div>
                            <div className="flex items-center gap-2">
                              <button onClick={() => copyText(file.cid)} className="squishy w-8 h-8 bg-slate-50 rounded-xl flex items-center justify-center text-slate-300 hover:text-slate-600 transition-colors">
                                <Copy size={14} />
                              </button>
                              <button onClick={() => deleteFile(file.id)} className="squishy w-8 h-8 bg-slate-50 rounded-xl flex items-center justify-center text-slate-300 hover:text-red-500 transition-colors">
                                <Trash2 size={14} />
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {/* Pagination */}
                <div className="mt-12 flex justify-center">
                  <div className="neo-sm rounded-3xl px-6 py-3 border-4 border-white flex items-center gap-6">
                    <div className="flex items-center gap-3">
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Rows:</span>
                      <select 
                        value={rowsPerPage} 
                        onChange={(e) => { setRowsPerPage(+e.target.value); setCurrentPage(1); }}
                        className="bg-sky-50 border-2 border-sky-100 rounded-xl px-2 py-1 text-xs font-extrabold text-slate-600 cursor-pointer"
                      >
                        {ITEMS_PER_PAGE_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
                      </select>
                    </div>
                    <div className="flex items-center gap-4">
                      <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className="squishy text-slate-300 hover:text-sky-500 disabled:opacity-20 transition-colors">
                        <ArrowLeft size={18} strokeWidth={3} />
                      </button>
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Page {currentPage} of {totalPages}</span>
                      <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className="squishy text-slate-300 hover:text-sky-500 disabled:opacity-20 transition-colors">
                        <ArrowRight size={18} strokeWidth={3} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {page === 'groups' && (
              <div className="animate-in fade-in duration-500">
                <div className="flex items-center justify-between mb-7 flex-wrap gap-4">
                  <div>
                    <h1 className="text-4xl font-black text-slate-800 tracking-tight leading-none uppercase italic">Groups</h1>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Organize your on-chain assets</p>
                  </div>
                  <button onClick={() => setGroupModalOpen(true)} className="squishy bg-gradient-to-r from-sky-400 to-blue-600 text-white font-black px-6 py-3 rounded-2xl text-xs flex items-center gap-2 hover:shadow-lg hover:shadow-sky-200 hover:-translate-y-0.5 transition-all uppercase tracking-widest shadow-[4px_4px_0_0_#0369a1]">
                    <FolderOpen size={18} /> New Collection
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {groups.map((group, i) => {
                    const fc = files.filter(f => f.group === group.name);
                    const ts = fc.reduce((a, f) => a + f.size, 0);
                    return (
                      <div key={group.id} className="file-card group rounded-[2.5rem] overflow-hidden flex flex-col h-full bg-white transition-all hover:scale-105">
                        <div className={cn("relative h-32 flex items-center justify-center", GROUP_PALETTE[i % GROUP_PALETTE.length])}>
                          <span className="text-6xl drop-shadow-xl z-10">{group.emoji}</span>
                          <button onClick={() => deleteGroup(group.id)} className="absolute top-4 right-4 w-8 h-8 bg-white/80 backdrop-blur-sm rounded-xl border border-white flex items-center justify-center text-slate-300 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100 shadow-sm">
                            <Trash2 size={14} />
                          </button>
                          <div className="absolute top-4 left-4 bg-white/80 backdrop-blur-sm border border-white px-3 py-1 rounded-full text-[9px] font-black text-slate-500 shadow-sm uppercase tracking-widest">
                            {fc.length} Items
                          </div>
                        </div>
                        <div className="p-6 flex flex-col flex-1">
                          <h3 className="text-xl font-black text-slate-800 uppercase italic tracking-tighter mb-1 truncate">{group.name}</h3>
                          <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest mb-6">Total Weight: {fmtSz(ts)}</p>
                          
                          <div className="flex gap-2 mt-auto">
                            {fc.slice(0, 4).map(f => (
                              <div key={f.id} className={cn("w-8 h-8 rounded-lg flex items-center justify-center text-base border border-white shadow-sm", thCls(f.name))}>
                                {emoF(f.name)}
                              </div>
                            ))}
                            {fc.length > 4 && <div className="w-8 h-8 bg-slate-50 border border-slate-100 rounded-lg flex items-center justify-center text-[10px] font-black text-slate-300">+{fc.length - 4}</div>}
                          </div>
                          
                          <button onClick={() => browseGroup(group.name)} className="w-full mt-6 py-3 bg-sky-50 border-2 border-sky-100 rounded-2xl text-sky-600 font-black text-[10px] uppercase tracking-[0.2em] hover:bg-sky-100 transition-all flex items-center justify-center gap-2">
                            <Eye size={14} /> Open Collection
                          </button>
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

      {/* ── Modals ── */}

      {/* Upload Modal */}
      {uploadModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setUploadModalOpen(false)} />
          <div className="relative bg-white border-4 border-black rounded-[3rem] p-8 max-w-lg w-full shadow-[12px_12px_0_0_rgba(0,0,0,1)] animate-in zoom-in-95">
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-2xl font-black text-slate-800 uppercase italic tracking-tight">Upload Asset</h3>
              <button onClick={() => setUploadModalOpen(false)} className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 hover:bg-red-500 hover:text-white transition-all shadow-sm">✕</button>
            </div>
            
            <div 
              className="border-4 border-dashed border-sky-100 rounded-[2.5rem] p-12 text-center mb-6 hover:border-sky-400 hover:bg-sky-50 transition-all cursor-pointer group"
              onClick={() => document.getElementById('upload-input')?.click()}
            >
              <div className="text-6xl mb-4 group-hover:scale-110 transition-transform">🚀</div>
              <p className="font-black text-slate-500 text-sm uppercase tracking-widest">Drop Manifest or <span className="text-sky-500 underline">Browse</span></p>
              <p className="text-[10px] font-bold text-slate-300 mt-2">Up to 200MB per file · IPFS Locked</p>
              <input 
                id="upload-input" 
                type="file" 
                multiple 
                className="hidden" 
                onChange={(e) => setPendingFiles(Array.from(e.target.files || []))} 
              />
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

            <div className="grid grid-cols-2 gap-4 mb-8">
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-2">Visibility</label>
                <select value={uploadVisibility} onChange={(e) => setUploadVisibility(e.target.value as any)} className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-4 py-3 font-black text-slate-700 text-xs outline-none focus:border-sky-400">
                  <option value="public">🌐 Public</option>
                  <option value="private">🔒 Private</option>
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-2">Group</label>
                <select value={uploadGroup} onChange={(e) => setUploadGroup(e.target.value)} className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-4 py-3 font-black text-slate-700 text-xs outline-none focus:border-sky-400">
                  <option value="">None</option>
                  {groups.map(g => <option key={g.id} value={g.name}>{g.emoji} {g.name}</option>)}
                </select>
              </div>
            </div>

            <button onClick={handleUpload} className="w-full py-5 bg-black text-white rounded-[2rem] font-black uppercase tracking-[0.2em] text-sm shadow-[6px_6px_0_0_#0ea5e9] hover:bg-slate-800 transition-all active:translate-y-1 active:shadow-none flex items-center justify-center gap-3">
              <Upload size={20} /> Deploy to IPFS
            </button>
          </div>
        </div>
      )}

      {/* Group Modal */}
      {groupModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setGroupModalOpen(false)} />
          <div className="relative bg-white border-4 border-black rounded-[3rem] p-8 max-w-sm w-full shadow-[12px_12px_0_0_rgba(0,0,0,1)] animate-in zoom-in-95">
            <h3 className="text-2xl font-black text-slate-800 uppercase italic tracking-tight mb-6">New Collection</h3>
            <div className="space-y-6">
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-2">Collection Name</label>
                <input 
                  type="text" 
                  value={newGroupName}
                  onChange={(e) => setNewGroupName(e.target.value)}
                  placeholder="e.g. holiday-drop" 
                  className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-5 py-4 font-black text-slate-700 text-sm outline-none focus:border-sky-400" 
                />
              </div>
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-2">Choose Avatar</label>
                <div className="grid grid-cols-4 gap-2">
                  {GROUP_EMOJIS.map(e => (
                    <button key={e} onClick={() => setNewGroupEmoji(e)} className={cn("w-12 h-12 rounded-2xl flex items-center justify-center text-2xl border-2 transition-all", newGroupEmoji === e ? "bg-sky-50 border-sky-400 shadow-md scale-110" : "bg-white border-slate-50 hover:bg-slate-50")}>
                      {e}
                    </button>
                  ))}
                </div>
              </div>
              <button onClick={saveGroup} className="w-full py-5 bg-black text-white rounded-[2rem] font-black uppercase tracking-[0.2em] text-sm shadow-[6px_6px_0_0_#0ea5e9] hover:bg-slate-800 transition-all active:translate-y-1 active:shadow-none mt-4">
                Initialize Group
              </button>
            </div>
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
