import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Navbar } from '../components/Navbar';
import { useAuthStore } from '../stores/authStore';
import { useExpenseStore, Expense } from '../stores/expenseStore';
import { useActiveGroupStore } from '../stores/activeGroupStore';
import { ArrowLeft, Edit2, Trash2, Calendar, Receipt as ReceiptIcon, FileText, Loader2, Image } from 'lucide-react';
import { ExpenseForm } from '../components/ExpenseForm';
import { ConfirmDialog } from '../components/ConfirmDialog';

const ExpenseDetailsPage = () => {
  const { groupId, expenseId } = useParams<{ groupId: string; expenseId: string }>();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { fetchExpenseDetail, deleteExpense } = useExpenseStore();
  const expense = useExpenseStore(state => state.expenses.find(e => e.id === expenseId)) || null;
  const { members, fetchMembers } = useActiveGroupStore();
  
  const [isLoading, setIsLoading] = useState(true);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);

  const loadExpense = async () => {
    if (!expenseId) return;
    setIsLoading(true);
    await fetchExpenseDetail(expenseId);
    setIsLoading(false);
  };

  useEffect(() => {
    loadExpense();
    if (groupId && members.length === 0) {
      fetchMembers(groupId);
    }
  }, [expenseId, groupId]);

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

  if (!expense) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] text-white flex flex-col">
        <Navbar />
        <div className="max-w-3xl mx-auto w-full p-4 mt-8">
          <h2 className="text-2xl font-bold text-red-500 text-center">Expense not found</h2>
        </div>
      </div>
    );
  }

  const isCreator = expense.creatorId === user?.id;
  const creatorName = members.find(m => m.id === expense.creatorId)?.name || 'Unknown';
  
  const formattedDate = new Date(expense.createdAt).toLocaleDateString('en-IN', {
    day: 'numeric', month: 'long', year: 'numeric'
  }) + ' ' + new Date(expense.createdAt).toLocaleTimeString('en-IN', {
    hour: 'numeric', minute: '2-digit'
  });

  const handleDelete = async () => {
    if (!expenseId) return;
    const success = await deleteExpense(expenseId);
    if (success) {
      navigate(`/groups/${groupId}`);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white pb-20">
      <Navbar />
      
      <main className="max-w-2xl mx-auto px-4 sm:px-6 py-8">
        <Link 
          to={`/groups/${groupId}`}
          className="inline-flex items-center gap-2 text-gray-400 hover:text-white transition-colors mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Group
        </Link>

        <div className="bg-[#12121a] border border-gray-800 rounded-3xl overflow-hidden shadow-2xl">
          {/* Header Card */}
          <div className="p-8 border-b border-gray-800 relative">
            <div className="absolute top-0 right-0 w-48 h-48 bg-[#00d09c]/5 rounded-bl-full pointer-events-none blur-xl"></div>
            
            <div className="flex justify-between items-start mb-6">
              <div className="w-16 h-16 bg-[#00d09c]/10 rounded-2xl flex items-center justify-center border border-[#00d09c]/20 shadow-lg shadow-[#00d09c]/10">
                <ReceiptIcon className="w-8 h-8 text-[#00d09c]" />
              </div>

              {isCreator && (
                <div className="flex items-center gap-2 relative z-10">
                  <button 
                    onClick={() => setIsEditOpen(true)}
                    className="p-2 rounded-xl text-gray-400 hover:text-white hover:bg-gray-800 transition-colors border border-transparent hover:border-gray-700"
                  >
                    <Edit2 className="w-5 h-5" />
                  </button>
                  <button 
                    onClick={() => setIsDeleteOpen(true)}
                    className="p-2 rounded-xl text-gray-400 hover:text-[#ff4757] hover:bg-red-500/10 transition-colors border border-transparent hover:border-red-500/20"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              )}
            </div>

            <h1 className="text-3xl font-bold text-white mb-2">{expense.title}</h1>
            <div className="text-4xl font-bold text-[#00d09c] mb-6">
              ₹{expense.amount.toLocaleString('en-IN')}
            </div>

            <div className="flex flex-wrap gap-4 text-sm text-gray-400">
              <div className="flex items-center gap-2 bg-gray-800/50 px-3 py-1.5 rounded-lg border border-gray-700/50">
                <span className="font-medium">Paid by</span>
                <span className="text-white">{creatorName}</span>
              </div>
              <div className="flex items-center gap-2 bg-gray-800/50 px-3 py-1.5 rounded-lg border border-gray-700/50">
                <Calendar className="w-4 h-4" />
                <span>{formattedDate}</span>
              </div>
            </div>
          </div>

          <div className="p-8 space-y-8">
            {/* Notes Section */}
            {expense.notes && (
              <div>
                <h3 className="text-lg font-semibold mb-3 flex items-center gap-2 text-gray-300">
                  <FileText className="w-5 h-5 text-gray-500" />
                  Notes
                </h3>
                <p className="text-gray-400 bg-[#0a0a0f] p-4 rounded-xl border border-gray-800/50">
                  {expense.notes}
                </p>
              </div>
            )}

            {/* Receipt Section */}
            {expense.receiptUrl && (
              <div>
                <h3 className="text-lg font-semibold mb-3 flex items-center gap-2 text-gray-300">
                  <Image className="w-5 h-5 text-gray-500" />
                  Receipt
                </h3>
                <div className="rounded-xl overflow-hidden border border-gray-800">
                  <img 
                    src={`${import.meta.env.VITE_API_URL || 'http://localhost:3001'}${expense.receiptUrl}`} 
                    alt="Receipt" 
                    className="w-full max-h-[400px] object-cover hover:opacity-90 transition-opacity cursor-pointer"
                    onClick={() => window.open(`${import.meta.env.VITE_API_URL || 'http://localhost:3001'}${expense.receiptUrl}`, '_blank')}
                  />
                </div>
              </div>
            )}

            {/* Split Breakdown */}
            <div>
              <h3 className="text-lg font-semibold mb-4 text-gray-300 border-b border-gray-800 pb-2">
                Participants Breakdown
              </h3>
              <div className="space-y-3">
                {expense.splits.map(split => {
                  const memberName = members.find(m => m.id === split.userId)?.name || 'Unknown';
                  const isExpenseCreator = split.userId === expense.creatorId;
                  
                  return (
                    <div key={split.userId} className="flex justify-between items-center p-4 bg-[#0a0a0f] rounded-xl border border-gray-800/50 hover:border-gray-700 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-gray-800 flex items-center justify-center font-bold text-gray-400 text-sm">
                          {memberName.charAt(0)}
                        </div>
                        <div>
                          <span className="font-medium text-gray-200">{memberName}</span>
                          <span className="block text-xs mt-0.5">
                            {isExpenseCreator ? (
                              <span className="text-gray-500">Paid</span>
                            ) : (
                              <span className="text-[#ff4757] font-medium">Pay ₹{split.amount.toFixed(2)}</span>
                            )}
                          </span>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="font-bold text-gray-300 block">₹{split.amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                        <span className="text-xs text-gray-500">Split Value</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </main>

      <ExpenseForm
        isOpen={isEditOpen}
        onClose={() => setIsEditOpen(false)}
        groupId={groupId!}
        expenseId={expense.id}
        initialData={expense}
        members={members.map(m => ({ id: m.id, name: m.name }))}
        onSuccess={() => {
          loadExpense();
        }}
      />

      <ConfirmDialog
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        onConfirm={handleDelete}
        title="Delete Expense"
        message={`Are you sure you want to delete "${expense.title}"? This will permanently remove the expense and recalculate group balances. This action cannot be undone.`}
      />
    </div>
  );
};


export default ExpenseDetailsPage;
