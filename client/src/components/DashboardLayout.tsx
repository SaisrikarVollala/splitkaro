import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { useGroupStore } from '../stores/groupStore';
import { useTheme } from '../hooks/useTheme';
import { 
  LayoutDashboard, 
  Settings, 
  LogOut, 
  Menu, 
  X, 
  ChevronLeft, 
  ChevronRight, 
  Plus, 
  Users, 
  Bell, 
  Sun, 
  Moon,
  Wallet,
  ArrowRight
} from 'lucide-react';
import { Button } from './ui/button';
import { Avatar, AvatarImage, AvatarFallback } from './ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from './ui/popover';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export const DashboardLayout = ({ children }: DashboardLayoutProps) => {
  const { user, logout } = useAuthStore();
  const { groups, fetchGroups } = useGroupStore();
  const { theme, toggleTheme } = useTheme();
  const location = useLocation();
  const navigate = useNavigate();

  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  // Fetch groups on mount for sidebar list
  useEffect(() => {
    if (user) {
      fetchGroups();
    }
  }, [fetchGroups, user]);

  const navItems = [
    { name: 'Dashboard', path: '/', icon: LayoutDashboard },
  ];

  // Mock notifications
  const notifications = [
    { id: 1, text: "Rahul added 'Manali Dinner' in Manali Trip", time: "2 hours ago" },
    { id: 2, text: "You owe Arjun ₹450 for Fuel", time: "1 day ago" },
    { id: 3, text: "Settlement of ₹1,200 completed with Pooja", time: "3 days ago" },
  ];

  if (!user) return <>{children}</>;

  return (
    <div className="min-h-screen flex bg-background text-foreground transition-colors duration-200">
      {/* Mobile Sidebar Overlay */}
      {isMobileOpen && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-xs z-40 lg:hidden"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Sidebar Container */}
      <aside 
        className={`fixed inset-y-0 left-0 z-50 flex flex-col bg-card border-r border-border transition-all duration-300 lg:static lg:translate-x-0 ${
          isMobileOpen ? 'translate-x-0 w-64' : '-translate-x-full w-64 lg:translate-x-0'
        } ${!isSidebarOpen && 'lg:w-16'}`}
      >
        {/* Sidebar Header */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-border">
          <Link to="/" className="flex items-center gap-2.5 group overflow-hidden">
            <div className="w-8 h-8 shrink-0 rounded-lg bg-primary flex items-center justify-center font-bold text-primary-foreground shadow-sm group-hover:scale-105 transition-transform duration-200">
              S
            </div>
            {isSidebarOpen && (
              <span className="text-base font-semibold tracking-tight text-foreground transition-all duration-300">
                SplitKaro
              </span>
            )}
          </Link>
          
          {/* Collapse toggle (Desktop) */}
          <Button
            variant="ghost"
            size="icon-xs"
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="hidden lg:flex text-muted-foreground hover:text-foreground"
          >
            {isSidebarOpen ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
          </Button>

          {/* Close button (Mobile) */}
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => setIsMobileOpen(false)}
            className="lg:hidden text-muted-foreground hover:text-foreground"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>

        {/* Sidebar Navigation */}
        <div className="flex-1 overflow-y-auto py-6 px-3 space-y-7">
          {/* Main Links */}
          <div className="space-y-1">
            {navItems.map((item) => {
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.name}
                  to={item.path}
                  onClick={() => setIsMobileOpen(false)}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-semibold transition-all group ${
                    isActive 
                      ? 'bg-primary text-primary-foreground shadow-sm' 
                      : 'text-muted-foreground hover:text-foreground hover:bg-muted/60'
                  }`}
                  title={!isSidebarOpen ? item.name : undefined}
                >
                  <item.icon className="w-4.5 h-4.5 shrink-0" />
                  {isSidebarOpen && <span>{item.name}</span>}
                </Link>
              );
            })}
          </div>

          {/* Active Groups List */}
          <div className="space-y-2">
            {isSidebarOpen && (
              <div className="flex items-center justify-between px-3 mb-1">
                <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">
                  My Groups
                </span>
              </div>
            )}
            <div className="space-y-1">
              {groups.map((group) => {
                const isActive = location.pathname === `/groups/${group.id}`;
                return (
                  <Link
                    key={group.id}
                    to={`/groups/${group.id}`}
                    onClick={() => setIsMobileOpen(false)}
                    className={`flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-semibold transition-all group ${
                      isActive 
                        ? 'bg-muted text-foreground' 
                        : 'text-muted-foreground hover:text-foreground hover:bg-muted/30'
                    }`}
                    title={!isSidebarOpen ? group.name : undefined}
                  >
                    <div className="w-5 h-5 shrink-0 rounded-md bg-primary/10 flex items-center justify-center font-bold text-primary text-[10px]">
                      {group.name.charAt(0)}
                    </div>
                    {isSidebarOpen && <span className="truncate">{group.name}</span>}
                  </Link>
                );
              })}
            </div>
          </div>
        </div>

        {/* Sidebar Footer / User Profile */}
        <div className="p-4 border-t border-border mt-auto">
          <DropdownMenu>
            <DropdownMenuTrigger render={
              <button className="flex items-center gap-3 w-full text-left outline-none select-none hover:opacity-95 transition-opacity cursor-pointer">
                <Avatar size="sm" className="border border-border shrink-0">
                  {user.image ? <AvatarImage src={user.image} alt={user.name} /> : null}
                  <AvatarFallback>{user.name ? user.name.charAt(0) : 'U'}</AvatarFallback>
                </Avatar>
                {isSidebarOpen && (
                  <div className="truncate flex-1">
                    <p className="text-xs font-bold text-foreground leading-none">{user.name}</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5 truncate leading-none">{user.email}</p>
                  </div>
                )}
              </button>
            } />
            <DropdownMenuContent align="start" className="w-52 mb-1.5 ml-2 rounded-card bg-card border border-border shadow-lg z-50">
              <DropdownMenuLabel className="font-normal p-3">
                <div className="flex flex-col space-y-1">
                  <p className="text-xs font-semibold text-foreground leading-none">{user.name}</p>
                  <p className="text-[10px] text-muted-foreground leading-none mt-1 truncate">{user.email}</p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={logout} className="cursor-pointer text-xs" variant="destructive">
                <LogOut className="w-4 h-4 mr-2" />
                <span>Log out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </aside>

      {/* Main Workspace Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Navbar SiteHeader */}
        <header className="h-16 border-b border-border bg-card/85 backdrop-blur-md sticky top-0 z-30 px-4 sm:px-6 lg:px-8 flex justify-between items-center shrink-0">
          <div className="flex items-center gap-2">
            {/* Mobile Sidebar Trigger */}
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() => setIsMobileOpen(true)}
              className="lg:hidden text-muted-foreground hover:text-foreground cursor-pointer"
            >
              <Menu className="w-5 h-5" />
            </Button>
            
            {/* Breadcrumb Indicator */}
            <span className="text-xs font-bold text-muted-foreground tracking-wider uppercase">
              {location.pathname === '/' ? 'Dashboard' : 'Group Detail'}
            </span>
          </div>

          <div className="flex items-center gap-2">
            {/* Notifications Popover */}
            <Popover>
              <PopoverTrigger render={
                <Button variant="ghost" size="icon-sm" className="relative text-muted-foreground hover:text-foreground cursor-pointer">
                  <Bell className="w-4 h-4" />
                  <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-destructive rounded-full"></span>
                </Button>
              } />
              <PopoverContent align="end" className="w-80 p-0 rounded-card bg-card border border-border shadow-lg">
                <div className="p-4 border-b border-border flex justify-between items-center">
                  <span className="font-semibold text-sm">Notifications</span>
                  <span className="text-xs text-primary cursor-pointer hover:underline">Mark all read</span>
                </div>
                <div className="max-h-64 overflow-y-auto">
                  {notifications.map((notif) => (
                    <div key={notif.id} className="p-4 border-b border-border/50 last:border-0 hover:bg-muted/50 transition-colors text-xs">
                      <p className="text-foreground font-medium leading-normal mb-1">{notif.text}</p>
                      <span className="text-[10px] text-muted-foreground">{notif.time}</span>
                    </div>
                  ))}
                </div>
              </PopoverContent>
            </Popover>

            {/* Theme Toggle */}
            <Button 
              onClick={toggleTheme} 
              variant="ghost" 
              size="icon-sm"
              className="text-muted-foreground hover:text-foreground cursor-pointer"
            >
              {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </Button>
          </div>
        </header>

        {/* Content Viewport */}
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
};
