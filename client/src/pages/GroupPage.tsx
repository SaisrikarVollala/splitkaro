import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { io } from 'socket.io-client';
import { useActiveGroupStore } from '../stores/activeGroupStore';
import { MemberCard } from '../components/MemberCard';
import { ActivityItem } from '../components/ActivityItem';
import { WalletExpenseCard } from '../components/WalletExpenseCard';
import { ExpenseForm } from '../components/ExpenseForm';
import { useExpenseStore } from '../stores/expenseStore';
import { useAuthStore } from '../stores/authStore';
import { useReceiptUpload } from '../hooks/useReceiptUpload';
import { api } from '../lib/api';
import { Navbar } from '../components/Navbar';
import { 
  Users, 
  Receipt, 
  Activity, 
  Share2, 
  Plus, 
  Loader2, 
  Sparkles, 
  ArrowLeft, 
  Calendar,
  TrendingDown,
  TrendingUp 
} from 'lucide-react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../components/ui/tabs';
import { Card, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import type { ExpenseInitialData } from '../lib/types';

const GroupPage = () => {
  const { id } = useParams<{ id: string }>();
  const [copied, setCopied] = useState(false);
  const [isAddExpenseOpen, setIsAddExpenseOpen] = useState(false);
  const [formInitialData, setFormInitialData] = useState<ExpenseInitialData | undefined>(undefined);
  
  const [settlementTarget, setSettlementTarget] = useState<{ id: string; name: string; balance: number } | null>(null);
  const [isSettleLoading, setIsSettleLoading] = useState(false);

  const { user } = useAuthStore();
  const { 
    currentGroup, members, activities, isLoading, error,
    fetchGroupDetails, fetchMembers, fetchActivities 
  } = useActiveGroupStore();

  const { expenses, fetchExpenses } = useExpenseStore();
  const { handleUpload, isUploading } = useReceiptUpload();

  useEffect(() => {
    if (id) {
      fetchGroupDetails(id);
      fetchMembers(id);
      fetchActivities(id);
      fetchExpenses(id);
    }
  }, [id, fetchGroupDetails, fetchMembers, fetchActivities, fetchExpenses]);

  // Real-time Socket.io sync for receipt ingestion pipeline
  useEffect(() => {
    if (!id) return;

    const socket = io(import.meta.env.VITE_API_URL || 'http://localhost:3001', {
      withCredentials: true,
      transports: ['websocket'],
    });

    socket.on('connect', () => {
      console.log('Socket.io connected, joining group room:', id);
      socket.emit('join-group', id);
    });

    socket.on('EXPENSE_PROCESSED', (data: { tempId: string; expense?: any; parsedData?: any; status: 'ready' | 'parsed' | 'failed'; error?: string }) => {
      console.log('Received EXPENSE_PROCESSED broadcast:', data);
      const { tempId, expense, parsedData, status, error } = data;
      
      if (status === 'failed') {
        useExpenseStore.getState().updateExpenseState(tempId, {
          status: 'failed',
          notes: error || 'Failed to scan receipt.'
        });
      } else if (status === 'parsed' && parsedData) {
        // Update optimistic placeholder state to 'review' with parsed fields
        useExpenseStore.getState().updateExpenseState(tempId, {
          status: 'review',
          title: parsedData.merchantName || 'Parsed Receipt',
          amount: parsedData.totalAmount || 0,
          category: parsedData.category,
          receiptUrl: parsedData.receiptUrl,
          lineItems: parsedData.lineItems,
          travelInfo: parsedData.travelInfo,
          smartNotes: parsedData.smartNotes,
        });

        // Automatically trigger opening the review popup
        const initialData: ExpenseInitialData = {
          tempId,
          title: parsedData.merchantName || 'Parsed Receipt',
          amount: parsedData.totalAmount || 0,
          notes: parsedData.smartNotes || null,
          receiptUrl: parsedData.receiptUrl,
          splitMethod: 'equal',
          splits: members.map(m => ({ userId: m.id, amount: Number((parsedData.totalAmount / members.length).toFixed(2)) })),
          category: parsedData.category,
          merchantName: parsedData.merchantName,
          lineItems: parsedData.lineItems,
          travelInfo: parsedData.travelInfo,
          smartNotes: parsedData.smartNotes
        };
        
        setFormInitialData(initialData);
        setIsAddExpenseOpen(true);
      } else if (expense) {
        useExpenseStore.getState().updateExpenseState(tempId, {
          ...expense,
          status: 'ready'
        });
      }
    });

    return () => {
      socket.emit('leave-group', id);
      socket.disconnect();
    };
  }, [id, members]);

  // Listen to review button clicks from individual cards
  useEffect(() => {
    const handleOpenReview = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (!detail) return;

      const initialData: ExpenseInitialData = {
        tempId: detail.id,
        title: detail.title,
        amount: detail.amount,
        notes: detail.notes,
        receiptUrl: detail.receiptUrl,
        splitMethod: detail.splitMethod || 'equal',
        splits: detail.splits || members.map(m => ({ userId: m.id, amount: Number((detail.amount / members.length).toFixed(2)) })),
        category: detail.category,
        merchantName: detail.merchantName || detail.title,
        lineItems: detail.lineItems,
        travelInfo: detail.travelInfo,
        smartNotes: detail.smartNotes
      };
      
      setFormInitialData(initialData);
      setIsAddExpenseOpen(true);
    };

    window.addEventListener('open-receipt-review', handleOpenReview);
    return () => window.removeEventListener('open-receipt-review', handleOpenReview);
  }, [members]);

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
      <div className="min-h-screen bg-background text-foreground flex flex-col">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  if (error || !currentGroup) {
    return (
      <div className="min-h-screen bg-background text-foreground">
        <Navbar />
        <div className="max-w-5xl mx-auto px-4 py-8 text-center">
          <h2 className="text-2xl font-bold text-destructive mb-2">Error</h2>
          <p className="text-muted-foreground">{error || 'Group not found'}</p>
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

  // Group specific balance calculations
  let groupOwe = 0;
  let groupOwed = 0;
  members.forEach(member => {
    if (!member.isMe) {
      if (member.balance < 0) {
        groupOwe += Math.abs(member.balance);
      } else if (member.balance > 0) {
        groupOwed += member.balance;
      }
    }
  });

  const formattedCreatedDate = new Date(currentGroup.createdAt).toLocaleDateString('en-IN', {
    month: 'long',
    year: 'numeric'
  });

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-fade-in pb-16">
      
      {/* Group Header */}
      <div className="border-b border-border pb-6">
        <div className="w-full">
          <Link 
            to="/"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors mb-6"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Groups</span>
          </Link>

          <div className="flex justify-between items-start mb-6">
            <div>
              <h1 className="text-3xl font-extrabold tracking-tight mb-2">{currentGroup.name}</h1>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Users className="w-3.5 h-3.5" />
                  <span>{members.length} Members</span>
                </span>
                <span className="flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5" />
                  <span>Created {formattedCreatedDate}</span>
                </span>
              </div>
            </div>
            
            <Button
              onClick={handleCopyInvite}
              variant="outline"
              size="sm"
              className="font-semibold cursor-pointer"
            >
              <Share2 className="w-3.5 h-3.5 mr-1" />
              {copied ? 'Copied!' : 'Invite Link'}
            </Button>
          </div>

          {/* Group Specific Balances */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6">
            <Card className="rounded-card border border-border bg-card shadow-sm">
              <CardContent className="p-4 flex items-center justify-between">
                <div className="space-y-0.5">
                  <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">You Owe in Group</span>
                  <div className="text-xl font-bold text-destructive">
                    ₹{groupOwe.toLocaleString('en-IN')}
                  </div>
                </div>
                <div className="w-10 h-10 bg-destructive/10 rounded-xl flex items-center justify-center">
                  <TrendingDown className="w-5 h-5 text-destructive" />
                </div>
              </CardContent>
            </Card>

            <Card className="rounded-card border border-border bg-card shadow-sm">
              <CardContent className="p-4 flex items-center justify-between">
                <div className="space-y-0.5">
                  <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">You Are Owed in Group</span>
                  <div className="text-xl font-bold text-success">
                    ₹{groupOwed.toLocaleString('en-IN')}
                  </div>
                </div>
                <div className="w-10 h-10 bg-success/10 rounded-xl flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 text-success" />
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Tab Contents using shadcn Tabs */}
      <Tabs defaultValue="expenses" className="space-y-6">
          <TabsList variant="line" className="border-b border-border w-full justify-start rounded-none p-0 h-10">
            <TabsTrigger value="expenses" className="pb-3 rounded-none px-4 text-xs font-semibold uppercase tracking-wider">
              <Receipt className="w-3.5 h-3.5 mr-2" />
              Expenses
            </TabsTrigger>
            <TabsTrigger value="members" className="pb-3 rounded-none px-4 text-xs font-semibold uppercase tracking-wider">
              <Users className="w-3.5 h-3.5 mr-2" />
              Members
            </TabsTrigger>
            <TabsTrigger value="activity" className="pb-3 rounded-none px-4 text-xs font-semibold uppercase tracking-wider">
              <Activity className="w-3.5 h-3.5 mr-2" />
              Activity
            </TabsTrigger>
          </TabsList>

          {/* Expenses Tab Content */}
          <TabsContent value="expenses" className="space-y-6 outline-none">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-bold">Expenses</h3>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="font-semibold cursor-pointer"
                  disabled={isUploading}
                  onClick={() => document.getElementById('receipt-scan-input')?.click()}
                >
                  {isUploading ? (
                    <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" />
                  ) : (
                    <Sparkles className="w-3.5 h-3.5 mr-1 text-primary animate-pulse" />
                  )}
                  {isUploading ? 'Uploading...' : 'Scan Receipt'}
                  <input
                    id="receipt-scan-input"
                    type="file"
                    accept="image/*"
                    disabled={isUploading}
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file && id) {
                        handleUpload(id, file);
                      }
                      e.target.value = '';
                    }}
                    className="hidden"
                  />
                </Button>
                <Button 
                  onClick={() => {
                    setFormInitialData(undefined);
                    setIsAddExpenseOpen(true);
                  }}
                  size="sm"
                  className="font-semibold cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5 mr-1" />
                  Add Expense
                </Button>
              </div>
            </div>
            
            {expenses.length > 0 ? (
              <div className="space-y-4">
                {expenses.map(expense => (
                  <WalletExpenseCard key={expense.id} expense={expense} members={members} />
                ))}
              </div>
            ) : (
              <div className="p-12 border border-border border-dashed rounded-card flex flex-col items-center justify-center text-center bg-card/40">
                <Receipt className="w-12 h-12 text-muted-foreground mb-4" />
                <h4 className="text-lg font-bold mb-2">No expenses yet</h4>
                <p className="text-xs text-muted-foreground max-w-sm mb-4">Add your first expense or scan a receipt to start splitting with the group.</p>
              </div>
            )}
          </TabsContent>

          {/* Members Tab Content */}
          <TabsContent value="members" className="space-y-6 outline-none">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-bold">Group Members</h3>
            </div>
            <div className="grid grid-cols-1 gap-4">
              {members.map(member => (
                <MemberCard 
                  key={member.id} 
                  member={member} 
                  onSettleUp={(memberId, name, balance) => setSettlementTarget({ id: memberId, name, balance })}
                />
              ))}
            </div>
          </TabsContent>

          {/* Activity Tab Content */}
          <TabsContent value="activity" className="space-y-6 outline-none">
            <h3 className="text-lg font-bold">Recent Activity</h3>
            {activities.length > 0 ? (
              <div className="space-y-2 bg-card border border-border rounded-card p-4">
                {activities.map(activity => (
                  <ActivityItem key={activity.id} activity={activity} />
                ))}
              </div>
            ) : (
              <div className="p-12 text-center text-muted-foreground text-sm">
                No activity recorded yet.
              </div>
            )}
          </TabsContent>
        </Tabs>

      <ExpenseForm
        isOpen={isAddExpenseOpen}
        onClose={() => {
          setIsAddExpenseOpen(false);
          setFormInitialData(undefined);
        }}
        groupId={id!}
        members={members.map(m => ({ id: m.id, name: m.name }))}
        onSuccess={() => {}}
        initialData={formInitialData}
      />

      {/* Settle Up Confirmation Dialog */}
      {settlementTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-xs" onClick={() => !isSettleLoading && setSettlementTarget(null)}></div>
          
          <div className="bg-card border border-border rounded-card w-full max-w-sm p-6 relative z-10 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center mb-4">
              <Plus className="w-6 h-6 text-primary" />
            </div>
            
            <h3 className="text-lg font-bold text-foreground mb-2">Record Settlement</h3>
            <p className="text-xs text-muted-foreground mb-6 leading-relaxed">
              {settlementTarget.balance > 0 
                ? `Confirm that ${settlementTarget.name} paid you ₹${Math.abs(settlementTarget.balance).toLocaleString('en-IN')}?`
                : `Confirm that you paid ${settlementTarget.name} ₹${Math.abs(settlementTarget.balance).toLocaleString('en-IN')}?`
              }
            </p>
            
            <div className="flex gap-3">
              <Button
                onClick={() => setSettlementTarget(null)}
                disabled={isSettleLoading}
                variant="outline"
                className="flex-1 font-bold cursor-pointer text-xs"
              >
                Cancel
              </Button>
              <Button
                onClick={handleConfirmSettlement}
                disabled={isSettleLoading}
                className="flex-1 font-bold cursor-pointer text-xs"
              >
                {isSettleLoading && <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" />}
                Confirm
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GroupPage;
