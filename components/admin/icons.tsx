/**
 * Premium Lucide icon set for Owner Admin Panel V2.
 * Outline style · consistent stroke · executive SaaS quality.
 */
import type { LucideIcon } from "lucide-react";
import type { SVGProps } from "react";
import {
  LayoutDashboard,
  LineChart,
  Stethoscope,
  Users,
  CalendarCheck,
  HeartPulse,
  Star,
  Archive,
  FileText,
  Download,
  Layout,
  Bell,
  Settings,
  LogOut,
  Search,
  Plus,
  Pencil,
  Trash2,
  X,
  Menu,
  ChevronRight,
  ChevronDown,
  ChevronLeft,
  Check,
  Eye,
  EyeOff,
  Reply,
  Phone,
  Mail,
  Clock,
  Calendar,
  Banknote,
  TrendingUp,
  TrendingDown,
  Heart,
  Sparkles,
  Globe,
  Shield,
  Filter,
  Activity,
  Wallet,
  Package,
  UserCircle,
} from "lucide-react";

type P = SVGProps<SVGSVGElement> & { filled?: boolean };

function wrap(Icon: LucideIcon, opts?: { fillWhenFilled?: boolean; nav?: boolean }) {
  return function AdminIcon({ filled, style, className, ...rest }: P) {
    const w = style?.width;
    const size = typeof w === "number" ? w : 20;
    return (
      <Icon
        size={size}
        strokeWidth={opts?.nav ? 2.25 : 1.5}
        style={style}
        className={className}
        fill={opts?.fillWhenFilled && filled ? "currentColor" : "none"}
        {...rest}
      />
    );
  };
}

/** Sidebar nav — slightly bolder strokes for soft 3D tiles (still Lucide SVG, zero extra weight). */
function wrapNav(Icon: LucideIcon, opts?: { fillWhenFilled?: boolean }) {
  return wrap(Icon, { ...opts, nav: true });
}

export const IDashboard = wrapNav(LayoutDashboard);
export const IAnalytics = wrapNav(LineChart);
export const IDoctors = wrapNav(Stethoscope);
export const IPatients = wrapNav(Users);
export const IAppointments = wrapNav(CalendarCheck);
export const IServices = wrapNav(HeartPulse);
export const IReviews = wrapNav(Star, { fillWhenFilled: true });
export const IArchive = wrapNav(Archive);
export const IReports = wrapNav(FileText);
export const IExports = wrapNav(Download);
export const IContent = wrapNav(Layout);
export const INotifications = wrapNav(Bell);
export const ISettings = wrapNav(Settings);
export const ILogout = wrap(LogOut);

export const ISearch = wrap(Search);
export const IPlus = wrap(Plus);
export const IEdit = wrap(Pencil);
export const ITrash = wrap(Trash2);
export const IClose = wrap(X);
export const IMenu = wrap(Menu);
export const IChevronRight = wrap(ChevronRight);
export const IChevronDown = wrap(ChevronDown);
export const IArrowLeft = wrap(ChevronLeft);
export const ICheck = wrap(Check);
export const IEye = wrap(Eye);
export const IEyeOff = wrap(EyeOff);
export const IReply = wrap(Reply);
export const IStar = wrap(Star, { fillWhenFilled: true });
export const IPhone = wrap(Phone);
export const IMail = wrap(Mail);
export const IClock = wrap(Clock);
export const ICalendar = wrap(Calendar);
export const IMoney = wrap(Banknote);
export const ITrendUp = wrap(TrendingUp);
export const ITrendDown = wrap(TrendingDown);
export const IHeart = wrap(Heart);
export const ISpark = wrap(Sparkles);
export const IUsers = IPatients;
export const IGlobe = wrap(Globe);
export const IShield = wrap(Shield);
export const IDownload = IExports;
export const IFilter = wrap(Filter);
export const IActivity = wrapNav(Activity);
export const IWallet = wrap(Wallet);
export const IInventory = wrap(Package);
export const IUserCircle = wrap(UserCircle);
