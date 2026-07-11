import React, { useState, useEffect } from 'react';
import { X, Loader2, Upload } from 'lucide-react';
import { useExpenseStore } from '../stores/expenseStore';
import { expenseFormSchema } from '../lib/schemas';
import type { ExpenseInitialData, ExpenseSplit } from '../lib/types';

interface ExpenseFormProps {
  groupId: string;
  expenseId?: string; // If provided, it's an edit
  isOpen: boolean;
  onClose: () => void;
  members: { id: string; name: string }[];
  onSuccess: () => void;
  initialData?: ExpenseInitialData;
}

export const ExpenseForm = ({ groupId, expenseId, isOpen, onClose, members, onSuccess, initialData }: ExpenseFormProps) => {
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [notes, setNotes] = useState('');
  const [receipt, setReceipt] = useState<File | null>(null);
  
  const [splitMethod, setSplitMethod] = useState<'equal' | 'custom'>('equal');
  const [selectedMembers, setSelectedMembers] = useState<Set<string>>(new Set());
  const [customSplits, setCustomSplits] = useState<Record<string, string>>({});
  const [error, setError] = useState('');
  
  const { createExpense, updateExpense, isSubmitting } = useExpenseStore(state => ({
    createExpense: state.createExpense,
    updateExpense: state.updateExpense,
    isSubmitting: state.isLoading
  }));

  // Reset state when opened
  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        setTitle(initialData.title);
        setAmount(initialData.amount.toString());
        setNotes(initialData.notes || '');
        setSplitMethod(initialData.splitMethod);
        
        const memberIds = new Set<string>(initialData.splits.map((s: ExpenseSplit) => s.userId));
        setSelectedMembers(memberIds);
        
        if (initialData.splitMethod === 'custom') {
          const splits: Record<string, string> = {};
          initialData.splits.forEach((s: ExpenseSplit) => {
            splits[s.userId] = s.amount.toString();
          });
          setCustomSplits(splits);
        }
      } else {
        setTitle('');
        setAmount('');
        setNotes('');
        setSplitMethod('equal');
        setSelectedMembers(new Set(members.map(m => m.id)));
        setCustomSplits({});
      }
      setReceipt(null);
      setError('');
    }
  }, [isOpen, members, initialData]);

  if (!isOpen) return null;

  const toggleMember = (id: string) => {
    const next = new Set(selectedMembers);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedMembers(next);
  };

  const handleCustomSplitChange = (id: string, val: string) => {
    setCustomSplits(prev => ({ ...prev, [id]: val }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Prepare custom splits object as numeric values for validation
    const customSplitsNums: Record<string, number> = {};
    Object.keys(customSplits).forEach(k => {
      customSplitsNums[k] = parseFloat(customSplits[k]) || 0;
    });

    const validationResult = expenseFormSchema.safeParse({
      title,
      amount,
      notes: notes || undefined,
      splitMethod,
      selectedMembers: Array.from(selectedMembers),
      customSplits: customSplitsNums
    });

    if (!validationResult.success) {
      // Get the first error message
      const firstError = validationResult.error.errors[0]?.message || 'Validation error';
      setError(firstError);
      return;
    }

    const valid = validationResult.data;

    let splitsToSave = [];
    if (valid.splitMethod === 'equal') {
      const perPerson = Number((valid.amount / valid.selectedMembers.length).toFixed(2));
      splitsToSave = valid.selectedMembers.map(id => ({ userId: id, amount: perPerson }));
    } else {
      splitsToSave = valid.selectedMembers.map(id => ({
        userId: id,
        amount: valid.customSplits?.[id] || 0
      }));
    }

    const formData = new FormData();
    formData.append('title', valid.title);
    formData.append('amount', valid.amount.toString());
    if (valid.notes) formData.append('notes', valid.notes);
    formData.append('splitMethod', valid.splitMethod);
    formData.append('splits', JSON.stringify(splitsToSave));
    if (receipt) formData.append('receipt', receipt);

    let success = false;
    if (expenseId) {
      success = await updateExpense(expenseId, formData);
    } else {
      success = await createExpense(groupId, formData);
    }

    if (success) {
      onSuccess();
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose}></div>
      
      <div className="bg-[#12121a] border border-gray-800 rounded-2xl w-full max-w-lg p-6 relative z-10 shadow-2xl overflow-y-auto max-h-[90vh] custom-scrollbar">
        <div className="flex justify-between items-center mb-6 sticky top-0 bg-[#12121a] z-20 pb-2 border-b border-gray-800">
          <h2 className="text-2xl font-bold text-white">{expenseId ? 'Edit Expense' : 'Add Expense'}</h2>
          <button type="button" onClick={onClose} className="text-gray-400 hover:text-white p-2">
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && <div className="mb-6 p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-500 text-sm">{error}</div>}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-400 mb-1">Title</label>
              <input
                type="text"
                required
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder="Dinner, Taxi, etc."
                className="w-full bg-[#0a0a0f] border border-gray-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#00d09c]"
              />
            </div>
            
            <div className="col-span-2 sm:col-span-1">
              <label className="block text-sm font-medium text-gray-400 mb-1">Amount (₹)</label>
              <input
                type="number"
                required
                step="0.01"
                min="0.01"
                value={amount}
                onChange={e => setAmount(e.target.value)}
                placeholder="0.00"
                className="w-full bg-[#0a0a0f] border border-gray-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#00d09c]"
              />
            </div>

            <div className="col-span-2 sm:col-span-1">
              <label className="block text-sm font-medium text-gray-400 mb-1">Receipt Image</label>
              <label className="w-full h-[50px] flex items-center justify-center gap-2 bg-[#0a0a0f] border border-gray-700 border-dashed rounded-xl cursor-pointer hover:border-gray-500 transition-colors">
                <Upload className="w-4 h-4 text-gray-400" />
                <span className="text-sm text-gray-400 truncate px-2">{receipt ? receipt.name : 'Upload file'}</span>
                <input type="file" accept="image/*" className="hidden" onChange={e => setReceipt(e.target.files?.[0] || null)} />
              </label>
            </div>
            
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-400 mb-1">Notes (Optional)</label>
              <input
                type="text"
                value={notes}
                onChange={e => setNotes(e.target.value)}
                placeholder="Any additional details..."
                className="w-full bg-[#0a0a0f] border border-gray-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#00d09c]"
              />
            </div>
          </div>

          <div className="border-t border-gray-800 pt-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-semibold text-white">Split with</h3>
              <div className="flex bg-[#0a0a0f] rounded-lg p-1 border border-gray-800">
                <button
                  type="button"
                  onClick={() => setSplitMethod('equal')}
                  className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${splitMethod === 'equal' ? 'bg-gray-800 text-white' : 'text-gray-500 hover:text-gray-300'}`}
                >
                  Equal
                </button>
                <button
                  type="button"
                  onClick={() => setSplitMethod('custom')}
                  className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${splitMethod === 'custom' ? 'bg-gray-800 text-white' : 'text-gray-500 hover:text-gray-300'}`}
                >
                  Custom
                </button>
              </div>
            </div>

            <div className="space-y-2">
              {members.map(member => (
                <div key={member.id} className="flex items-center justify-between p-3 bg-[#0a0a0f] border border-gray-800 rounded-xl">
                  <label className="flex items-center gap-3 cursor-pointer select-none flex-1">
                    <input
                      type="checkbox"
                      checked={selectedMembers.has(member.id)}
                      onChange={() => toggleMember(member.id)}
                      className="w-5 h-5 rounded border-gray-700 text-[#00d09c] focus:ring-[#00d09c] bg-[#12121a] accent-[#00d09c]"
                    />
                    <span className="text-gray-200">{member.name}</span>
                  </label>
                  
                  {splitMethod === 'custom' && selectedMembers.has(member.id) && (
                    <div className="flex items-center gap-1 w-24">
                      <span className="text-gray-500 text-sm">₹</span>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={customSplits[member.id] || ''}
                        onChange={e => handleCustomSplitChange(member.id, e.target.value)}
                        placeholder="0.00"
                        className="w-full bg-transparent border-b border-gray-700 text-right focus:outline-none focus:border-[#00d09c] text-white px-1"
                      />
                    </div>
                  )}
                  {splitMethod === 'equal' && selectedMembers.has(member.id) && (
                    <span className="text-sm text-gray-500">
                      ₹{amount ? (parseFloat(amount) / selectedMembers.size).toFixed(2) : '0.00'}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-gray-800">
            <button type="button" onClick={onClose} className="px-5 py-2.5 rounded-xl font-medium text-gray-400 hover:text-white hover:bg-gray-800 transition-colors">
              Cancel
            </button>
            <button type="submit" disabled={isSubmitting} className="flex items-center gap-2 bg-[#00d09c] text-black font-semibold px-6 py-2.5 rounded-xl hover:bg-[#00b386] transition-colors disabled:opacity-50">
              {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
              Save Expense
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
