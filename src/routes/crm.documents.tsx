import { createFileRoute } from "@tanstack/react-router";
import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import mammoth from "mammoth";
import {
  Folder,
  FolderOpen,
  FolderPlus,
  Pencil,
  Trash2,
  Search,
  MoreVertical,
  File,
  X,
  Check,
  Upload,
  ArrowLeft,
  Download,
  FileText,
  FileImage,
  Film,
  Archive,
  ChevronRight,
  HardDrive,
  Cloud,
  Link2,
  Unlink,
  Share2,
  Eye,
  Table2,
  Briefcase,
} from "lucide-react";
import { getAuth } from "@/lib/auth";
import { useLocalStorage } from "@/lib/use-local-storage";
import { useSupabaseTable } from "@/hooks/useSupabaseTable";
import { useGoogleLogin } from "@react-oauth/google";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { EmployeeProfileCard } from "@/components/EmployeeProfileCard";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";

export const Route = createFileRoute("/crm/documents")({ component: FoldersPage });

/* ─── Types ─── */
interface UploadedFile {
  id: string;
  name: string;
  size: number;
  type: string;
  uploadedAt: string;
  dataUrl: string; // base64 data URL – survives refresh
}

interface FolderItem {
  id: string;
  name: string;
  color: string;
  iconColor: string;
  createdAt: string;
  description: string;
  files: UploadedFile[];
  manager?: string;
  parentId?: string | null;
}

/* ─── Fast Local Cache key ─── */
const LS_KEY = "crm_documents_cache_v2";

function loadFromStorage(): FolderItem[] | null {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) return parsed as FolderItem[];
    return null;
  } catch {
    return null;
  }
}

function saveToStorage(folders: FolderItem[]) {
  try {
    const lightweight = folders.map((f) => ({
      ...f,
      files: Array.isArray(f.files)
        ? f.files.map((file) => ({
            id: file.id,
            name: file.name,
            size: file.size,
            type: file.type,
            uploadedAt: file.uploadedAt,
            dataUrl: "", // Strip dataUrl to keep cache fast and tiny (4 KB)
          }))
        : [],
    }));
    localStorage.setItem(LS_KEY, JSON.stringify(lightweight));
  } catch (e) {
    console.warn("localStorage save error:", e);
  }
}

/* ─── Helpers ─── */
const COLORS = [
  { bg: "bg-blue-100 text-blue-600 border-blue-200", icon: "#3b82f6" },
  { bg: "bg-violet-100 text-violet-600 border-violet-200", icon: "#8b5cf6" },
  { bg: "bg-amber-100 text-amber-600 border-amber-200", icon: "#f59e0b" },
  { bg: "bg-emerald-100 text-emerald-600 border-emerald-200", icon: "#10b981" },
  { bg: "bg-rose-100 text-rose-600 border-rose-200", icon: "#f43f5e" },
  { bg: "bg-cyan-100 text-cyan-600 border-cyan-200", icon: "#06b6d4" },
];

function pickColor(idx: number) {
  return COLORS[idx % COLORS.length];
}

function fmtSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
}
function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function fileIcon(mime: string) {
  if (mime.startsWith("image/")) return <FileImage className="h-4 w-4 text-emerald-500" />;
  if (mime.startsWith("video/")) return <Film className="h-4 w-4 text-purple-500" />;
  if (mime === "application/pdf") return <FileText className="h-4 w-4 text-red-500" />;
  if (mime.includes("zip") || mime.includes("rar"))
    return <Archive className="h-4 w-4 text-amber-500" />;
  return <File className="h-4 w-4 text-blue-400" />;
}

function fileTypeLabel(mime: string) {
  if (mime === "application/pdf") return "PDF";
  if (mime.startsWith("image/")) return mime.replace("image/", "").toUpperCase();
  if (mime.startsWith("video/")) return mime.replace("video/", "").toUpperCase();
  if (mime.includes("word") || mime.includes("document")) return "WORD";
  if (mime.includes("sheet") || mime.includes("excel")) return "EXCEL";
  if (mime.includes("zip")) return "ZIP";
  return mime.split("/").pop()?.toUpperCase() ?? "FILE";
}

/** Read a File as a base64 data URL (async) */
function readAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

let _fid = 7;
function genFolderId() {
  return `F-${String(_fid++).padStart(2, "0")}`;
}
let _uid = 1;
function genFileId() {
  return `U-${String(_uid++).padStart(4, "0")}`;
}

/* ─── Seed folders (Instant baseline matching actual 12 folders) ─── */
const SEED_FOLDERS: FolderItem[] = [
  {
    id: "F-msx6oaug",
    name: "Sunil Samariya",
    color: "bg-emerald-100 text-emerald-600 border-emerald-200",
    iconColor: "#10b981",
    createdAt: "2026-08-17T12:01:50.824Z",
    description: "Insurance for Sunil Samariya",
    manager: "Pushplata Kriplani",
    files: [
      {
        id: "U-msx6oauy-sjt1q",
        name: "RJ14XD6515.pdf",
        size: 444360,
        type: "application/pdf",
        uploadedAt: "2026-08-17T12:01:50.842Z",
        dataUrl: "",
      },
    ],
  },
  {
    id: "F-msjy3cnv",
    name: "Dipesh",
    color: "bg-emerald-100 text-emerald-600 border-emerald-200",
    iconColor: "#10b981",
    createdAt: "2026-08-08T05:40:36.187Z",
    description: "Insurance for Dipesh",
    manager: "Pushplata Kriplani",
    files: [
      {
        id: "U-msjy3co2-mjsfy",
        name: "RJ17GB2093 SHIV YOG GAU SEVA AND GAU SANVARDHAN.pdf",
        size: 155531,
        type: "application/pdf",
        uploadedAt: "2026-08-08T05:40:36.194Z",
        dataUrl: "",
      },
    ],
  },
  {
    id: "F-mshins4z",
    name: "Rahul ji ",
    color: "bg-emerald-100 text-emerald-600 border-emerald-200",
    iconColor: "#10b981",
    createdAt: "2026-08-06T12:53:03.155Z",
    description: "Insurance for Rahul ji ",
    manager: "Pushplata Kriplani",
    files: [
      {
        id: "U-0001",
        name: "Pan Card Manvendra (1).pdf",
        size: 183400,
        type: "application/pdf",
        uploadedAt: "2026-08-06T14:42:08.497Z",
        dataUrl: "",
      },
      {
        id: "U-mshins5a-oxf3n",
        name: "RJ22PA6288.pdf",
        size: 462549,
        type: "application/pdf",
        uploadedAt: "2026-08-06T12:53:03.167Z",
        dataUrl: "",
      },
    ],
  },
  {
    id: "F-mshex70c",
    name: "Kdrs Public School Gangapur",
    color: "bg-emerald-100 text-emerald-600 border-emerald-200",
    iconColor: "#10b981",
    createdAt: "2026-08-06T11:08:23.868Z",
    description: "Insurance for Kdrs Public School Gangapur",
    manager: "Pushplata Kriplani",
    files: [
      {
        id: "U-mshex70p-op9gp",
        name: "RJ25PA4484.pdf",
        size: 524522,
        type: "application/pdf",
        uploadedAt: "2026-08-06T11:08:23.882Z",
        dataUrl: "",
      },
    ],
  },
  {
    id: "F-msfngutq",
    name: "Om Prakash Vishnoi ",
    color: "bg-emerald-100 text-emerald-600 border-emerald-200",
    iconColor: "#10b981",
    createdAt: "2026-08-05T05:32:05.774Z",
    description: "Insurance for Om Prakash Vishnoi ",
    manager: "Pushplata Kriplani",
    files: [
      {
        id: "U-msfnguum-axgp7",
        name: "SHRI JAMBHESHWAR VIDHYAPITH SANS.pdf",
        size: 1534048,
        type: "application/pdf",
        uploadedAt: "2026-08-05T05:32:05.807Z",
        dataUrl: "",
      },
      {
        id: "U-msfnguuo-ffan0",
        name: "RJ04PA5242 b.jpeg",
        size: 66398,
        type: "image/jpeg",
        uploadedAt: "2026-08-05T05:32:05.809Z",
        dataUrl: "",
      },
      {
        id: "U-msfnguup-oyqz2",
        name: "pan card RJ03PA5242.jpeg",
        size: 72605,
        type: "image/jpeg",
        uploadedAt: "2026-08-05T05:32:05.809Z",
        dataUrl: "",
      },
    ],
  },
  {
    id: "F-07",
    name: "Visa booking",
    color: "bg-blue-100 text-blue-600 border-blue-200",
    iconColor: "#3b82f6",
    createdAt: "2026-06-30",
    description: "No description",
    manager: "Pushplata Kriplani",
    files: [
      {
        id: "U-jtv8kml",
        name: "[jatin jangid] Look My Holidays Brochure 170826.pdf",
        size: 1158312,
        type: "application/pdf",
        uploadedAt: "2026-08-18T06:59:59.401Z",
        dataUrl: "",
      },
    ],
  },
  {
    id: "F-06",
    name: "Tour Itineraries",
    color: "bg-cyan-100 text-cyan-600 border-cyan-200",
    iconColor: "#06b6d4",
    createdAt: "2026-03-18",
    description: "Day-wise itinerary PDFs for each package",
    manager: "Pushplata Kriplani",
    files: [
      {
        id: "U-0002",
        name: "Thailand - Urvashi Ji.pdf",
        size: 1912651,
        type: "application/pdf",
        uploadedAt: "2026-09-07T07:31:06.083Z",
        dataUrl: "",
      },
      {
        id: "U-0001",
        name: "Singapore - Cruise - 02 Apr.docx",
        size: 56009,
        type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        uploadedAt: "2026-09-07T07:03:16.117Z",
        dataUrl: "",
      },
    ],
  },
  {
    id: "F-05",
    name: "Flight Tickets",
    color: "bg-rose-100 text-rose-600 border-rose-200",
    iconColor: "#f43f5e",
    createdAt: "2026-03-05",
    description: "E-tickets and boarding pass copies",
    manager: "Pushplata Kriplani",
    files: [],
  },
  {
    id: "F-04",
    name: "Hotel Vouchers",
    color: "bg-emerald-100 text-emerald-600 border-emerald-200",
    iconColor: "#10b981",
    createdAt: "2026-02-20",
    description: "Confirmed booking vouchers for all hotels",
    manager: "Pushplata Kriplani",
    files: [],
  },
  {
    id: "F-03",
    name: "General Insurance",
    color: "bg-amber-100 text-amber-600 border-amber-200",
    iconColor: "#f59e0b",
    createdAt: "2026-02-03",
    description: "Insurance certificates and policy PDFs",
    manager: "Pushplata Kriplani",
    files: [],
  },
  {
    id: "F-02",
    name: "Visa Applications",
    color: "bg-violet-100 text-violet-600 border-violet-200",
    iconColor: "#8b5cf6",
    createdAt: "2026-01-15",
    description: "Submitted and approved visa documents",
    manager: "Pushplata Kriplani",
    files: [],
  },
  {
    id: "F-01",
    name: "Passports & IDs",
    color: "bg-blue-100 text-blue-600 border-blue-200",
    iconColor: "#3b82f6",
    createdAt: "2026-01-10",
    description: "Customer passport scans and ID documents",
    manager: "Pushplata Kriplani",
    files: [],
  },
];

function getInitialFolders(): FolderItem[] {
  const cached = loadFromStorage();
  if (cached && cached.length > 0) return cached;
  return SEED_FOLDERS;
}

function Modal({
  open,
  onClose,
  title,
  children,
  className,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  className?: string;
}) {
  const [blink, setBlink] = useState(false);
  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      setBlink(true);
      setTimeout(() => setBlink(false), 200);
    }
  };
  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setBlink(true);
        setTimeout(() => setBlink(false), 200);
      }
    };
    if (open) window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [open]);
  if (!open) return null;
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.45)", backdropFilter: "blur(4px)" }}
      onClick={handleBackdropClick}
    >
      <div className={`w-full rounded-2xl border border-border bg-card p-6 shadow-2xl animate-in fade-in zoom-in-95 transition-all duration-150 ${blink ? "scale-[1.02] ring-4 ring-primary/40 opacity-90" : ""} ${className || "max-w-md"} overflow-hidden max-h-[95vh] flex flex-col`}>
        <div className="mb-4 flex shrink-0 items-center justify-between">
          <h2 className="font-display text-lg font-bold">{title}</h2>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-muted-foreground hover:bg-secondary transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

function DocxViewer({ dataUrl }: { dataUrl: string }) {
  const [html, setHtml] = useState<string>("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function renderDoc() {
      try {
        setLoading(true);
        const base64 = dataUrl.split(",")[1];
        if (!base64) throw new Error("Invalid dataUrl");
        const binaryString = window.atob(base64);
        const len = binaryString.length;
        const bytes = new Uint8Array(len);
        for (let i = 0; i < len; i++) {
          bytes[i] = binaryString.charCodeAt(i);
        }
        
        const result = await mammoth.convertToHtml({ arrayBuffer: bytes.buffer });
        setHtml(result.value);
      } catch (err) {
        console.error("Docx render error", err);
        setHtml("<p class='text-red-500'>Error loading document preview.</p>");
      } finally {
        setLoading(false);
      }
    }
    renderDoc();
  }, [dataUrl]);

  if (loading) return <div className="flex justify-center p-8"><span className="animate-pulse text-muted-foreground">Loading preview...</span></div>;

  return (
    <div 
      className="max-w-none docx-preview space-y-4 [&_img]:max-w-full [&_img]:h-auto [&_img]:rounded-md [&_img]:mx-auto [&_p]:leading-relaxed" 
      dangerouslySetInnerHTML={{ __html: html }} 
    />
  );
}

/* ─── Inline rename ─── */
function RenameInput({
  value,
  onSave,
  onCancel,
}: {
  value: string;
  onSave: (v: string) => void;
  onCancel: () => void;
}) {
  const [v, setV] = useState(value);
  const ref = useRef<HTMLInputElement>(null);
  useEffect(() => {
    ref.current?.focus();
    ref.current?.select();
  }, []);
  return (
    <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
      <input
        ref={ref}
        value={v}
        onChange={(e) => setV(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") onSave(v.trim());
          if (e.key === "Escape") onCancel();
        }}
        className="flex-1 rounded-lg border border-primary bg-background px-2 py-1 text-sm font-semibold outline-none ring-2 ring-primary/30"
      />
      <button
        onClick={() => onSave(v.trim())}
        className="rounded-md p-1 text-emerald-600 hover:bg-emerald-50 transition-colors"
      >
        <Check className="h-3.5 w-3.5" />
      </button>
      <button
        onClick={onCancel}
        className="rounded-md p-1 text-red-500 hover:bg-red-50 transition-colors"
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}

/* ─── Folder Card ─── */
function FolderCard({
  folder,
  subfolderCount,
  onRename,
  onDelete,
  onOpen,
}: {
  folder: FolderItem;
  subfolderCount?: number;
  onRename: (id: string, name: string) => void;
  onDelete: (id: string) => void;
  onOpen: (folder: FolderItem) => void;
}) {
  const auth = getAuth();
  const isAdmin = auth?.role === "admin" || auth?.role === "manager";

  const [menuOpen, setMenuOpen] = useState(false);
  const [renaming, setRenaming] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false);
    };
    if (menuOpen) document.addEventListener("mousedown", h);
    return () => window.removeEventListener("mousedown", h);
  }, [menuOpen]);

  const totalSize = folder.files.reduce((s, f) => s + f.size, 0);

  return (
    <div
      className="group relative flex flex-col gap-3 rounded-2xl border border-border bg-card p-5 shadow-card transition-all hover:shadow-md hover:-translate-y-0.5 cursor-pointer"
      onClick={() => !renaming && onOpen(folder)}
    >
      {/* Menu */}
      <div className="absolute right-3 top-3" ref={menuRef} onClick={(e) => e.stopPropagation()}>
        <button
          onClick={() => setMenuOpen((p) => !p)}
          className="rounded-lg p-1.5 text-muted-foreground opacity-0 group-hover:opacity-100 hover:bg-secondary transition-all"
        >
          <MoreVertical className="h-4 w-4" />
        </button>
        {menuOpen && (
          <div className="absolute right-0 top-8 z-20 min-w-[140px] rounded-xl border border-border bg-card py-1 shadow-xl">
            <button
              onClick={() => {
                setRenaming(true);
                setMenuOpen(false);
              }}
              className="flex w-full items-center gap-2 px-4 py-2 text-sm hover:bg-secondary transition-colors"
            >
              <Pencil className="h-3.5 w-3.5" /> Rename
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setMenuOpen(false);
                // Share functionality could go here
              }}
              className="flex w-full items-center gap-2 px-4 py-2 text-sm hover:bg-secondary transition-colors"
            >
              <Share2 className="h-3.5 w-3.5" /> Share
            </button>
            {isAdmin && (
              <div className="py-1">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete(folder.id);
                    setMenuOpen(false);
                  }}
                  className="flex w-full items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                >
                  <Trash2 className="h-3.5 w-3.5" /> Delete
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Icon */}
      <div
        className={`flex h-12 w-12 items-center justify-center rounded-2xl border-2 ${folder.color}`}
      >
        <Folder className="h-6 w-6" />
      </div>

      {/* Name */}
      {renaming ? (
        <RenameInput
          value={folder.name}
          onSave={(v) => {
            if (v) onRename(folder.id, v);
            setRenaming(false);
          }}
          onCancel={() => setRenaming(false)}
        />
      ) : (
        <p className="font-semibold leading-tight line-clamp-1">{folder.name}</p>
      )}

      <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
        {folder.description}
      </p>

      <div className="mt-auto flex items-center justify-between pt-3 border-t border-border">
        <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <File className="h-3 w-3" />
          {subfolderCount ? `${subfolderCount} folder${subfolderCount !== 1 ? "s" : ""} · ` : ""}
          {folder.files.length} file{folder.files.length !== 1 ? "s" : ""}
          {totalSize > 0 && <span className="ml-1 opacity-60">· {fmtSize(totalSize)}</span>}
        </span>
        <span className="flex items-center gap-1 text-xs text-muted-foreground">
          Open <ChevronRight className="h-3 w-3" />
        </span>
      </div>
    </div>
  );
}

/* ─── Drop Zone ─── */
function DropZone({
  onFiles,
  uploading,
  isZoho,
}: {
  onFiles: (files: File[]) => void;
  uploading: boolean;
  isZoho: boolean;
}) {
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const folderInputRef = useRef<HTMLInputElement>(null);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragging(false);
      onFiles(Array.from(e.dataTransfer.files));
    },
    [onFiles],
  );

  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        setDragging(true);
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={handleDrop}
      onClick={() => !uploading && inputRef.current?.click()}
      className={`flex cursor-pointer flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed py-10 transition-all ${
        uploading
          ? "border-primary/40 bg-primary/5 cursor-wait"
          : dragging
            ? "border-primary bg-primary/5 scale-[1.01]"
            : "border-border bg-secondary/30 hover:border-primary/50 hover:bg-primary/5"
      }`}
    >
      <input
        ref={inputRef}
        type="file"
        multiple
        accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png,.gif,.webp,.zip,.rar,.txt,image/*,video/*"
        className="hidden"
        onChange={(e) => {
          if (e.target.files) {
            onFiles(Array.from(e.target.files));
            e.target.value = "";
          }
        }}
      />
      <input
        ref={folderInputRef}
        type="file"
        // @ts-expect-error - webkitdirectory is a non-standard attribute but supported
        webkitdirectory="true"
        directory="true"
        className="hidden"
        onChange={(e) => {
          if (e.target.files) {
            onFiles(Array.from(e.target.files));
            e.target.value = "";
          }
        }}
      />
      <div
        className={`grid h-14 w-14 place-items-center rounded-2xl transition-colors ${uploading ? "bg-primary/20" : "bg-primary/10"}`}
      >
        {uploading ? (
          <div className="h-7 w-7 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        ) : (
          <Upload className="h-7 w-7 text-primary" />
        )}
      </div>
      <div className="text-center">
        {uploading ? (
          <p className="font-semibold text-sm text-primary">Saving files…</p>
        ) : (
          <>
            <p className="font-semibold text-sm">Drag & drop files here</p>
            <p className="mt-1 text-xs text-muted-foreground mb-3">
              or click to browse — PDF, Images, Docs, Excel, ZIP…
            </p>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="mt-2 relative z-10"
              onClick={(e) => {
                e.stopPropagation();
                if (!uploading) {
                  folderInputRef.current?.click();
                }
              }}
            >
              <FolderPlus className="h-4 w-4 mr-2" /> Upload Folder
            </Button>
            <p className="mt-4 text-xs text-muted-foreground flex items-center justify-center gap-1">
              {isZoho ? (
                <>
                  <Cloud className="h-3 w-3 text-[#0F9D58]" /> Files will be saved directly to
                  Google Drive
                </>
              ) : (
                <>
                  <HardDrive className="h-3 w-3" /> Files are saved locally in your browser
                </>
              )}
            </p>
          </>
        )}
      </div>
    </div>
  );
}

/* ─── File Row ─── */
function FileRow({
  file,
  onDelete,
  onPreview,
}: {
  file: UploadedFile;
  onDelete: (id: string) => void;
  onPreview: (file: UploadedFile) => void;
}) {
  const auth = getAuth();
  const isAdmin = auth?.role === "admin" || auth?.role === "manager";
  return (
    <tr className="group border-b border-border/60 transition-colors hover:bg-secondary/40">
      <td className="py-3 pl-4 pr-2">
        <div className="flex items-center gap-2.5">
          {fileIcon(file.type)}
          <button
            onClick={() => onPreview(file)}
            className="max-w-[260px] truncate text-sm font-medium text-left hover:text-primary hover:underline transition-colors"
          >
            {file.name}
          </button>
        </div>
      </td>
      <td className="py-3 px-3">
        <span className="inline-flex items-center rounded-md bg-secondary px-2 py-0.5 text-[11px] font-semibold uppercase text-muted-foreground">
          {fileTypeLabel(file.type)}
        </span>
      </td>
      <td className="py-3 px-3 text-sm text-muted-foreground">{fmtSize(file.size)}</td>
      <td className="py-3 px-3 text-sm text-muted-foreground">{fmtDate(file.uploadedAt)}</td>
      <td className="py-3 pl-3 pr-4">
        <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="rounded-lg p-1.5 text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors outline-none">
                <MoreVertical className="h-4 w-4" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-36">
              <DropdownMenuItem onClick={() => onPreview(file)} className="cursor-pointer">
                <Eye className="mr-2 h-4 w-4" />
                Preview
              </DropdownMenuItem>
              <DropdownMenuItem asChild className="cursor-pointer">
                <a
                  href={file.dataUrl}
                  download={file.name}
                  className="flex w-full items-center"
                >
                  <Download className="mr-2 h-4 w-4" />
                  Download
                </a>
              </DropdownMenuItem>
              {isAdmin && (
                <>{auth?.role === "admin" && (
<DropdownMenuItem
                  onClick={() => onDelete(file.id)}
                  className="cursor-pointer text-red-600 focus:text-red-600 focus:bg-red-50"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete
                </DropdownMenuItem>
)}</>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </td>
    </tr>
  );
}

/* ─── Folder Detail View ─── */
function FolderDetail({
  folder,
  allFolders,
  onBack,
  onOpenFolder,
  onRenameFolder,
  onDeleteFolder,
  onUpload,
  onDeleteFile,
  isZoho,
}: {
  folder: FolderItem;
  allFolders: FolderItem[];
  onBack: () => void;
  onOpenFolder: (folder: FolderItem) => void;
  onRenameFolder: (id: string, name: string) => void;
  onDeleteFolder: (id: string) => void;
  onUpload: (folderId: string, files: File[]) => Promise<void>;
  onDeleteFile: (folderId: string, fileId: string) => void;
  isZoho: boolean;
}) {
  const [search, setSearch] = useState("");
  const [previewFile, setPreviewFile] = useState<UploadedFile | null>(null);
  const [uploading, setUploading] = useState(false);
  const [savedBanner, setSavedBanner] = useState(false);

  const filtered = folder.files.filter((f) => f.name.toLowerCase().includes(search.toLowerCase()));

  const handleDrop = async (files: File[]) => {
    setUploading(true);
    await onUpload(folder.id, files);
    setUploading(false);
    setSavedBanner(true);
    setTimeout(() => setSavedBanner(false), 3000);
  };

  const totalSize = folder.files.reduce((s, f) => s + f.size, 0);

  return (
    <div className="space-y-6">
      {/* Back + Header */}
      <div className="flex flex-wrap items-center gap-4">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 rounded-xl border border-border bg-card px-3 py-2 text-sm font-medium shadow-sm hover:bg-secondary transition-colors"
        >
          <ArrowLeft className="h-4 w-4" /> Back to Folders
        </button>
        <div className="flex items-center gap-2">
          <div
            className={`flex h-9 w-9 items-center justify-center rounded-xl border-2 ${folder.color}`}
          >
            <FolderOpen className="h-5 w-5" />
          </div>
          <div>
            <h2 className="font-display text-xl font-bold leading-tight">{folder.name}</h2>
            <p className="text-xs text-muted-foreground">{folder.description}</p>
          </div>
        </div>
        <div className="ml-auto flex items-center gap-4 text-sm text-muted-foreground">
          <span className="flex items-center gap-1">
            <File className="h-3.5 w-3.5" /> {folder.files.length} file
            {folder.files.length !== 1 ? "s" : ""}
          </span>
          {totalSize > 0 && (
            <span className="flex items-center gap-1">
              <HardDrive className="h-3.5 w-3.5" /> {fmtSize(totalSize)}
            </span>
          )}
        </div>
      </div>

      {/* Saved banner */}
      {savedBanner && (
        <div
          className={`flex items-center gap-2 rounded-xl border px-4 py-3 text-sm animate-in fade-in duration-300 ${
            isZoho
              ? "border-primary/30 bg-green-50 text-[#0F9D58]"
              : "border-emerald-200 bg-emerald-50 text-emerald-700"
          }`}
        >
          <Check className="h-4 w-4 shrink-0" />
          <span>
            Files{" "}
            {isZoho
              ? "uploaded successfully to Google Drive."
              : "saved successfully — they will persist after page refresh."}
          </span>
        </div>
      )}

      {/* Subfolders */}
      {allFolders.filter(f => f.parentId === folder.id).length > 0 && (
        <div>
          <h3 className="mb-4 text-lg font-bold">Folders</h3>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 mb-8">
            {allFolders
              .filter((f) => f.parentId === folder.id)
              .map((f) => (
                <FolderCard
                  key={f.id}
                  folder={f}
                  subfolderCount={allFolders.filter(sub => sub.parentId === f.id).length}
                  onRename={onRenameFolder}
                  onDelete={onDeleteFolder}
                  onOpen={onOpenFolder}
                />
              ))}
          </div>
        </div>
      )}

      <h3 className="text-lg font-bold">Upload Files</h3>
      {/* Drop Zone */}
      <DropZone onFiles={handleDrop} uploading={uploading} isZoho={isZoho} />

      {/* File List */}
      <div className="rounded-2xl border border-border bg-card shadow-card overflow-hidden">
        <div className="flex items-center justify-between gap-4 border-b border-border px-4 py-3">
          <p className="text-sm font-semibold">
            Files
            {folder.files.length > 0 && (
              <span className="ml-2 rounded-full bg-primary/10 px-2 py-0.5 text-xs text-primary font-medium">
                {folder.files.length}
              </span>
            )}
          </p>
          <div className="relative w-56">
            <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search files…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8 h-8 text-sm rounded-lg"
            />
          </div>
        </div>

        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
            <div className="grid h-14 w-14 place-items-center rounded-2xl bg-secondary">
              <File className="h-7 w-7 text-muted-foreground/40" />
            </div>
            <p className="font-semibold text-muted-foreground">
              {search ? "No files match your search" : "No files yet"}
            </p>
            <p className="text-xs text-muted-foreground">
              {search ? "Try a different search term." : "Upload a file using the area above."}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-secondary/50 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  <th className="py-2.5 pl-4 pr-2 text-left">File Name</th>
                  <th className="py-2.5 px-3 text-left">Type</th>
                  <th className="py-2.5 px-3 text-left">Size</th>
                  <th className="py-2.5 px-3 text-left">Uploaded</th>
                  <th className="py-2.5 pl-3 pr-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((file) => (
                  <FileRow
                    key={file.id}
                    file={file}
                    onDelete={(id) => onDeleteFile(folder.id, id)}
                    onPreview={setPreviewFile}
                  />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Preview Modal */}
      <Modal
        open={!!previewFile}
        onClose={() => setPreviewFile(null)}
        title={previewFile?.name ?? ""}
        className={previewFile && (previewFile.name.endsWith(".docx") || previewFile.type === "application/pdf" || previewFile.type.startsWith("image/")) ? "max-w-4xl" : "max-w-md"}
      >
        {previewFile && (
          <div className="space-y-4 overflow-y-auto">
            <div className="flex items-center gap-3 rounded-xl border border-border bg-secondary/40 p-3">
              {fileIcon(previewFile.type)}
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold">{previewFile.name}</p>
                <p className="text-xs text-muted-foreground">
                  {fmtSize(previewFile.size)} · {fmtDate(previewFile.uploadedAt)}
                </p>
              </div>
            </div>

            {previewFile.name.endsWith(".docx") && (
              <div className="w-full h-[70vh] overflow-y-auto rounded-xl border border-border bg-white p-6 md:p-10 text-black text-left">
                <DocxViewer dataUrl={previewFile.dataUrl} />
              </div>
            )}

            {!previewFile.type.startsWith("image/") &&
              previewFile.type !== "application/pdf" &&
              !previewFile.name.endsWith(".docx") && (
                <div className="flex flex-col items-center justify-center p-8 bg-secondary/20 rounded-xl">
                  <p className="text-muted-foreground text-sm">No preview available for this file type.</p>
                </div>
              )}

            {previewFile.type.startsWith("image/") && (
              <img
                src={previewFile.dataUrl}
                alt={previewFile.name}
                className="max-h-[70vh] w-full rounded-xl object-contain bg-secondary/30"
              />
            )}
            {previewFile.type === "application/pdf" && (
              <iframe
                src={previewFile.dataUrl}
                className="h-[70vh] w-full rounded-xl border border-border"
                title={previewFile.name}
              />
            )}

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setPreviewFile(null)} className="rounded-xl">
                Close
              </Button>
              <a href={previewFile.dataUrl} download={previewFile.name}>
                <Button className="gap-2 rounded-xl">
                  <Download className="h-4 w-4" /> Download
                </Button>
              </a>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

/* ─── Main Page ─── */
function FoldersPage() {
  const auth = getAuth();
  const isAdmin = auth?.role === "admin" || auth?.role === "manager";

  // Load from fast local cache immediately, then sync with Supabase in background
  const [folders, setFolders] = useSupabaseTable<FolderItem[]>("folders", getInitialFolders());

  // Save lightweight cache to localStorage whenever folders updates
  useEffect(() => {
    if (folders && folders.length > 0) {
      saveToStorage(folders);
    }
  }, [folders]);

  const [search, setSearch] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [openFolderId, setOpenFolderId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<FolderItem | null>(null);
  const globalFolderInputRef = useRef<HTMLInputElement>(null);

  // Export state
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [exportStartDate, setExportStartDate] = useState("");
  const [exportEndDate, setExportEndDate] = useState("");

  // Google Drive State
  const [googleAccessToken, setGoogleAccessToken] = useLocalStorage("crm_gdrive_token", "");
  const isZohoConnected = !!googleAccessToken;
  const [zohoModalOpen, setZohoModalOpen] = useState(false);
  const [isConnectingZoho, setIsConnectingZoho] = useState(false);

  // Always call useGoogleLogin unconditionally (React hook rules).
  // When no clientId is configured, GoogleOAuthProvider still wraps the app
  // but login will show an alert instead of launching the OAuth popup.
  const googleLogin = useGoogleLogin({
    onSuccess: (tokenResponse) => {
      setGoogleAccessToken(tokenResponse.access_token);
      setIsConnectingZoho(false);
      setZohoModalOpen(false);
    },
    onError: () => {
      setIsConnectingZoho(false);
      console.error("Google Login Failed");
      alert("Google Login Failed. Make sure a valid Google OAuth Client ID is configured.");
    },
    scope: "https://www.googleapis.com/auth/drive.file",
  });

  const loginWithGoogle = () => {
    const clientId = import.meta.env.VITE_GOOGLE_DRIVE_CLIENT_ID as string | undefined;
    if (!clientId) {
      setIsConnectingZoho(false);
      alert(
        "Google Drive is not configured. To enable it, add your VITE_GOOGLE_DRIVE_CLIENT_ID to the .env file.",
      );
      return;
    }
    googleLogin();
  };

  // In-memory grouping without triggering heavy multi-megabyte Supabase sync loops
  const displayFolders = useMemo(() => {
    let generalInsuranceFolder = folders.find((f) => f.name === "General Insurance");
    let list = [...folders];

    const legacyFolders = list.filter(
      (f) =>
        !f.parentId &&
        f.name !== "General Insurance" &&
        f.name !== "Insurance" &&
        f.name !== "Travel Insurance" &&
        (f.description?.startsWith("Insurance for") ||
          f.name === "Dipesh" ||
          f.name === "Rahul ji" ||
          f.name === "Kdrs Public School Gangapur" ||
          f.name === "Om Prakash Vishnoi")
    );

    if (legacyFolders.length > 0) {
      if (!generalInsuranceFolder) {
        generalInsuranceFolder = {
          id: "F-INS-general",
          name: "General Insurance",
          color: "bg-emerald-100 text-emerald-600 border-emerald-200",
          iconColor: "#10b981",
          createdAt: "2026-01-01",
          description: "All General Insurance Documents",
          files: [],
        };
        list.push(generalInsuranceFolder);
      }

      list = list.map((f) => {
        if (legacyFolders.some((lf) => lf.id === f.id)) {
          return { ...f, parentId: generalInsuranceFolder!.id };
        }
        return f;
      });
    }

    return list;
  }, [folders]);

  const openFolder = displayFolders.find((f) => f.id === openFolderId) ?? null;

  const filtered = displayFolders.filter(
    (f) =>
      (!f.parentId || f.parentId === openFolderId) &&
      (f?.name?.toLowerCase().includes(search.toLowerCase()) ||
        f?.description?.toLowerCase().includes(search.toLowerCase()))
  );

  /* ── CRUD ── */
  function handleCreate() {
    const name = newName.trim();
    if (!name) return;
    const idx = folders.length;
    const color = pickColor(idx);
    const folder: FolderItem = {
      id: genFolderId(),
      name,
      color: color.bg,
      iconColor: color.icon,
      files: [],
      createdAt: new Date().toISOString().slice(0, 10),
      description: newDesc.trim() || "No description",
      manager: "Pushplata Kriplani",
      parentId: openFolderId || null,
    };
    setFolders((p) => [folder, ...p]);
    setNewName("");
    setNewDesc("");
    setCreateOpen(false);
  }

  function handleRename(id: string, name: string) {
    setFolders((p) => p.map((f) => (f.id === id ? { ...f, name } : f)));
  }

  function handleDelete(id: string) {
    setFolders((p) => p.filter((f) => f.id !== id));
    if (openFolderId === id) setOpenFolderId(null);
    setDeleteTarget(null);
  }

  /* ── File upload – reads files to base64 & persists ── */
  async function handleUpload(folderId: string, rawFiles: File[]) {
    if (googleAccessToken) {
      try {
        for (const file of rawFiles) {
          const metadata = {
            name: file.name,
            mimeType: file.type || "application/octet-stream",
          };

          const form = new FormData();
          form.append(
            "metadata",
            new Blob([JSON.stringify(metadata)], { type: "application/json" }),
          );
          form.append("file", file);

          const res = await fetch(
            "https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart",
            {
              method: "POST",
              headers: {
                Authorization: `Bearer ${googleAccessToken}`,
              },
              body: form,
            },
          );

          if (!res.ok) {
            console.error("Failed to upload to Google Drive", await res.text());
            alert("Failed to upload " + file.name + " to Google Drive.");
          }
        }
      } catch (e) {
        console.error(e);
        alert("Failed to upload to Google Drive. Check console.");
      }
    }

    const uploads = await Promise.all(
      rawFiles.map(
        async (rf) =>
          ({
            id: genFileId(),
            name: rf.name,
            size: rf.size,
            type: rf.type || "application/octet-stream",
            uploadedAt: new Date().toISOString(),
            dataUrl: await readAsDataUrl(rf),
          }) satisfies UploadedFile,
      ),
    );
    setFolders((p) =>
      p.map((f) => (f.id === folderId ? { ...f, files: [...uploads, ...f.files] } : f)),
    );
  }

  function handleDeleteFile(folderId: string, fileId: string) {
    setFolders((p) =>
      p.map((f) =>
        f.id === folderId ? { ...f, files: f.files.filter((u) => u.id !== fileId) } : f,
      ),
    );
  }

  const totalFiles = displayFolders.reduce((s, f) => s + f.files.length, 0);

  async function handleUploadFolder(e: React.ChangeEvent<HTMLInputElement>) {
    if (!e.target.files || e.target.files.length === 0) return;
    const rawFiles = Array.from(e.target.files);
    e.target.value = ""; // reset

    const firstPath = rawFiles[0].webkitRelativePath || "";
    const folderName = firstPath.split('/')[0] || "New Uploaded Folder";

    const idx = folders.length;
    const color = pickColor(idx);
    const newFolderId = genFolderId();
    const newFolder: FolderItem = {
      id: newFolderId,
      name: folderName,
      color: color.bg,
      iconColor: color.icon,
      files: [],
      createdAt: new Date().toISOString().slice(0, 10),
      description: "Uploaded folder",
      manager: "Pushplata Kriplani",
    };

    setFolders((p) => [newFolder, ...p]);
    await handleUpload(newFolderId, rawFiles);
  }

  /* ── Folder detail ── */
  if (openFolder) {
    return (
      <div className="mx-auto max-w-5xl space-y-6">
        <FolderDetail
          folder={openFolder}
          allFolders={displayFolders}
          onBack={() => setOpenFolderId(openFolder.parentId || null)}
          onOpenFolder={(f) => setOpenFolderId(f.id)}
          onRenameFolder={handleRename}
          onDeleteFolder={handleDelete}
          onUpload={handleUpload}
          onDeleteFile={handleDeleteFile}
          isZoho={isZohoConnected}
        />
      </div>
    );
  }

  const exportToExcel = () => {
    const csvRows = [
      ["Folder ID", "Folder Name", "Created At", "Description", "Manager", "Number of Files"]
    ];

    displayFolders.forEach(f => {
      const matchStart = exportStartDate ? f.createdAt >= exportStartDate : true;
      const matchEnd = exportEndDate ? f.createdAt <= exportEndDate : true;

      if (matchStart && matchEnd) {
        csvRows.push([
          f.id,
          `"${f.name}"`,
          f.createdAt,
          `"${f.description || ""}"`,
          `"${f.manager || ""}"`,
          String(f.files.length)
        ]);
      }
    });

    const csvContent = csvRows.map(row => row.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `folders_export_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportToWord = () => {
    const tableHeader =
      "<tr><th>Folder ID</th><th>Folder Name</th><th>Manager</th><th>Description</th><th>Files Count</th><th>Created Date</th></tr>";

    const exportableFolders = displayFolders.filter(f => {
      const matchStart = exportStartDate ? f.createdAt >= exportStartDate : true;
      const matchEnd = exportEndDate ? f.createdAt <= exportEndDate : true;
      return matchStart && matchEnd;
    });

    const tableRows = exportableFolders
      .map(
        (f) =>
          `<tr><td>${f.id}</td><td>${f.name}</td><td>${f.manager || ""}</td><td>${f.description || ""}</td><td>${f.files.length}</td><td>${f.createdAt}</td></tr>`,
      )
      .join("");

    const htmlString = `
      <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
      <head><title>Folders Export</title><style>table { border-collapse: collapse; width: 100%; font-family: Arial, sans-serif; } th, td { border: 1px solid #dddddd; padding: 8px; text-align: left; } th { background-color: #f2f2f2; }</style></head>
      <body><h2>Grand Journeys CRM - Folders Export</h2><table>${tableHeader}${tableRows}</table></body>
      </html>
    `;
    const blob = new Blob([htmlString], { type: "application/msword" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `folders_export_${new Date().toISOString().slice(0, 10)}.doc`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportToPDF = () => {
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;

    const exportableFolders = displayFolders.filter(f => {
      const matchStart = exportStartDate ? f.createdAt >= exportStartDate : true;
      const matchEnd = exportEndDate ? f.createdAt <= exportEndDate : true;
      return matchStart && matchEnd;
    });

    const tableHeader =
      "<tr><th>Folder ID</th><th>Folder Name</th><th>Manager</th><th>Description</th><th>Files Count</th><th>Created Date</th></tr>";

    const tableRows = exportableFolders
      .map(
        (f) =>
          `<tr><td>${f.id}</td><td>${f.name}</td><td>${f.manager || ""}</td><td>${f.description || ""}</td><td>${f.files.length}</td><td>${f.createdAt}</td></tr>`,
      )
      .join("");

    const css = `body{font-family:sans-serif;padding:20px;color:#333}h2{color:#059669;margin-bottom:5px}p{font-size:12px;color:#666;margin-bottom:20px}table{border-collapse:collapse;width:100%;font-size:12px}th,td{border:1px solid #ddd;padding:8px;text-align:left}th{background:#f9fafb;font-weight:bold}tr:nth-child(even){background:#f3f4f6}`;
    const styleEl = printWindow.document.createElement("style");
    styleEl.textContent = css;
    printWindow.document.head.appendChild(styleEl);
    const titleEl = printWindow.document.createElement("title");
    titleEl.textContent = "Folders Export PDF";
    printWindow.document.head.appendChild(titleEl);
    const bodyHtml = `<h2>Grand Journeys CRM - Folders Export</h2><p>Generated on ${new Date().toLocaleDateString("en-IN")} | Total Folders: ${exportableFolders.length}</p><table><thead>${tableHeader}</thead><tbody>${tableRows}</tbody></table>`;
    const wrapper = printWindow.document.createElement("div");
    wrapper.innerHTML = bodyHtml;
    printWindow.document.body.appendChild(wrapper);
    const script = printWindow.document.createElement("script");
    script.textContent =
      "window.onload=function(){window.print();window.onafterprint=function(){window.close();}}";
    printWindow.document.body.appendChild(script);
  };

  /* ── Folder grid ── */
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold">Folders</h1>
          <p className="mt-1 text-sm text-muted-foreground flex items-center gap-1.5">
            {displayFolders.length} folders · {totalFiles} total files
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={() => setIsExportOpen(true)}
            variant="outline"
            className="gap-2 rounded-xl text-xs font-semibold h-9 border-border hover:bg-secondary/50 transition-colors"
          >
            <Download className="h-4 w-4" /> Export Folder
          </Button>
          <Button
            onClick={() => setCreateOpen(true)}
            className="gap-2 rounded-xl text-white text-xs font-semibold h-9 hover:opacity-90 transition-opacity"
            style={{ background: "var(--gradient-brand)" }}
            id="new-folder-btn"
          >
            <FolderPlus className="h-4 w-4" /> New Folder
          </Button>
          <Button
            onClick={() => globalFolderInputRef.current?.click()}
            variant="outline"
            className="gap-2 rounded-xl text-xs font-semibold h-9 border-border hover:bg-secondary/50 transition-colors"
          >
            <Upload className="h-4 w-4" /> Upload Folder
          </Button>
          <input
            ref={globalFolderInputRef}
            type="file"
            // @ts-expect-error webkitdirectory is a non-standard attribute but supported
            webkitdirectory="true"
            directory="true"
            className="hidden"
            onChange={handleUploadFolder}
          />
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search folders…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9 rounded-xl"
        />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {[
          { label: "Total Folders", value: displayFolders.length, icon: <Folder className="h-4 w-4" /> },
          { label: "Total Files", value: totalFiles, icon: <File className="h-4 w-4" /> },
          {
            label: "Recent (30d)",
            value: displayFolders.filter(
              (f) => f.createdAt >= new Date(Date.now() - 30 * 86400000).toISOString().slice(0, 10),
            ).length,
            icon: <FolderOpen className="h-4 w-4" />,
          },
          {
            label: "Empty Folders",
            value: displayFolders.filter((f) => f.files.length === 0).length,
            icon: <Folder className="h-4 w-4" />,
          },
        ].map((s) => (
          <div
            key={s.label}
            className="flex items-center gap-3 rounded-2xl border border-border bg-card px-5 py-4 shadow-card"
          >
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
              {s.icon}
            </span>
            <div>
              <p className="font-display text-xl font-bold">{s.value}</p>
              <p className="text-xs text-muted-foreground">{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Grid */}
      {filtered.length === 0 ? (
        <div className="grid min-h-[40vh] place-items-center">
          <div className="text-center">
            <FolderOpen className="mx-auto h-12 w-12 text-muted-foreground/40" />
            <p className="mt-3 font-semibold text-muted-foreground">No folders found</p>
            <p className="mt-1 text-sm text-muted-foreground">
              {search ? "Try a different search term." : "Create your first folder to get started."}
            </p>
            {!search && (
              <Button
                onClick={() => setCreateOpen(true)}
                className="mt-4 gap-2 rounded-xl"
                variant="outline"
              >
                <FolderPlus className="h-4 w-4" /> New Folder
              </Button>
            )}
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filtered.filter(f => !f.parentId).map((folder) => (
              <FolderCard
                key={folder.id}
                folder={folder}
                subfolderCount={displayFolders.filter(sub => sub.parentId === folder.id).length}
                onRename={handleRename}
                onDelete={(id) => setDeleteTarget(folder)}
                onOpen={(f) => setOpenFolderId(f.id)}
              />
            ))}
          </div>
      )}

      {/* Create Modal */}
      <Modal open={createOpen} onClose={() => setCreateOpen(false)} title="Create New Folder">
        <div className="space-y-4">
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Folder Name *
            </label>
            <Input
              id="folder-name-input"
              placeholder="e.g. Client Contracts 2026"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleCreate();
              }}
              autoFocus
            />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Description
            </label>
            <textarea
              placeholder="Optional description…"
              value={newDesc}
              onChange={(e) => setNewDesc(e.target.value)}
              rows={3}
              className="w-full resize-none rounded-xl border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition"
            />
          </div>
          <div className="flex justify-end gap-2 pt-1">
            <Button variant="outline" onClick={() => setCreateOpen(false)} className="rounded-xl">
              Cancel
            </Button>
            <Button onClick={handleCreate} disabled={!newName.trim()} className="gap-2 rounded-xl">
              <FolderPlus className="h-4 w-4" /> Create Folder
            </Button>
          </div>
        </div>
      </Modal>

      {/* Delete Confirm */}
      <Modal open={!!deleteTarget} onClose={() => setDeleteTarget(null)} title="Delete Folder">
        {deleteTarget && (
          <div className="space-y-4">
            <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
              Are you sure you want to delete <strong>"{deleteTarget.name}"</strong>?
              {deleteTarget.files.length > 0 &&
                ` This folder contains ${deleteTarget.files.length} file${deleteTarget.files.length !== 1 ? "s" : ""}.`}{" "}
              This action cannot be undone.
            </div>
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => setDeleteTarget(null)}
                className="rounded-xl"
              >
                Cancel
              </Button>
              <Button
                onClick={() => handleDelete(deleteTarget.id)}
                className="gap-2 rounded-xl bg-red-600 text-white hover:bg-red-700"
              >
                <Trash2 className="h-4 w-4" /> Delete
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Zoho Integration Modal */}
      <Modal
        open={zohoModalOpen}
        onClose={() => {
          if (!isConnectingZoho) setZohoModalOpen(false);
        }}
        title="Google Drive Integration"
      >
        <div className="space-y-4">
          <div className="flex items-center gap-4 bg-green-50 border border-green-100 p-4 rounded-xl">
            <div className="bg-card text-card-foreground p-2 rounded-xl shadow-sm border border-gray-100 flex items-center justify-center">
              <Cloud className="h-6 w-6 text-[#0F9D58]" />
            </div>
            <div>
              <p className="font-bold text-foreground text-sm">Google Drive Workspace</p>
              <p className="text-xs text-muted-foreground">
                {isZohoConnected ? "Status: Connected & Synchronized" : "Status: Not Connected"}
              </p>
            </div>
          </div>

          <p className="text-xs text-gray-600 leading-relaxed">
            {isZohoConnected
              ? "Your CRM documents are actively syncing with Google Drive. Files uploaded here are automatically transferred to your secure Google cloud."
              : "Connect your Google Drive account to seamlessly synchronize travel documents, booking vouchers, and passenger passports securely."}
          </p>

          <div className="flex justify-end gap-2 pt-2">
            <Button
              variant="outline"
              onClick={() => setZohoModalOpen(false)}
              disabled={isConnectingZoho}
              className="rounded-xl text-xs h-9"
            >
              Close
            </Button>
            {isZohoConnected ? (
              <Button
                onClick={() => {
                  if (
                    confirm(
                      "Disconnect Google Drive? Your files will remain but new uploads will save locally.",
                    )
                  ) {
                    setGoogleAccessToken("");
                    setZohoModalOpen(false);
                  }
                }}
                className="gap-2 rounded-xl bg-red-50 text-red-600 hover:bg-red-100 border border-red-200 text-xs font-semibold h-9"
              >
                <Unlink className="h-4 w-4" /> Disconnect
              </Button>
            ) : (
              <Button
                onClick={() => {
                  setIsConnectingZoho(true);
                  loginWithGoogle();
                }}
                disabled={isConnectingZoho}
                className="gap-2 rounded-xl bg-[#0F9D58] hover:bg-[#0B8043] text-white text-xs font-semibold h-9 min-w-[140px]"
              >
                {isConnectingZoho ? (
                  <>
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />{" "}
                    Connecting...
                  </>
                ) : (
                  <>
                    <Link2 className="h-4 w-4" /> Connect to Google Drive
                  </>
                )}
              </Button>
            )}
          </div>
        </div>
      </Modal>

      {/* Export Modal */}
      <Dialog open={isExportOpen} onOpenChange={setIsExportOpen}>
        <DialogContent className="rounded-3xl sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-display text-2xl">Export Folders</DialogTitle>
            <DialogDescription>
              Filter folders by created date before exporting.
            </DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-2 gap-4 mt-2">
            <div className="space-y-2">
              <label className="text-sm font-medium">Start Date</label>
              <Input
                type="date"
                className="rounded-xl"
                value={exportStartDate}
                onChange={(e) => setExportStartDate(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">End Date</label>
              <Input
                type="date"
                className="rounded-xl"
                value={exportEndDate}
                onChange={(e) => setExportEndDate(e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3 py-6">
            <button
              type="button"
              onClick={() => {
                exportToPDF();
                setIsExportOpen(false);
              }}
              className="flex flex-col items-center justify-center gap-2 rounded-xl border border-border p-4 hover:border-rose-300 hover:bg-rose-50/50 hover:text-rose-600 transition-all text-center group"
            >
              <div className="grid h-10 w-10 place-items-center rounded-lg bg-rose-50 text-rose-600 group-hover:bg-rose-100">
                <FileText className="h-5 w-5" />
              </div>
              <span className="text-xs font-semibold">PDF Report</span>
            </button>

            <button
              type="button"
              onClick={() => {
                exportToExcel();
                setIsExportOpen(false);
              }}
              className="flex flex-col items-center justify-center gap-2 rounded-xl border border-border p-4 hover:border-emerald-300 hover:bg-emerald-50/50 hover:text-emerald-600 transition-all text-center group"
            >
              <div className="grid h-10 w-10 place-items-center rounded-lg bg-emerald-50 text-emerald-600 group-hover:bg-emerald-100">
                <Table2 className="h-5 w-5" />
              </div>
              <span className="text-xs font-semibold">Excel (CSV)</span>
            </button>

            <button
              type="button"
              onClick={() => {
                exportToWord();
                setIsExportOpen(false);
              }}
              className="flex flex-col items-center justify-center gap-2 rounded-xl border border-border p-4 hover:border-blue-300 hover:bg-blue-50/50 hover:text-blue-600 transition-all text-center group"
            >
              <div className="grid h-10 w-10 place-items-center rounded-lg bg-blue-50 text-blue-600 group-hover:bg-blue-100">
                <Briefcase className="h-5 w-5" />
              </div>
              <span className="text-xs font-semibold">Word (.doc)</span>
            </button>
          </div>

          <DialogFooter className="border-t border-border pt-4">
            <Button
              type="button"
              variant="outline"
              className="rounded-xl"
              onClick={() => setIsExportOpen(false)}
            >
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
