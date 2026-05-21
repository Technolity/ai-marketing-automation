/**
 * Central icon library — wraps @hugeicons/react + @hugeicons/core-free-icons
 * into Lucide-compatible drop-in components.
 *
 * Style: stroke-rounded, strokeWidth 1.5 (premium SaaS default)
 * All icons accept: className, size, color, strokeWidth, style
 */
import { HugeiconsIcon } from "@hugeicons/react";
import {
  // Navigation & layout
  Menu01Icon,
  Cancel01Icon,
  ArrowLeft01Icon,
  ArrowRight01Icon,
  ArrowUpIcon,
  ArrowDown01Icon,
  DashboardBrowsingIcon,
  GridViewIcon,

  // Users & people
  UserGroup02Icon,
  UserIcon,

  // Admin nav
  KanbanIcon,
  FolderKanbanIcon,
  Database01Icon,
  FileIcon,
  BookOpen01Icon,
  CreditCardAcceptIcon,
  Settings01Icon,
  Megaphone01Icon,
  Message01Icon,
  ShieldIcon,
  Shield01Icon,
  CheckmarkCircle01Icon,
  LogoutIcon,

  // Indicators & status
  AlertCircleIcon,
  Clock01Icon,
  Loading01Icon,
  Tick01Icon,
  Refresh01Icon,

  // Content & actions
  Edit01Icon,
  Delete01Icon,
  EyeIcon,
  Upload01Icon,
  Image01Icon,
  ClipboardIcon,

  // Landing & marketing
  Analytics01Icon,
  Mail01Icon,
  MapPinIcon,
  SparklesIcon,
  ZapIcon,
  CpuIcon,
  Rocket01Icon,
  Idea01Icon,
  Bug01Icon,
  ImageAdd01Icon,
  Add01Icon,
  Download01Icon,
} from "@hugeicons/core-free-icons";

/** Creates a Lucide-compatible wrapper around a HugeIcons icon */
function hi(iconData) {
  const Wrapper = ({ className, size, color, strokeWidth = 1.5, style, ...rest }) => (
    <HugeiconsIcon
      icon={iconData}
      className={className}
      size={size}
      color={color ?? "currentColor"}
      strokeWidth={strokeWidth}
      style={style}
      {...rest}
    />
  );
  Wrapper.displayName = iconData?.name ?? "HugeIcon";
  return Wrapper;
}

// ─── Navigation & Layout ─────────────────────────────────────────────────────
export const Menu        = hi(Menu01Icon);
export const X           = hi(Cancel01Icon);
export const ChevronLeft = hi(ArrowLeft01Icon);
export const ChevronRight= hi(ArrowRight01Icon);
export const ArrowUp     = hi(ArrowUpIcon);
export const ChevronDown = hi(ArrowDown01Icon);

// ─── Dashboard & Admin Nav ────────────────────────────────────────────────────
export const LayoutDashboard = hi(DashboardBrowsingIcon);
export const GridView        = hi(GridViewIcon);
export const FolderKanban    = hi(FolderKanbanIcon);
export const Database        = hi(Database01Icon);
export const FileText        = hi(FileIcon);
export const BookOpen        = hi(BookOpen01Icon);
export const CreditCard      = hi(CreditCardAcceptIcon);
export const Settings        = hi(Settings01Icon);
export const Megaphone       = hi(Megaphone01Icon);
export const MessageSquare   = hi(Message01Icon);
export const Shield          = hi(ShieldIcon);
export const BadgeCheck      = hi(CheckmarkCircle01Icon);
export const LogOut          = hi(LogoutIcon);

// ─── Users ────────────────────────────────────────────────────────────────────
export const Users = hi(UserGroup02Icon);
export const User  = hi(UserIcon);

// ─── Status & Indicators ──────────────────────────────────────────────────────
export const AlertCircle  = hi(AlertCircleIcon);
export const CheckCircle  = hi(CheckmarkCircle01Icon);
export const CheckCircle2 = hi(CheckmarkCircle01Icon);
export const Clock        = hi(Clock01Icon);
export const Loader2      = hi(Loading01Icon);
export const Check        = hi(Tick01Icon);
export const RefreshCw    = hi(Refresh01Icon);

// ─── Content & Actions ────────────────────────────────────────────────────────
export const Pencil       = hi(Edit01Icon);
export const Edit         = hi(Edit01Icon);
export const Trash2       = hi(Delete01Icon);
export const Eye          = hi(EyeIcon);
export const Upload       = hi(Upload01Icon);
export const ImageIcon    = hi(Image01Icon);
export const ImageAdd     = hi(ImageAdd01Icon);
export const Clipboard    = hi(ClipboardIcon);
export const ClipboardList= hi(ClipboardIcon);

// ─── Landing & Marketing ──────────────────────────────────────────────────────
export const TrendingUp = hi(Analytics01Icon);
export const Mail       = hi(Mail01Icon);
export const MapPin     = hi(MapPinIcon);
export const Sparkles   = hi(SparklesIcon);
export const Zap        = hi(ZapIcon);
export const Cpu        = hi(CpuIcon);
export const Rocket     = hi(Rocket01Icon);
export const Lightbulb  = hi(Idea01Icon);
export const Bug        = hi(Bug01Icon);
export const Plus       = hi(Add01Icon);
export const Download   = hi(Download01Icon);
