'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@fiscalzen/ui';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@fiscalzen/ui';
import {
  LayoutDashboard,
  Building2,
  FileText,
  FileCheck,
  Download,
  Upload,
  Server,
  Settings,
  X,
} from 'lucide-react';

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Empresas', href: '/empresas', icon: Building2 },
  { name: 'Documentos', href: '/documentos', icon: FileText },
  { name: 'Downloads', href: '/downloads', icon: Download },
  { name: 'Manifestacao', href: '/manifestacao', icon: FileCheck },
  { name: 'Upload', href: '/upload', icon: Upload },
  { name: 'Agentes', href: '/agentes', icon: Server },
  { name: 'Configuracoes', href: '/configuracoes', icon: Settings },
];

interface MobileNavProps {
  open: boolean;
  onClose: () => void;
}

export function MobileNav({ open, onClose }: MobileNavProps) {
  const pathname = usePathname();

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="h-full max-h-screen w-full max-w-xs p-0 sm:max-w-xs">
        <DialogHeader className="border-b p-4">
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
                <FileText className="h-5 w-5 text-primary-foreground" />
              </div>
              <span>FiscalZen</span>
            </DialogTitle>
            <button
              onClick={onClose}
              className="rounded-lg p-1 text-gray-500 hover:bg-gray-100"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </DialogHeader>

        <nav className="flex flex-col gap-1 p-4">
          {navigation.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
              <Link
                key={item.name}
                href={item.href}
                onClick={onClose}
                className={cn(
                  'flex items-center gap-3 rounded-lg px-3 py-3 text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-primary text-primary-foreground'
                    : 'text-gray-700 hover:bg-gray-100'
                )}
              >
                <item.icon className="h-5 w-5" />
                {item.name}
              </Link>
            );
          })}
        </nav>

        <div className="mt-auto border-t p-4">
          <p className="text-xs text-muted-foreground">FiscalZen v0.1.0</p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
