import { useEffect, useState } from 'react';
import { Navbar } from '../components/Navbar';
import { useGroupStore } from '../stores/groupStore';
import { GroupCard } from '../components/GroupCard';
import { CreateGroupDialog } from '../components/CreateGroupDialog';
import { Plus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const HomePage = () => {
  const { groups, isLoading, fetchGroups } = useGroupStore();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    fetchGroups();
  }, [fetchGroups]);

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white">
      <Navbar />
      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">Groups</h1>
          {groups.length > 0 && (
            <button 
              onClick={() => setIsCreateOpen(true)}
              className="flex items-center gap-2 bg-[#00d09c] hover:bg-[#00b386] text-black font-semibold py-2 px-4 rounded-xl transition-colors shadow-lg shadow-[#00d09c]/20"
            >
              <Plus className="w-5 h-5" />
              <span className="hidden sm:inline">Create Group</span>
            </button>
          )}
        </div>

        {isLoading ? (
          <div className="flex justify-center py-20">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#00d09c]"></div>
          </div>
        ) : groups.length === 0 ? (
          <div className="p-12 border border-gray-800 border-dashed rounded-2xl flex flex-col items-center justify-center text-center bg-[#12121a]/50">
            <div className="w-16 h-16 bg-gray-800 rounded-full flex items-center justify-center mb-4">
              <Plus className="w-8 h-8 text-gray-400" />
            </div>
            <h2 className="text-xl font-semibold mb-2">No Groups Yet</h2>
            <p className="text-gray-400 mb-6 max-w-sm">Create a group to start splitting expenses with your friends, family, or flatmates.</p>
            <button 
              onClick={() => setIsCreateOpen(true)}
              className="bg-[#00d09c] hover:bg-[#00b386] text-black font-semibold py-3 px-8 rounded-xl transition-colors shadow-lg shadow-[#00d09c]/20"
            >
              Create Group
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {groups.map((group) => (
              <GroupCard key={group.id} group={group} />
            ))}
          </div>
        )}
      </main>

      <CreateGroupDialog 
        isOpen={isCreateOpen} 
        onClose={() => setIsCreateOpen(false)} 
        onSuccess={(id) => navigate(`/groups/${id}`)}
      />
    </div>
  );
};

export default HomePage;
