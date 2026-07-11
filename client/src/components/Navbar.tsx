import React from 'react';
import { useAuthStore } from '../stores/authStore';
import { LogOut, User as UserIcon } from 'lucide-react';

export const Navbar = () => {
  const { user, logout } = useAuthStore();

  return (
    <nav className="border-b border-gray-800 bg-[#12121a]/80 backdrop-blur-md sticky top-0 z-50">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#00d09c] to-emerald-600 flex items-center justify-center font-bold text-white shadow-lg shadow-[#00d09c]/20">
              S
            </div>
            <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400">
              SplitKaro
            </span>
          </div>

          <div className="flex items-center gap-4">
            {user && (
              <>
                <div className="flex items-center gap-3">
                  {user.image ? (
                    <img src={user.image} alt={user.name} className="w-8 h-8 rounded-full border border-gray-700" />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-gray-800 flex items-center justify-center border border-gray-700">
                      <UserIcon className="w-4 h-4 text-gray-400" />
                    </div>
                  )}
                  <span className="text-sm font-medium text-gray-300 hidden sm:block">
                    {user.name}
                  </span>
                </div>
                <button
                  onClick={logout}
                  className="p-2 rounded-lg hover:bg-red-500/10 text-gray-400 hover:text-red-400 transition-colors"
                  title="Logout"
                >
                  <LogOut className="w-5 h-5" />
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};
