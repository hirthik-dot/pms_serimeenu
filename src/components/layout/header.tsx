'use client';

import { LogOut, Menu, Moon, Search, Sun, User } from 'lucide-react';
import Link from 'next/link';
import { useTheme } from 'next-themes';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { ROLE_DISPLAY_NAMES } from '@/constants/auth-routes';
import { cn } from '@/lib/utils';
import { useAuth } from '@/providers/auth-provider';

import { useSidebarContext } from './sidebar-context';

interface HeaderProps {
  onOpenCommandPalette?: () => void;
}

export function Header({ onOpenCommandPalette }: HeaderProps) {
  const { collapsed, toggleCollapsed, toggleMobileOpen } = useSidebarContext();
  const { setTheme, theme } = useTheme();
  const { user, logout } = useAuth();

  const initials = `${user?.firstName?.[0] ?? ''}${user?.lastName?.[0] ?? ''}`.toUpperCase();
  const displayName = user ? `${user.firstName} ${user.lastName}` : 'User';
  const roleLabel = user ? ROLE_DISPLAY_NAMES[user.role] : '';

  return (
    <header
      className={cn(
        'sticky top-0 z-30 flex h-14 items-center gap-4 border-b bg-background/95 px-4 backdrop-blur supports-[backdrop-filter]:bg-background/60',
        collapsed ? 'lg:pl-[calc(4.5rem+1rem)]' : 'lg:pl-[calc(16rem+1rem)]',
      )}
    >
      <Button
        variant="ghost"
        size="icon"
        className="lg:hidden"
        onClick={toggleMobileOpen}
        aria-label="Open navigation menu"
      >
        <Menu className="h-4 w-4" />
      </Button>

      <Button
        variant="ghost"
        size="icon"
        className="hidden lg:inline-flex"
        onClick={toggleCollapsed}
        aria-label="Toggle sidebar"
      >
        <Menu className="h-4 w-4" />
      </Button>

      <div className="relative hidden max-w-md flex-1 md:block">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          className="pl-9"
          placeholder="Search patients, appointments..."
          onFocus={onOpenCommandPalette}
          readOnly
        />
      </div>

      <div className="ml-auto flex items-center gap-2">
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden"
          onClick={onOpenCommandPalette}
          aria-label="Open command palette"
        >
          <Search className="h-4 w-4" />
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" aria-label="Toggle theme">
              <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
              <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Theme</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => setTheme('light')}>Light</DropdownMenuItem>
            <DropdownMenuItem onClick={() => setTheme('dark')}>Dark</DropdownMenuItem>
            <DropdownMenuItem onClick={() => setTheme('system')}>
              System {theme === 'system' ? '(active)' : ''}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <Separator orientation="vertical" className="h-6" />

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              className="flex items-center gap-2 rounded-md px-1 py-1 text-left hover:bg-accent"
            >
              <Avatar className="h-8 w-8">
                {user?.avatar ? <AvatarImage src={user.avatar} alt={displayName} /> : null}
                <AvatarFallback>{initials || 'U'}</AvatarFallback>
              </Avatar>
              <div className="hidden text-sm lg:block">
                <p className="font-medium leading-none">{displayName}</p>
                <p className="text-muted-foreground">{roleLabel}</p>
              </div>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuLabel>My Account</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href="/profile">
                <User className="mr-2 h-4 w-4" />
                Profile
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => logout()}>
              <LogOut className="mr-2 h-4 w-4" />
              Sign out
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => logout({ allDevices: true })}>
              Sign out all devices
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
