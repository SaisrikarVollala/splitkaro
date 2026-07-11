import { Receipt, Calendar } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Expense } from '../stores/expenseStore';

interface ExpenseCardProps {
  expense: Expense;
  members: { id: string; name: string }[];
}

export const ExpenseCard = ({ expense, members }: ExpenseCardProps) => {
  const payerName = members.find(m => m.id === expense.creatorId)?.name || 'Unknown';
  
  const date = new Date(expense.createdAt);
  const formattedDate = date.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'long'
  });

  return (
    <Link 
      to={`/groups/${expense.groupId}/expenses/${expense.id}`}
      className="flex items-center gap-4 p-4 bg-[#12121a] border border-gray-800 rounded-2xl hover:border-[#00d09c]/50 hover:bg-[#1a1a24] transition-all group cursor-pointer"
    >
      <div className="w-12 h-12 rounded-xl bg-gray-800 flex items-center justify-center border border-gray-700 group-hover:bg-[#00d09c]/10 group-hover:border-[#00d09c]/30 transition-colors">
        <Receipt className="w-6 h-6 text-gray-400 group-hover:text-[#00d09c] transition-colors" />
      </div>
      
      <div className="flex-1">
        <h3 className="text-lg font-semibold text-white group-hover:text-[#00d09c] transition-colors">{expense.title}</h3>
        <p className="text-sm text-gray-400">Paid by {payerName}</p>
      </div>

      <div className="text-right">
        <div className="text-lg font-bold text-white">₹{expense.amount.toLocaleString('en-IN')}</div>
        <div className="flex items-center justify-end gap-1 text-xs text-gray-500 mt-1">
          <Calendar className="w-3 h-3" />
          <span>{formattedDate}</span>
        </div>
      </div>
    </Link>
  );
};
