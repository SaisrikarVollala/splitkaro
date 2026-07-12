import { useEffect, useState } from 'react';
import { useGroupStore } from '../stores/groupStore';
import { useAuthStore } from '../stores/authStore';
import { GroupCard } from '../components/GroupCard';
import { CreateGroupDialog } from '../components/CreateGroupDialog';
import { Plus, Wallet, TrendingDown, TrendingUp, Users } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { api } from '../lib/api';
import { Button } from '../components/ui/button';
import { Card, CardContent } from '../components/ui/card';
import { Skeleton } from '../components/ui/skeleton';

export const HomePage = () => {
  const { groups, isLoading, fetchGroups } = useGroupStore();
  const { user } = useAuthStore();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [balancesLoading, setBalancesLoading] = useState(false);
  const [groupBalances, setGroupBalances] = useState<Record<string, { owe: number; owed: number; members: any[] }>>({});
  const navigate = useNavigate();

  useEffect(() => {
    fetchGroups();
  }, [fetchGroups]);

  useEffect(() => {
    const loadBalances = async () => {
      setBalancesLoading(true);
      const balances: Record<string, { owe: number; owed: number; members: any[] }> = {};
      try {
        await Promise.all(groups.map(async (group) => {
          try {
            const res = await api.get(`/api/groups/${group.id}/members`);
            const membersList = res.data;
            let groupOwe = 0;
            let groupOwed = 0;
            membersList.forEach((m: any) => {
              if (!m.isMe) {
                if (m.balance < 0) {
                  groupOwe += Math.abs(m.balance);
                } else if (m.balance > 0) {
                  groupOwed += m.balance;
                }
              }
            });
            balances[group.id] = { owe: groupOwe, owed: groupOwed, members: membersList };
          } catch (err) {
            console.error(err);
          }
        }));
        setGroupBalances(balances);
      } finally {
        setBalancesLoading(false);
      }
    };

    if (groups.length > 0) {
      loadBalances();
    }
  }, [groups]);

  // Fetch all expenses to compute visual category breakdown
  const [expenses, setExpenses] = useState<any[]>([]);
  const [insightsLoading, setInsightsLoading] = useState(false);

  useEffect(() => {
    const loadAllExpenses = async () => {
      if (groups.length === 0) return;
      setInsightsLoading(true);
      try {
        const allExpenses: any[] = [];
        await Promise.all(groups.map(async (group) => {
          try {
            const res = await api.get(`/api/groups/${group.id}/expenses`);
            allExpenses.push(...res.data);
          } catch (err) {
            console.error(err);
          }
        }));
        setExpenses(allExpenses);
      } finally {
        setInsightsLoading(false);
      }
    };
    loadAllExpenses();
  }, [groups]);

  // Calculate totals
  let totalOwe = 0;
  let totalOwed = 0;
  Object.values(groupBalances).forEach((bal) => {
    totalOwe += bal.owe;
    totalOwed += bal.owed;
  });

  // Calculate category totals
  const categoryTotals = expenses.reduce((acc: Record<string, number>, exp) => {
    if (exp.status === 'ready' || exp.status === 'review') {
      const cat = exp.category || 'OTHER';
      acc[cat] = (acc[cat] || 0) + exp.amount;
    }
    return acc;
  }, {});

  const totalSpent = Object.values(categoryTotals).reduce((a, b) => a + b, 0);

  const CATEGORIES = {
    FOOD_DINING: { label: 'Food & Dining', color: 'var(--cat-food-dining-color)' },
    SHOPPING: { label: 'Shopping', color: 'var(--cat-shopping-color)' },
    ENTERTAINMENT: { label: 'Entertainment', color: 'var(--cat-entertainment-color)' },
    BILLS_UTILITIES: { label: 'Bills & Utilities', color: 'var(--cat-bills-utilities-color)' },
    TRANSPORTATION: { label: 'Transportation', color: 'var(--cat-transportation-color)' },
    TRAVEL_LODGING: { label: 'Travel & Lodging', color: 'var(--cat-travel-lodging-color)' },
    GROCERIES: { label: 'Groceries', color: 'var(--cat-groceries-color)' },
    HEALTH_MEDICAL: { label: 'Health & Medical', color: 'var(--cat-health-medical-color)' },
    GIFTS_DONATIONS: { label: 'Gifts & Donations', color: 'var(--cat-gifts-donations-color)' },
    OTHER: { label: 'Other', color: 'var(--cat-other-color)' }
  };

  const firstName = user?.name ? user.name.split(' ')[0] : 'Srikar';

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-fade-in pb-16">
      {/* Welcome Hero */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">Hi {firstName}</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {groups.length} {groups.length === 1 ? 'Active Group' : 'Active Groups'}
          </p>
        </div>
        <Button 
          onClick={() => setIsCreateOpen(true)}
          className="font-bold cursor-pointer"
        >
          <Plus className="w-4 h-4 mr-1" />
          Create Group
        </Button>
      </div>

      {/* Global Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* You Owe Card */}
        <Card className="rounded-card border border-border bg-card shadow-sm">
          <CardContent className="p-6 flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">You Owe</span>
              <div className="text-3xl font-bold text-destructive">
                {balancesLoading ? (
                  <Skeleton className="h-9 w-24 rounded" />
                ) : (
                  `₹${totalOwe.toLocaleString('en-IN')}`
                )}
              </div>
            </div>
            <div className="w-12 h-12 bg-destructive/10 rounded-2xl flex items-center justify-center">
              <TrendingDown className="w-6 h-6 text-destructive" />
            </div>
          </CardContent>
        </Card>

        {/* You Are Owed Card */}
        <Card className="rounded-card border border-border bg-card shadow-sm">
          <CardContent className="p-6 flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">You Are Owed</span>
              <div className="text-3xl font-bold text-success">
                {balancesLoading ? (
                  <Skeleton className="h-9 w-24 rounded" />
                ) : (
                  `₹${totalOwed.toLocaleString('en-IN')}`
                )}
              </div>
            </div>
            <div className="w-12 h-12 bg-success/10 rounded-2xl flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-success" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Insights Card */}
      {expenses.length > 0 && (
        <Card className="p-6 border border-border bg-card shadow-sm">
          <h2 className="text-base font-bold text-foreground mb-1">Expense Breakdown</h2>
          <p className="text-xs text-muted-foreground mb-6">Visual distribution of expenses across all groups</p>
          
          {/* Stacked indicator bar */}
          <div className="w-full h-4.5 rounded-full overflow-hidden bg-muted flex">
            {Object.entries(categoryTotals).map(([cat, amount]) => {
              const percent = ((amount / totalSpent) * 100).toFixed(1);
              const config = CATEGORIES[cat as keyof typeof CATEGORIES] || CATEGORIES.OTHER;
              return (
                <div 
                  key={cat}
                  style={{ width: `${percent}%`, backgroundColor: config.color }}
                  className="h-full hover:opacity-90 transition-all cursor-pointer"
                  title={`${config.label}: ₹${amount.toLocaleString('en-IN')} (${percent}%)`}
                />
              );
            })}
          </div>

          {/* Grid display */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 mt-6">
            {Object.entries(categoryTotals).map(([cat, amount]) => {
              const percent = ((amount / totalSpent) * 100).toFixed(0);
              const config = CATEGORIES[cat as keyof typeof CATEGORIES] || CATEGORIES.OTHER;
              return (
                <div key={cat} className="flex flex-col p-3.5 rounded-xl border border-border/40 bg-muted/10">
                  <div className="flex items-center gap-1.5 mb-1.5">
                    <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: config.color }} />
                    <span className="text-[10px] uppercase font-bold text-muted-foreground truncate">{config.label}</span>
                  </div>
                  <span className="text-base font-bold text-foreground">₹{amount.toLocaleString('en-IN')}</span>
                  <span className="text-[10px] text-muted-foreground mt-0.5">{percent}% of total</span>
                </div>
              );
            })}
          </div>
        </Card>
      )}

      {/* Groups Section */}
      <div>
        <h2 className="text-xl font-bold mb-4">Groups</h2>
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((n) => (
              <Card key={n} className="p-6 space-y-4 border border-border">
                <div className="flex items-center gap-3">
                  <Skeleton className="w-10 h-10 rounded-2xl shrink-0 animate-pulse" />
                  <div className="space-y-2 w-full">
                    <Skeleton className="h-4 w-2/3" />
                    <Skeleton className="h-3 w-1/3" />
                  </div>
                </div>
                <Skeleton className="h-3 w-1/2" />
                <Skeleton className="h-2 w-full" />
              </Card>
            ))}
          </div>
        ) : groups.length === 0 ? (
          <div className="p-12 border border-border border-dashed rounded-card flex flex-col items-center justify-center text-center bg-card/40">
            <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
              <Plus className="w-8 h-8 text-muted-foreground" />
            </div>
            <h2 className="text-xl font-bold mb-2">No Groups Yet</h2>
            <p className="text-sm text-muted-foreground mb-6 max-w-sm">Create a group to start splitting expenses with your friends, family, or flatmates.</p>
            <Button 
              onClick={() => setIsCreateOpen(true)}
              className="font-bold cursor-pointer"
            >
              Create Group
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {groups.map((group) => (
              <GroupCard 
                key={group.id} 
                group={group} 
                balanceInfo={groupBalances[group.id]}
              />
            ))}
          </div>
        )}
      </div>

      <CreateGroupDialog 
        isOpen={isCreateOpen} 
        onClose={() => setIsCreateOpen(false)} 
        onSuccess={(id) => navigate(`/groups/${id}`)}
      />
    </div>
  );
};

export default HomePage;
