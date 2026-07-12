import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { useExpenseStore } from '../stores/expenseStore';
import { useActiveGroupStore } from '../stores/activeGroupStore';
import { 
  ArrowLeft, 
  Edit2, 
  Trash2, 
  Calendar, 
  Receipt as ReceiptIcon, 
  FileText, 
  Loader2, 
  Image, 
  Sparkles, 
  CheckCircle2, 
  Clock, 
  ArrowRight,
  TrendingDown,
  Info
} from 'lucide-react';
import { ExpenseForm } from '../components/ExpenseForm';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { Card, CardContent } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';

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
      <div className="flex items-center justify-center min-h-[60vh] w-full text-foreground bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!expense) {
    return (
      <div className="max-w-3xl mx-auto w-full p-4 mt-8 text-foreground bg-background">
        <h2 className="text-2xl font-bold text-destructive text-center">Expense not found</h2>
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

  // Find user's split amount
  const mySplit = expense.splits.find(s => s.userId === user?.id);
  const myShare = mySplit ? mySplit.amount : 0;

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8 pb-20 animate-fade-in">
      <Link 
        to={`/groups/${groupId}`}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors mb-6"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Group</span>
        </Link>

        <div className="space-y-6">
          {/* Main Detail Card */}
          <Card className="rounded-card border border-border bg-card shadow-sm overflow-hidden">
            {/* Header Block */}
            <div className="p-8 border-b border-border/50 relative">
              <div className="absolute top-0 right-0 w-48 h-48 bg-primary/5 rounded-bl-full pointer-events-none blur-xl"></div>
              
              <div className="flex justify-between items-start mb-6">
                <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center border border-primary/20 shadow-inner">
                  <ReceiptIcon className="w-6 h-6 text-primary" />
                </div>

                {isCreator && (
                  <div className="flex items-center gap-2 relative z-10">
                    <Button 
                      onClick={() => setIsEditOpen(true)}
                      variant="ghost"
                      size="icon-sm"
                      className="text-muted-foreground hover:text-foreground"
                    >
                      <Edit2 className="w-4 h-4" />
                    </Button>
                    <Button 
                      onClick={() => setIsDeleteOpen(true)}
                      variant="ghost"
                      size="icon-sm"
                      className="text-destructive hover:text-destructive hover:bg-destructive/10"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                )}
              </div>

              <div className="flex items-center gap-2 mb-2">
                <h1 className="text-2xl font-extrabold tracking-tight text-foreground">{expense.title}</h1>
                {expense.category && (
                  <Badge variant="secondary" className="text-[10px] uppercase font-bold tracking-wider">
                    {expense.category}
                  </Badge>
                )}
              </div>

              <div className="text-4xl font-extrabold text-foreground tracking-tight mb-6">
                ₹{expense.amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </div>

              <div className="flex flex-wrap gap-3 text-xs">
                <div className="bg-muted px-3 py-1.5 rounded-btn border border-border/50 text-muted-foreground">
                  <span className="font-semibold">Paid by</span> <span className="text-foreground font-bold">{creatorName}</span>
                </div>
                <div className="bg-muted px-3 py-1.5 rounded-btn border border-border/50 text-muted-foreground flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-muted-foreground" />
                  <span>{formattedDate}</span>
                </div>
              </div>
            </div>

            {/* Split Breakdown */}
            <div className="p-8 space-y-6">
              <div>
                <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-wider mb-4">
                  Participants Breakdown
                </h3>
                <div className="space-y-3">
                  {expense.splits.map(split => {
                    const memberName = members.find(m => m.id === split.userId)?.name || 'Unknown';
                    const isExpenseCreator = split.userId === expense.creatorId;
                    const isMe = split.userId === user?.id;
                    
                    return (
                      <div key={split.userId} className="flex justify-between items-center p-4 bg-muted/40 rounded-btn border border-border/50 hover:border-border transition-all">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center font-bold text-muted-foreground text-xs">
                            {memberName.charAt(0)}
                          </div>
                          <div>
                            <span className="text-sm font-bold text-foreground">{memberName} {isMe && <span className="text-xs text-muted-foreground font-normal">(You)</span>}</span>
                            <span className="block text-[10px] mt-0.5 font-medium">
                              {isExpenseCreator ? (
                                <span className="text-success bg-success/10 px-1.5 py-0.5 rounded border border-success/20">Paid</span>
                              ) : (
                                <span className="text-destructive bg-destructive/10 px-1.5 py-0.5 rounded border border-destructive/20">Owes ₹{split.amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                              )}
                            </span>
                          </div>
                        </div>
                        <div className="text-right">
                          <span className="font-bold text-foreground block text-sm">₹{split.amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                          <span className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider">Share</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Notes Section */}
              {expense.notes && (
                <div className="pt-4 border-t border-border/50">
                  <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-1.5">
                    <FileText className="w-4 h-4" />
                    Notes
                  </h3>
                  <p className="text-xs text-muted-foreground bg-muted/30 p-4 rounded-btn border border-border/50 leading-relaxed">
                    {expense.notes}
                  </p>
                </div>
              )}

              {/* AI Extraction Details */}
              {expense.category && (
                <div className="pt-4 border-t border-border/50 space-y-3">
                  <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-primary" />
                    AI Ingestion Details
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="bg-primary/5 border border-primary/10 rounded-btn p-3 text-xs">
                      <span className="text-muted-foreground block text-[9px] uppercase font-bold tracking-wider">Merchant Name</span>
                      <span className="font-bold text-foreground mt-0.5 block">{expense.merchantName || "Unknown"}</span>
                    </div>
                    {expense.smartNotes && (
                      <div className="bg-primary/5 border border-primary/10 rounded-btn p-3 text-xs sm:col-span-2">
                        <span className="text-muted-foreground block text-[9px] uppercase font-bold tracking-wider">Smart Context Notes</span>
                        <span className="text-foreground leading-relaxed block mt-1">{expense.smartNotes}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Receipt Image */}
              {expense.receiptUrl && (
                <div className="pt-4 border-t border-border/50">
                  <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-1.5">
                    <Image className="w-4 h-4" />
                    Receipt Attachment
                  </h3>
                  <div className="rounded-card overflow-hidden border border-border bg-muted/20">
                    <img 
                      src={`${import.meta.env.VITE_API_URL || 'http://localhost:3001'}${expense.receiptUrl}`} 
                      alt="Receipt" 
                      className="w-full max-h-[350px] object-cover hover:opacity-90 transition-opacity cursor-pointer rounded-card"
                      onClick={() => window.open(`${import.meta.env.VITE_API_URL || 'http://localhost:3001'}${expense.receiptUrl}`, '_blank')}
                    />
                  </div>
                </div>
              )}
            </div>
          </Card>

          {/* Timeline Card */}
          <Card className="rounded-card border border-border bg-card shadow-sm p-6">
            <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-wider mb-4">Activity Timeline</h3>
            <div className="relative pl-6 border-l border-border/60 ml-2 space-y-6">
              {/* Event 1 */}
              <div className="relative">
                <div className="absolute -left-[31px] top-0.5 bg-background p-0.5 rounded-full">
                  <CheckCircle2 className="w-4.5 h-4.5 text-success bg-background" />
                </div>
                <div>
                  <h4 className="text-xs font-bold">Expense Created</h4>
                  <p className="text-[10px] text-muted-foreground mt-0.5">Recorded in database by {creatorName}</p>
                </div>
              </div>

              {/* Event 2 (If receipt uploaded) */}
              {expense.receiptUrl && (
                <div className="relative">
                  <div className="absolute -left-[31px] top-0.5 bg-background p-0.5 rounded-full">
                    <Sparkles className="w-4.5 h-4.5 text-primary bg-background" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold">Receipt Processed</h4>
                    <p className="text-[10px] text-muted-foreground mt-0.5">Gemini AI completed optical character recognition & split derivation</p>
                  </div>
                </div>
              )}

              {/* Event 3 */}
              <div className="relative">
                <div className="absolute -left-[31px] top-0.5 bg-background p-0.5 rounded-full">
                  <Clock className="w-4.5 h-4.5 text-muted-foreground bg-background" />
                </div>
                <div>
                  <h4 className="text-xs font-bold">Settlement Status</h4>
                  <p className="text-[10px] text-muted-foreground mt-0.5">
                    {myShare === 0 ? 'You are settled up for this expense.' : `Your share: ₹${myShare.toLocaleString('en-IN')}`}
                  </p>
                </div>
              </div>
            </div>
          </Card>
        </div>

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
