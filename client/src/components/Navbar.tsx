import React from 'react';
import { Link } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { useTheme } from '../hooks/useTheme';
import { 
  LogOut, 
  User as UserIcon, 
  Bell, 
  Sun, 
  Moon, 
  Settings, 
  User, 
  CreditCard,
  Layers
} from 'lucide-react';
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
import { Button } from './ui/button';
import { Avatar, AvatarImage, AvatarFallback } from './ui/avatar';

export const Navbar = () => {
  const { user, logout } = useAuthStore();
  const { theme, toggleTheme } = useTheme();

  // Mock notifications for UI demonstration
  const notifications = [
    { id: 1, text: "Rahul added 'Manali Dinner' in Manali Trip", time: "2 hours ago" },
    { id: 2, text: "You owe Arjun ₹450 for Fuel", time: "1 day ago" },
    { id: 3, text: "Settlement of ₹1,200 completed with Pooja", time: "3 days ago" },
  ];

  return (
    <nav className="h-16 border-b border-border bg-card/85 backdrop-blur-md sticky top-0 z-50 transition-colors duration-200">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 h-full">
        <div className="flex justify-between items-center h-full">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center font-bold text-primary-foreground shadow-sm group-hover:scale-105 transition-transform duration-200">
              S
            </div>
            <span className="text-lg font-semibold tracking-tight text-foreground">
              SplitKaro
            </span>
          </Link>

          {/* Navigation & Controls */}
          <div className="flex items-center gap-2">
            {user && (
              <>
                {/* Groups Navigation Link */}
                <Link 
                  to="/" 
                  className="text-sm font-medium text-muted-foreground hover:text-foreground px-3 py-1.5 rounded-btn hover:bg-muted transition-colors mr-2 hidden sm:block"
                >
                  Dashboard
                </Link>

                {/* Notifications Popover */}
                <Popover>
                  <PopoverTrigger render={
                    <Button variant="ghost" size="icon-sm" className="relative text-muted-foreground hover:text-foreground">
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
                      {notifications.length > 0 ? (
                        notifications.map((notif) => (
                          <div key={notif.id} className="p-4 border-b border-border/50 last:border-0 hover:bg-muted/50 transition-colors text-xs">
                            <p className="text-foreground font-medium leading-normal mb-1">{notif.text}</p>
                            <span className="text-[10px] text-muted-foreground">{notif.time}</span>
                          </div>
                        ))
                      ) : (
                        <div className="p-8 text-center text-muted-foreground text-xs">
                          No new notifications
                        </div>
                      )}
                    </div>
                  </PopoverContent>
                </Popover>

                {/* Theme Toggle */}
                <Button 
                  onClick={toggleTheme} 
                  variant="ghost" 
                  size="icon-sm"
                  className="text-muted-foreground hover:text-foreground"
                >
                  {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                </Button>

                {/* Avatar / Profile Dropdown */}
                <DropdownMenu>
                  <DropdownMenuTrigger render={
                    <button className="flex items-center outline-none select-none ml-1">
                      <Avatar size="sm" className="border border-border cursor-pointer hover:opacity-95 transition-opacity">
                        {user.image ? (
                          <AvatarImage src={user.image} alt={user.name} />
                        ) : null}
                        <AvatarFallback>{user.name ? user.name.charAt(0) : 'U'}</AvatarFallback>
                      </Avatar>
                    </button>
                  } />
                  <DropdownMenuContent align="end" className="w-56 mt-1 rounded-card bg-card border border-border shadow-lg">
                    <DropdownMenuLabel className="font-normal p-3">
                      <div className="flex flex-col space-y-1">
                        <p className="text-sm font-semibold text-foreground leading-none">{user.name}</p>
                        <p className="text-xs text-muted-foreground leading-none mt-1 truncate">{user.email}</p>
                      </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem className="cursor-pointer">
                      <User className="w-4 h-4 mr-2 text-muted-foreground" />
                      <span>Profile</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem className="cursor-pointer">
                      <Settings className="w-4 h-4 mr-2 text-muted-foreground" />
                      <span>Settings</span>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={logout} className="cursor-pointer" variant="destructive">
                      <LogOut className="w-4 h-4 mr-2" />
                      <span>Log out</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};
