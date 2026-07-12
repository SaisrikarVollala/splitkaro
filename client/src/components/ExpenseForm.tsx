import React, { useState, useEffect } from 'react';
import { X, Loader2, Upload, FileText, Sparkles, MapPin, ArrowRight } from 'lucide-react';
import { useExpenseStore } from '../stores/expenseStore';
import { expenseFormSchema } from '../lib/schemas';
import { CATEGORY_MAP } from './WalletExpenseCard';
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
  
  const [category, setCategory] = useState('OTHER');
  const [receiptUrl, setReceiptUrl] = useState<string | null>(null);
  const [lineItems, setLineItems] = useState<any[] | null>(null);
  const [travelInfo, setTravelInfo] = useState<any | null>(null);
  const [smartNotes, setSmartNotes] = useState<string | null>(null);

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
        
        setCategory(initialData.category || 'OTHER');
        setReceiptUrl(initialData.receiptUrl || null);
        setLineItems(initialData.lineItems || null);
        setTravelInfo(initialData.travelInfo || null);
        setSmartNotes(initialData.smartNotes || null);

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
        setCategory('OTHER');
        setReceiptUrl(null);
        setLineItems(null);
        setTravelInfo(null);
        setSmartNotes(null);
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

    // Scanner metadata
    formData.append('category', category);
    if (receiptUrl) formData.append('receiptUrl', receiptUrl);
    if (lineItems) formData.append('lineItems', JSON.stringify(lineItems));
    if (travelInfo) formData.append('travelInfo', JSON.stringify(travelInfo));
    if (smartNotes) formData.append('smartNotes', smartNotes || '');

    let success = false;
    if (expenseId) {
      success = await updateExpense(expenseId, formData);
    } else {
      success = await createExpense(groupId, formData, initialData?.tempId);
    }

    if (success) {
      onSuccess();
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose}></div>
      
      <div className="bg-card border border-border rounded-card w-full max-w-lg p-6 relative z-10 shadow-2xl overflow-y-auto max-h-[90vh] custom-scrollbar text-foreground transition-all duration-200">
        <div className="flex justify-between items-center mb-6 sticky top-0 bg-card z-20 pb-2 border-b border-border">
          <h2 className="text-xl font-bold text-foreground">
            {expenseId ? 'Edit Expense' : (receiptUrl ? 'Review Scanned Expense' : 'Add Expense')}
          </h2>
          <button type="button" onClick={onClose} className="text-muted-foreground hover:text-foreground p-1 rounded-full hover:bg-muted transition-colors cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && <div className="mb-6 p-3 bg-destructive/10 border border-destructive/20 rounded-xl text-destructive text-xs font-semibold">{error}</div>}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2 sm:col-span-1">
              <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1">Title / Merchant</label>
              <input
                type="text"
                required
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder="Dinner, Taxi, etc."
                className="w-full bg-muted/20 border border-border rounded-xl px-4 py-2.5 text-foreground focus:outline-none focus:border-primary text-sm font-semibold"
              />
            </div>

            <div className="col-span-2 sm:col-span-1">
              <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1">Category</label>
              <select
                value={category}
                onChange={e => setCategory(e.target.value)}
                className="w-full bg-card border border-border rounded-xl px-3 py-2.5 text-foreground focus:outline-none focus:border-primary text-sm font-semibold h-[42px]"
              >
                {Object.entries(CATEGORY_MAP).map(([key, value]) => (
                  <option key={key} value={key}>
                    {value.label}
                  </option>
                ))}
              </select>
            </div>
            
            <div className="col-span-2 sm:col-span-1">
              <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1">Amount (₹)</label>
              <input
                type="number"
                required
                step="0.01"
                min="0.01"
                value={amount}
                onChange={e => setAmount(e.target.value)}
                placeholder="0.00"
                className="w-full bg-muted/20 border border-border rounded-xl px-4 py-2.5 text-foreground focus:outline-none focus:border-primary text-sm font-extrabold"
              />
            </div>

            <div className="col-span-2 sm:col-span-1">
              <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1">Receipt File</label>
              {receiptUrl ? (
                <div className="h-[42px] flex items-center justify-between bg-primary/5 border border-primary/20 rounded-xl px-3.5 text-xs text-primary font-bold">
                  <span className="flex items-center gap-1.5 truncate">
                    <FileText className="w-4 h-4 shrink-0" />
                    <span>Scanned Receipt</span>
                  </span>
                  <a href={receiptUrl.startsWith('/') ? `${import.meta.env.VITE_API_URL || 'http://localhost:3001'}${receiptUrl}` : receiptUrl} target="_blank" rel="noreferrer" className="underline hover:text-primary/80 shrink-0 ml-2">View</a>
                </div>
              ) : (
                <label className="w-full h-[42px] flex items-center justify-center gap-2 bg-muted/20 border border-border border-dashed rounded-xl cursor-pointer hover:border-muted-foreground/50 transition-colors">
                  <Upload className="w-4 h-4 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground truncate px-2">{receipt ? receipt.name : 'Upload receipt'}</span>
                  <input type="file" accept="image/*" className="hidden" onChange={e => setReceipt(e.target.files?.[0] || null)} />
                </label>
              )}
            </div>
            
            <div className="col-span-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1">Notes (Optional)</label>
              <input
                type="text"
                value={notes}
                onChange={e => setNotes(e.target.value)}
                placeholder="Any additional details..."
                className="w-full bg-muted/20 border border-border rounded-xl px-4 py-2.5 text-foreground focus:outline-none focus:border-primary text-sm font-medium"
              />
            </div>
          </div>

          {/* AI Scanned Line Items Widget */}
          {lineItems && lineItems.length > 0 && (
            <div className="bg-muted/10 border border-border rounded-2xl p-4 space-y-3">
              <div className="flex items-center gap-1.5 text-primary text-xs font-bold uppercase tracking-wider">
                <Sparkles className="w-4 h-4" />
                <span>Parsed Line Items</span>
              </div>
              <div className="border border-border rounded-xl overflow-hidden text-xs">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-muted/50 border-b border-border text-muted-foreground font-semibold">
                      <th className="p-2">Item</th>
                      <th className="p-2 text-center w-12">Qty</th>
                      <th className="p-2 text-right w-20">Price</th>
                    </tr>
                  </thead>
                  <tbody>
                    {lineItems.map((item: any, idx: number) => (
                      <tr key={idx} className="border-b border-border/40 text-foreground last:border-0 hover:bg-muted/20">
                        <td className="p-2 font-medium">{item.name}</td>
                        <td className="p-2 text-center text-muted-foreground">{item.quantity}</td>
                        <td className="p-2 text-right font-bold">₹{item.price.toLocaleString('en-IN')}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* AI Scanned Travel Itinerary Widget */}
          {travelInfo && (
            <div className="bg-muted/10 border border-border rounded-2xl p-4 space-y-3">
              <div className="flex items-center gap-1.5 text-primary text-xs font-bold uppercase tracking-wider">
                <Sparkles className="w-4 h-4" />
                <span>Parsed Travel Route</span>
              </div>
              <div className="bg-muted/40 border border-border rounded-xl p-3 text-xs space-y-3">
                <div className="flex items-center gap-3 text-foreground font-bold">
                  <div className="flex items-center gap-1 bg-card px-2 py-0.5 rounded border border-border">
                    <MapPin className="w-3.5 h-3.5 text-rose-500" />
                    <span>{travelInfo.origin}</span>
                  </div>
                  <ArrowRight className="w-4 h-4 text-muted-foreground" />
                  <div className="flex items-center gap-1 bg-card px-2 py-0.5 rounded border border-border">
                    <MapPin className="w-3.5 h-3.5 text-emerald-500" />
                    <span>{travelInfo.destination}</span>
                  </div>
                </div>
                <div className="flex gap-4 text-muted-foreground pt-2 border-t border-border/30">
                  <div>
                    <span className="block text-[10px] uppercase font-bold">Distance</span>
                    <span className="text-foreground font-extrabold">{travelInfo.distanceKm} km</span>
                  </div>
                  <div>
                    <span className="block text-[10px] uppercase font-bold">Vehicle</span>
                    <span className="text-foreground font-extrabold capitalize">{travelInfo.vehicleType}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Split Settings */}
          <div className="border-t border-border pt-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Split settings</h3>
              <div className="flex bg-muted rounded-lg p-0.5 border border-border">
                <button
                  type="button"
                  onClick={() => setSplitMethod('equal')}
                  className={`px-3 py-1.5 text-xs font-bold rounded-md transition-colors cursor-pointer ${splitMethod === 'equal' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
                >
                  Equal
                </button>
                <button
                  type="button"
                  onClick={() => setSplitMethod('custom')}
                  className={`px-3 py-1.5 text-xs font-bold rounded-md transition-colors cursor-pointer ${splitMethod === 'custom' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
                >
                  Custom
                </button>
              </div>
            </div>

            <div className="space-y-2.5">
              {members.map(member => (
                <div key={member.id} className="flex items-center justify-between p-3.5 bg-muted/20 border border-border rounded-xl hover:border-primary/20 transition-all duration-200">
                  <label className="flex items-center gap-3 cursor-pointer select-none flex-1">
                    <input
                      type="checkbox"
                      checked={selectedMembers.has(member.id)}
                      onChange={() => toggleMember(member.id)}
                      className="w-4.5 h-4.5 rounded border-border text-primary focus:ring-primary bg-card accent-primary"
                    />
                    <span className="text-sm font-bold text-foreground">{member.name}</span>
                  </label>
                  
                  {splitMethod === 'custom' && selectedMembers.has(member.id) && (
                    <div className="flex items-center gap-1 w-24">
                      <span className="text-muted-foreground text-xs font-bold">₹</span>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={customSplits[member.id] || ''}
                        onChange={e => handleCustomSplitChange(member.id, e.target.value)}
                        placeholder="0.00"
                        className="w-full bg-transparent border-b border-border text-right focus:outline-none focus:border-primary text-foreground text-sm font-extrabold px-1"
                      />
                    </div>
                  )}
                  {splitMethod === 'equal' && selectedMembers.has(member.id) && (
                    <span className="text-xs font-bold text-muted-foreground">
                      ₹{amount ? (parseFloat(amount) / selectedMembers.size).toFixed(2) : '0.00'}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-border">
            <button type="button" onClick={onClose} className="px-5 py-2.5 rounded-btn font-bold text-xs text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer">
              Cancel
            </button>
            <button type="submit" disabled={isSubmitting} className="flex items-center gap-2 bg-primary text-primary-foreground font-bold text-xs px-6 py-2.5 rounded-btn hover:opacity-90 transition-all shadow-sm cursor-pointer active:scale-[0.98]">
              {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
              Save Expense
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
