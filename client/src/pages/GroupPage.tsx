import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Navbar } from '../components/Navbar';
import { useActiveGroupStore } from '../stores/activeGroupStore';
import { MemberCard } from '../components/MemberCard';
import { ActivityItem } from '../components/ActivityItem';
import { ExpenseCard } from '../components/ExpenseCard';
import { ExpenseForm } from '../components/ExpenseForm';
import { useExpenseStore } from '../stores/expenseStore';
import { useAuthStore } from '../stores/authStore';
import { api } from '../lib/api';
import { Users, Receipt, Activity, Share2, Plus, Loader2 } from 'lucide-react';

type Tab = 'members' | 'expenses' | 'activity';

const GroupPage = () => {
  const { id } = useParams<{ id: string }>();
  const [activeTab, setActiveTab] = useState<Tab>('members');
  const [copied, setCopied] = useState(false);
  const [isAddExpenseOpen, setIsAddExpenseOpen] = useState(false);
  
  const [settlementTarget, setSettlementTarget] = useState<{ id: string; name: string; balance: number } | null>(null);
  const [isSettleLoading, setIsSettleLoading] = useState(false);

  const { user } = useAuthStore();
  const { 
    currentGroup, members, activities, isLoading, error,
    fetchGroupDetails, fetchMembers, fetchActivities 
  } = useActiveGroupStore();

  const { expenses, fetchExpenses } = useExpenseStore();

  useEffect(() => {
    if (id) {
      fetchGroupDetails(id);
      fetchMembers(id);
      fetchActivities(id);
      fetchExpenses(id);
    }
  }, [id, fetchGroupDetails, fetchMembers, fetchActivities, fetchExpenses]);

  const handleConfirmSettlement = async () => {
    if (!id || !settlementTarget || !user) return;
    setIsSettleLoading(true);
    try {
      const payerId = settlementTarget.balance > 0 ? settlementTarget.id : user.id;
      const payeeId = settlementTarget.balance > 0 ? user.id : settlementTarget.id;
      const amount = Math.abs(settlementTarget.balance);

      await api.post(`/api/groups/${id}/settlements`, {
        payerId,
        payeeId,
        amount
      });
      
      await fetchMembers(id);
      await fetchActivities(id);
      setSettlementTarget(null);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSettleLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] text-white flex flex-col">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-[#00d09c]" />
        </div>
      </div>
    );
  }

  if (error || !currentGroup) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] text-white">
        <Navbar />
        <div className="max-w-5xl mx-auto px-4 py-8 text-center">
          <h2 className="text-2xl font-bold text-red-500 mb-2">Error</h2>
          <p className="text-gray-400">{error || 'Group not found'}</p>
        </div>
      </div>
    );
  }

  const handleCopyInvite = () => {
    if (currentGroup.invitation) {
      const link = `${window.location.origin}/invite/${currentGroup.invitation.token}`;
      navigator.clipboard.writeText(link);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white">
      <Navbar />
      
      {/* Group Header */}
      <div className="bg-[#12121a] border-b border-gray-800 pt-8 pb-4">
        <div className="max-w-3xl mx-auto px-4 sm:px-6">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h1 className="text-3xl font-bold mb-2">{currentGroup.name}</h1>
              <div className="flex items-center gap-2 text-gray-400 text-sm">
                <Users className="w-4 h-4" />
                <span>{currentGroup._count?.members || 1} Members</span>
              </div>
            </div>
            
            <button
              onClick={handleCopyInvite}
              className="flex items-center gap-2 bg-gray-800 hover:bg-gray-700 text-white py-2 px-4 rounded-xl transition-colors text-sm font-medium border border-gray-700"
            >
              <Share2 className="w-4 h-4" />
              <span className="hidden sm:inline">{copied ? 'Copied!' : 'Invite Link'}</span>
            </button>
          </div>

          {/* Tabs */}
          <div className="flex gap-6 border-b border-gray-800 relative">
            <button
              onClick={() => setActiveTab('members')}
              className={`pb-4 text-sm font-medium flex items-center gap-2 transition-colors ${activeTab === 'members' ? 'text-[#00d09c]' : 'text-gray-400 hover:text-gray-200'}`}
            >
              <Users className="w-4 h-4" />
              Members
            </button>
            <button
              onClick={() => setActiveTab('expenses')}
              className={`pb-4 text-sm font-medium flex items-center gap-2 transition-colors ${activeTab === 'expenses' ? 'text-[#00d09c]' : 'text-gray-400 hover:text-gray-200'}`}
            >
              <Receipt className="w-4 h-4" />
              Expenses
            </button>
            <button
              onClick={() => setActiveTab('activity')}
              className={`pb-4 text-sm font-medium flex items-center gap-2 transition-colors ${activeTab === 'activity' ? 'text-[#00d09c]' : 'text-gray-400 hover:text-gray-200'}`}
            >
              <Activity className="w-4 h-4" />
              Activity
            </button>
            
            {/* Active Tab Indicator (simplified) */}
            <div 
              className="absolute bottom-0 h-0.5 bg-[#00d09c] transition-all duration-300"
              style={{
                width: activeTab === 'members' ? '90px' : activeTab === 'expenses' ? '95px' : '85px',
                left: activeTab === 'members' ? '0' : activeTab === 'expenses' ? '110px' : '230px'
              }}
            />
          </div>
        </div>
      </div>

      {/* Tab Content */}
      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
        
        {/* Members Tab */}
        {activeTab === 'members' && (
          <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-300">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-semibold">Group Members</h3>
            </div>
            {members.map(member => (
              <MemberCard 
                key={member.id} 
                member={member} 
                onSettleUp={(memberId, name, balance) => setSettlementTarget({ id: memberId, name, balance })}
              />
            ))}
          </div>
        )}

        {/* Expenses Tab */}
        {activeTab === 'expenses' && (
          <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-300">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-semibold">Expenses</h3>
              <button 
                onClick={() => setIsAddExpenseOpen(true)}
                className="flex items-center gap-2 bg-[#00d09c] text-black font-semibold py-2 px-4 rounded-xl hover:bg-[#00b386] transition-colors shadow-lg shadow-[#00d09c]/20"
              >
                <Plus className="w-4 h-4" />
                Add Expense
              </button>
            </div>
            
            {expenses.length > 0 ? (
              <div className="space-y-4">
                {expenses.map(expense => (
                  <ExpenseCard key={expense.id} expense={expense} members={members} />
                ))}
              </div>
            ) : (
              <div className="p-12 border border-gray-800 border-dashed rounded-2xl flex flex-col items-center justify-center text-center bg-[#12121a]/50">
                <Receipt className="w-12 h-12 text-gray-600 mb-4" />
                <h4 className="text-lg font-medium text-gray-300 mb-2">No expenses yet</h4>
                <p className="text-gray-500 max-w-sm">Add your first expense to start splitting with the group.</p>
              </div>
            )}
          </div>
        )}

        {/* Activity Tab */}
        {activeTab === 'activity' && (
          <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-300">
            <h3 className="text-xl font-semibold mb-6">Recent Activity</h3>
            {activities.length > 0 ? (
              activities.map(activity => (
                <ActivityItem key={activity.id} activity={activity} />
              ))
            ) : (
              <p className="text-gray-500 text-center py-8">No activity recorded yet.</p>
            )}
          </div>
        )}
      </main>

      <ExpenseForm
        isOpen={isAddExpenseOpen}
        onClose={() => setIsAddExpenseOpen(false)}
        groupId={id!}
        members={members.map(m => ({ id: m.id, name: m.name }))}
        onSuccess={() => {}}
      />

      {/* Settle Up Confirmation Dialog */}
      {settlementTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => !isSettleLoading && setSettlementTarget(null)}></div>
          
          <div className="bg-[#12121a] border border-gray-800 rounded-3xl w-full max-w-sm p-6 relative z-10 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <div className="w-12 h-12 bg-[#00d09c]/10 rounded-full flex items-center justify-center mb-4">
              <Plus className="w-6 h-6 text-[#00d09c]" />
            </div>
            
            <h3 className="text-xl font-bold text-white mb-2">Record Settlement</h3>
            <p className="text-gray-400 mb-6">
              {settlementTarget.balance > 0 
                ? `Confirm that ${settlementTarget.name} paid you ₹${Math.abs(settlementTarget.balance).toLocaleString('en-IN')}?`
                : `Confirm that you paid ${settlementTarget.name} ₹${Math.abs(settlementTarget.balance).toLocaleString('en-IN')}?`
              }
            </p>
            
            <div className="flex gap-3">
              <button
                onClick={() => setSettlementTarget(null)}
                disabled={isSettleLoading}
                className="flex-1 py-2.5 rounded-xl font-medium text-gray-300 bg-gray-800 hover:bg-gray-700 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmSettlement}
                disabled={isSettleLoading}
                className="flex-1 flex justify-center items-center gap-2 py-2.5 rounded-xl font-semibold text-black bg-[#00d09c] hover:bg-[#00b386] transition-colors disabled:opacity-50 shadow-lg shadow-[#00d09c]/20"
              >
                {isSettleLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GroupPage;

