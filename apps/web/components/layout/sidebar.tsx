'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@fiscalzen/ui';
import {
  LayoutDashboard,
  Building2,
  FileText,
  FileCheck,
  Upload,
  Server,
  Settings,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { useState } from 'react';

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Empresas', href: '/empresas', icon: Building2 },
  { name: 'Documentos', href: '/documentos', icon: FileText },
  { name: 'Manifestacao', href: '/manifestacao', icon: FileCheck },
  { name: 'Upload', href: '/upload', icon: Upload },
  { name: 'Agentes', href: '/agentes', icon: Server },
];

const bottomNavigation = [
  { name: 'Configuracoes', href: '/configuracoes', icon: Settings },
];

interface SidebarProps {
  collapsed?: boolean;
  onCollapse?: (collapsed: boolean) => void;
}

export function Sidebar({ collapsed = false, onCollapse }: SidebarProps) {
  const pathname = usePathname();
  const [isCollapsed, setIsCollapsed] = useState(collapsed);

  const toggleCollapse = () => {
    const newState = !isCollapsed;
    setIsCollapsed(newState);
    onCollapse?.(newState);
  };

  return (
    <div
      className={cn(
        'hidden flex-shrink-0 border-r bg-white transition-all duration-300 lg:flex lg:flex-col',
        isCollapsed ? 'w-16' : 'w-64'
      )}
    >
      {/* Logo */}
      <div className="flex h-16 items-center justify-between border-b px-4">
        <Link href="/dashboard" className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
            <FileText className="h-5 w-5 text-primary-foreground" />
          </div>
          {!isCollapsed && <span className="text-xl font-bold">FiscalZen</span>}
        </Link>
        <button
          onClick={toggleCollapse}
          className="rounded-lg p-1 text-gray-500 hover:bg-gray-100"
        >
          {isCollapsed ? (
            <ChevronRight className="h-5 w-5" />
          ) : (
            <ChevronLeft className="h-5 w-5" />
          )}
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex flex-1 flex-col justify-between">
        <div className="space-y-1 px-3 py-4">
          {navigation.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                  isCollapsed && 'justify-center',
                  isActive
                    ? 'bg-primary text-primary-foreground'
                    : 'text-gray-700 hover:bg-gray-100'
                )}
                title={isCollapsed ? item.name : undefined}
              >
                <item.icon className="h-5 w-5 flex-shrink-0" />
                {!isCollapsed && item.name}
              </Link>
            );
          })}
        </div>

        {/* Bottom Navigation */}
        <div className="border-t px-3 py-4">
          {bottomNavigation.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                  isCollapsed && 'justify-center',
                  isActive
                    ? 'bg-primary text-primary-foreground'
                    : 'text-gray-700 hover:bg-gray-100'
                )}
                title={isCollapsed ? item.name : undefined}
              >
                <item.icon className="h-5 w-5 flex-shrink-0" />
                {!isCollapsed && item.name}
              </Link>
            );
          })}

          {!isCollapsed && (
            <p className="mt-4 px-3 text-xs text-muted-foreground">
              FiscalZen v0.1.0
            </p>
          )}
        </div>
      </nav>
    </div>
  );
}
