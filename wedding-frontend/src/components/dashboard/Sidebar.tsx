"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Heart,
  LayoutDashboard,
  Users,
  Calendar,
  UtensilsCrossed,
  Armchair,
  Mail,
  Settings,
  LogOut,
  ChevronDown,
  ChevronRight,
  Plus,
  ExternalLink,
  CheckSquare,
  Bell,
  Gift,
  Store,
  ChefHat,
  Briefcase,
  ClipboardList,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

// Navigation item types
interface NavItem {
  name: string;
  href: string;
  icon: LucideIcon;
}

interface NavSection {
  name: string;
  icon: LucideIcon;
  children: NavItem[];
}

type NavigationEntry = NavItem | NavSection;

// Helper to check if entry is a section (has children)
function isSection(entry: NavigationEntry): entry is NavSection {
  return "children" in entry;
}

// Main navigation items
const navigation: NavigationEntry[] = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Guests", href: "/dashboard/guests", icon: Users },
  { name: "Events", href: "/dashboard/events", icon: Calendar },
  { name: "Seating", href: "/dashboard/seating", icon: Armchair },
  // My Requests section - couple's preferences for vendors to confirm
  {
    name: "My Requests",
    icon: ClipboardList,
    children: [
      { name: "Meals", href: "/dashboard/meals", icon: UtensilsCrossed },
      // Future requests (uncomment when ready):
      // { name: "Music Playlist", href: "/dashboard/music-requests", icon: Music },
      // { name: "Cake Design", href: "/dashboard/cake-requests", icon: Cake },
      // { name: "Dress & Suits", href: "/dashboard/dress-requests", icon: Scissors },
    ],
  },
  // Services section - vendor portals to confirm/manage requests
  {
    name: "Services",
    icon: Briefcase,
    children: [
      { name: "Restaurant", href: "/dashboard/restaurant-access", icon: ChefHat },
      // Future services (uncomment when ready):
      // { name: "DJ", href: "/dashboard/dj-portal", icon: Music },
      // { name: "Bakery", href: "/dashboard/bakery-portal", icon: Cake },
      // { name: "Tailor", href: "/dashboard/tailor-portal", icon: Scissors },
    ],
  },
  { name: "Vendors", href: "/dashboard/vendors", icon: Store },
  { name: "Registry", href: "/dashboard/registry", icon: Gift },
  { name: "Todos", href: "/dashboard/todos", icon: CheckSquare },
  { name: "Notifications", href: "/dashboard/notifications", icon: Bell },
  { name: "Emails", href: "/dashboard/emails", icon: Mail },
  { name: "Settings", href: "/dashboard/settings", icon: Settings },
];

interface SidebarProps {
  mobile?: boolean;
  onNavigate?: () => void;
}

export function Sidebar({ mobile = false, onNavigate }: SidebarProps) {
  const pathname = usePathname();
  const { user, wedding, weddings, logout, selectWedding } = useAuth();
  const [expandedSections, setExpandedSections] = useState<string[]>(["My Requests", "Services"]);

  // Check if any child route is active
  const isSectionActive = (section: NavSection) => {
    return section.children.some(
      (child) => pathname === child.href || pathname.startsWith(child.href)
    );
  };

  // Toggle section expand/collapse
  const toggleSection = (sectionName: string) => {
    setExpandedSections((prev) =>
      prev.includes(sectionName)
        ? prev.filter((name) => name !== sectionName)
        : [...prev, sectionName]
    );
  };

  // Render a single nav item
  const renderNavItem = (item: NavItem, isChild = false) => {
    const isActive =
      pathname === item.href ||
      (item.href !== "/dashboard" && pathname.startsWith(item.href));

    return (
      <Link
        key={item.name}
        href={item.href}
        onClick={onNavigate}
        className={cn(
          "flex items-center gap-3 rounded-lg text-sm font-medium transition-colors",
          isChild ? "px-3 py-2 ml-6" : "px-3 py-2.5",
          isActive
            ? "bg-rose-100 text-rose-700"
            : "text-gray-600 hover:bg-rose-50 hover:text-rose-600"
        )}
      >
        <item.icon
          className={cn(
            isChild ? "h-4 w-4" : "h-5 w-5",
            isActive ? "text-rose-600" : "text-gray-400"
          )}
        />
        {item.name}
      </Link>
    );
  };

  // Render a section with children
  const renderSection = (section: NavSection) => {
    const isExpanded = expandedSections.includes(section.name);
    const hasActiveChild = isSectionActive(section);

    return (
      <div key={section.name}>
        <button
          onClick={() => toggleSection(section.name)}
          className={cn(
            "flex items-center justify-between w-full px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
            hasActiveChild
              ? "bg-rose-50 text-rose-700"
              : "text-gray-600 hover:bg-rose-50 hover:text-rose-600"
          )}
        >
          <div className="flex items-center gap-3">
            <section.icon
              className={cn("h-5 w-5", hasActiveChild ? "text-rose-600" : "text-gray-400")}
            />
            {section.name}
          </div>
          <ChevronRight
            className={cn(
              "h-4 w-4 transition-transform duration-200",
              isExpanded && "rotate-90",
              hasActiveChild ? "text-rose-600" : "text-gray-400"
            )}
          />
        </button>
        {isExpanded && (
          <div className="mt-1 space-y-1">
            {section.children.map((child) => renderNavItem(child, true))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className={cn("flex flex-col h-full", mobile ? "pt-4" : "")}>
      {/* Logo */}
      <div className="px-4 py-4 border-b border-rose-100">
        <Link href="/dashboard" className="flex items-center gap-2" onClick={onNavigate}>
          <Heart className="h-7 w-7 text-rose-500 fill-rose-500" />
          <span className="text-xl font-serif font-bold text-gray-900">WeddingPlanner</span>
        </Link>
      </div>

      {/* Wedding Selector */}
      <div className="px-4 py-4 border-b border-rose-100">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="w-full justify-between border-rose-200">
              <span className="truncate font-medium">
                {wedding?.display_name || "Select Wedding"}
              </span>
              <ChevronDown className="h-4 w-4 ml-2 shrink-0" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-56">
            <DropdownMenuLabel>Your Weddings</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {Array.isArray(weddings) && weddings.map((w) => (
              <DropdownMenuItem
                key={w.id}
                onClick={() => selectWedding(w.id)}
                className={cn(
                  "cursor-pointer",
                  wedding?.id === w.id && "bg-rose-50"
                )}
              >
                {w.display_name}
              </DropdownMenuItem>
            ))}
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href="/create-wedding" className="flex items-center gap-2">
                <Plus className="h-4 w-4" />
                Create New Wedding
              </Link>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-2 py-4 space-y-1 overflow-y-auto">
        {navigation.map((entry) =>
          isSection(entry) ? renderSection(entry) : renderNavItem(entry)
        )}
      </nav>

      {/* Preview Website Link */}
      {wedding && (
        <div className="px-4 py-3 border-t border-rose-100">
          <Link
            href={`/w/${wedding.slug}`}
            target="_blank"
            className="flex items-center gap-2 text-sm text-rose-600 hover:text-rose-700"
          >
            <ExternalLink className="h-4 w-4" />
            Preview Wedding Website
          </Link>
        </div>
      )}

      {/* User Menu */}
      <div className="px-4 py-4 border-t border-rose-100">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="w-full justify-start gap-3 px-3">
              <div className="w-8 h-8 bg-rose-100 rounded-full flex items-center justify-center">
                <span className="text-sm font-medium text-rose-600">
                  {user?.first_name?.[0]?.toUpperCase() || "U"}
                </span>
              </div>
              <div className="flex-1 text-left">
                <p className="text-sm font-medium text-gray-900">
                  {user?.first_name} {user?.last_name}
                </p>
                <p className="text-xs text-gray-500 truncate">{user?.email}</p>
              </div>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuItem asChild>
              <Link href="/dashboard/settings">
                <Settings className="h-4 w-4 mr-2" />
                Settings
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={logout} className="text-red-600">
              <LogOut className="h-4 w-4 mr-2" />
              Sign Out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}
