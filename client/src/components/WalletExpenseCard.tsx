import { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  Calendar, 
  Sparkles, 
  AlertTriangle, 
  Utensils, 
  Plane, 
  Bus, 
  ShoppingBag, 
  Film, 
  HelpCircle, 
  MapPin, 
  ArrowRight,
  User,
  ChevronDown,
  ChevronUp,
  Home,
  Stethoscope,
  Gift,
  Receipt
} from 'lucide-react';
import { Expense } from '../stores/expenseStore';
import { useAuthStore } from '../stores/authStore';
import { Avatar, AvatarImage, AvatarFallback } from './ui/avatar';
import { Badge } from './ui/badge';
import { Card } from './ui/card';
import { Button, buttonVariants } from './ui/button';

interface WalletExpenseCardProps {
  expense: Expense;
  members: { id: string; name: string; image: string | null }[];
}

export const CATEGORY_MAP: Record<string, { label: string; color: string; bg: string; border: string; icon: any }> = {
  FOOD_DINING: { label: 'Food & Dining', color: 'var(--cat-food-dining)', bg: 'var(--cat-food-dining-bg)', border: 'var(--cat-food-dining-border)', icon: Utensils },
  ACCOMMODATION: { label: 'Accommodation', color: 'var(--cat-accommodation)', bg: 'var(--cat-accommodation-bg)', border: 'var(--cat-accommodation-border)', icon: Home },
  TRAVEL_TRANSPORT: { label: 'Travel & Transport', color: 'var(--cat-travel-transport)', bg: 'var(--cat-travel-transport-bg)', border: 'var(--cat-travel-transport-border)', icon: Bus },
  SHOPPING: { label: 'Shopping', color: 'var(--cat-shopping)', bg: 'var(--cat-shopping-bg)', border: 'var(--cat-shopping-border)', icon: ShoppingBag },
  ENTERTAINMENT: { label: 'Entertainment', color: 'var(--cat-entertainment)', bg: 'var(--cat-entertainment-bg)', border: 'var(--cat-entertainment-border)', icon: Film },
  TRIP_VACATION: { label: 'Trip & Vacation', color: 'var(--cat-trip-vacation)', bg: 'var(--cat-trip-vacation-bg)', border: 'var(--cat-trip-vacation-border)', icon: Plane },
  HOME_UTILITIES: { label: 'Home & Utilities', color: 'var(--cat-home-utilities)', bg: 'var(--cat-home-utilities-bg)', border: 'var(--cat-home-utilities-border)', icon: Home },
  HEALTH_MEDICAL: { label: 'Health & Medical', color: 'var(--cat-health-medical)', bg: 'var(--cat-health-medical-bg)', border: 'var(--cat-health-medical-border)', icon: Stethoscope },
  EVENTS_GIFTS: { label: 'Events & Gifts', color: 'var(--cat-events-gifts)', bg: 'var(--cat-events-gifts-bg)', border: 'var(--cat-events-gifts-border)', icon: Gift },
  OTHER: { label: 'Other', color: 'var(--cat-other)', bg: 'var(--cat-other-bg)', border: 'var(--cat-other-border)', icon: HelpCircle },
};

export const WalletExpenseCard = ({ expense, members }: WalletExpenseCardProps) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const { user } = useAuthStore();
  const payerName = members.find(m => m.id === expense.creatorId)?.name || 'Unknown';
  
  const date = expense.createdAt ? new Date(expense.createdAt) : new Date();
  const formattedDate = date.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  });

  // Normalize category
  const categoryKey = expense.category ? expense.category.toUpperCase() : 'OTHER';
  const categoryConfig = CATEGORY_MAP[categoryKey] || CATEGORY_MAP.OTHER;
  const CategoryIcon = categoryConfig.icon;

  // Calculate my share
  const mySplit = expense.splits?.find(s => s.userId === user?.id);
  const myShare = mySplit ? mySplit.amount : 0;
  const didIPay = expense.creatorId === user?.id;

  // Optimistic UI: Scanning state
  if (expense.status === 'scanning') {
    return (
      <div className="relative overflow-hidden bg-card border border-border rounded-card p-6 shadow-sm animate-pulse">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-muted flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-primary animate-spin" />
            </div>
            <div>
              <h3 className="font-bold text-foreground text-sm">Ingesting Receipt...</h3>
              <p className="text-xs text-muted-foreground">Gemini AI is parsing items</p>
            </div>
          </div>
        </div>

        <div className="space-y-3 my-4">
          <div className="h-4 bg-muted rounded w-1/3"></div>
          <div className="h-8 bg-muted rounded w-2/3"></div>
        </div>

        <div 
          className="h-10 mt-6 rounded-xl opacity-25 bg-muted" 
          style={{
            backgroundImage: 'repeating-linear-gradient(90deg, #71717a 0px, #71717a 2px, transparent 2px, transparent 8px, #71717a 8px, #71717a 14px, transparent 14px, transparent 18px)'
          }}
        ></div>
      </div>
    );
  }

  // Scanning Failed state
  if (expense.status === 'failed') {
    return (
      <div className="relative overflow-hidden bg-card border border-destructive/30 rounded-card p-6 shadow-sm">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-2xl bg-destructive/10 border border-destructive/20 flex items-center justify-center">
            <AlertTriangle className="w-5 h-5 text-destructive" />
          </div>
          <div>
            <h3 className="font-bold text-destructive text-sm">Ingestion Failed</h3>
            <p className="text-xs text-muted-foreground">Failed to analyze image</p>
          </div>
        </div>
        <p className="text-xs text-muted-foreground mb-4">{expense.notes || 'The receipt format was not recognized.'}</p>
        <div 
          className="h-10 mt-6 rounded-xl opacity-15 bg-muted" 
          style={{
            backgroundImage: 'repeating-linear-gradient(90deg, #ef4444 0px, #ef4444 2px, transparent 2px, transparent 8px, #ef4444 8px, #ef4444 14px, transparent 14px, transparent 18px)'
          }}
        ></div>
      </div>
    );
  }

  // Review state
  if (expense.status === 'review') {
    return (
      <div 
        className="relative overflow-hidden bg-card border border-primary/40 rounded-card p-6 shadow-md"
        style={{ borderLeftWidth: '5px', borderLeftColor: categoryConfig.color }}
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div 
              className="w-10 h-10 rounded-2xl flex items-center justify-center border"
              style={{ backgroundColor: categoryConfig.bg, borderColor: categoryConfig.border }}
            >
              <CategoryIcon className="w-5 h-5" style={{ color: categoryConfig.color }} />
            </div>
            <div>
              <span 
                className="text-[9px] uppercase font-bold tracking-widest px-2 py-0.5 rounded-full border"
                style={{ backgroundColor: categoryConfig.bg, borderColor: categoryConfig.border, color: categoryConfig.color }}
              >
                {categoryConfig.label}
              </span>
              <h3 className="font-bold text-foreground text-sm mt-1.5 line-clamp-1">
                {expense.merchantName || expense.title}
              </h3>
            </div>
          </div>
          <span className="text-[10px] bg-primary/10 text-primary border border-primary/20 uppercase font-bold tracking-wider px-2.5 py-1 rounded-full">
            Review Needed
          </span>
        </div>

        <div className="grid grid-cols-2 gap-4 my-4 py-4 border-t border-b border-border/50 text-sm">
          <div>
            <p className="text-[9px] text-muted-foreground uppercase tracking-wider font-bold">Total Amount</p>
            <div className="text-xl font-extrabold text-foreground tracking-tight mt-0.5">
              ₹{expense.amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </div>
          </div>
          <div className="flex items-center justify-end">
            <Button
              onClick={() => {
                const event = new CustomEvent('open-receipt-review', { detail: expense });
                window.dispatchEvent(event);
              }}
              size="sm"
              className="font-bold cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5 mr-1" />
              Review & Save
            </Button>
          </div>
        </div>

        {expense.smartNotes && (
          <p className="text-xs text-muted-foreground leading-relaxed">{expense.smartNotes}</p>
        )}
      </div>
    );
  }

  return (
    <Card 
      className="relative overflow-hidden bg-card border rounded-card shadow-sm hover:shadow-md hover:border-primary/30 transition-all duration-200"
      style={{ borderLeftWidth: '5px', borderLeftColor: categoryConfig.color }}
    >
      <div className="p-6">
        {/* Header Block */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div 
              className="w-10 h-10 rounded-2xl flex items-center justify-center shadow-inner border"
              style={{ backgroundColor: categoryConfig.bg, borderColor: categoryConfig.border }}
            >
              <CategoryIcon className="w-5 h-5" style={{ color: categoryConfig.color }} />
            </div>
            <div>
              <span 
                className="text-[9px] uppercase font-bold tracking-widest px-2 py-0.5 rounded-full border"
                style={{ backgroundColor: categoryConfig.bg, borderColor: categoryConfig.border, color: categoryConfig.color }}
              >
                {categoryConfig.label}
              </span>
              <h3 className="font-bold text-foreground text-sm mt-1.5 line-clamp-1">
                {expense.merchantName || expense.title}
              </h3>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Badge variant={didIPay ? "default" : "secondary"} className="text-[10px] uppercase font-bold tracking-wider">
              {didIPay ? 'Paid' : 'Pending'}
            </Badge>
            <Link
              to={`/groups/${expense.groupId}/expenses/${expense.id}`}
              className={buttonVariants({ variant: "outline", size: "sm", className: "font-semibold text-xs cursor-pointer" })}
            >
              Details
            </Link>
          </div>
        </div>

        {/* Middle Block (Amount and Share Details) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 my-4 py-4 border-t border-b border-border/50">
          <div>
            <p className="text-[9px] text-muted-foreground uppercase tracking-wider font-bold">Total Amount</p>
            <div className="text-xl font-extrabold text-foreground tracking-tight mt-0.5">
              ₹{expense.amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </div>
          </div>
          <div>
            <p className="text-[9px] text-muted-foreground uppercase tracking-wider font-bold">Your Share</p>
            <div className={`text-xl font-extrabold tracking-tight mt-0.5 ${didIPay ? 'text-success' : 'text-destructive'}`}>
              {didIPay ? `Owed ₹${(expense.amount - myShare).toLocaleString('en-IN')}` : `You Owe ₹${myShare.toLocaleString('en-IN')}`}
            </div>
          </div>
          <div className="md:text-right flex flex-col md:justify-center md:items-end">
            <div className="flex items-center gap-1.5 justify-start md:justify-end text-xs text-muted-foreground">
              <Calendar className="w-3.5 h-3.5 text-muted-foreground" />
              <span>{formattedDate}</span>
            </div>
            <div className="flex items-center gap-1 justify-start md:justify-end text-xs text-muted-foreground mt-1">
              <User className="w-3 h-3 text-muted-foreground" />
              <span>Paid by {payerName}</span>
            </div>
          </div>
        </div>

        {/* Smart Notes Banner */}
        {expense.smartNotes && (
          <div className="bg-primary/5 border border-primary/10 rounded-btn p-3 flex items-start gap-2.5 my-3">
            <Sparkles className="w-4 h-4 text-primary shrink-0 mt-0.5" />
            <p className="text-xs text-foreground/80 leading-relaxed font-medium">{expense.smartNotes}</p>
          </div>
        )}

        {/* Overlapping Participants Avatars */}
        {expense.splits && expense.splits.length > 0 && (
          <div className="flex items-center justify-between text-xs mt-4">
            <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Split Participants</span>
            <div className="flex -space-x-1.5 overflow-hidden">
              {expense.splits.map((split) => {
                const member = members.find(m => m.id === split.userId);
                if (!member) return null;
                return (
                  <Avatar key={split.userId} size="sm" className="ring-2 ring-card">
                    {member.image ? <AvatarImage src={member.image} alt={member.name} /> : null}
                    <AvatarFallback>{member.name.charAt(0)}</AvatarFallback>
                  </Avatar>
                );
              })}
            </div>
          </div>
        )}

        {/* Expandable Section Toggle Button */}
        {(expense.lineItems || expense.travelInfo) && (
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="w-full flex items-center justify-between pt-4 text-xs text-muted-foreground hover:text-foreground transition-colors border-t border-border/50 mt-4 cursor-pointer"
          >
            <span>{isExpanded ? 'Hide parsed details' : 'Show parsed details'}</span>
            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        )}

        {/* Collapsible Category Details */}
        {isExpanded && (
          <div className="mt-4 pt-4 space-y-4 border-t border-border/30 animate-in fade-in slide-in-from-top-2 duration-200">
            {/* Food & Dining or Shopping line items */}
            {(expense.category === 'FOOD_DINING' || expense.category === 'SHOPPING') && expense.lineItems && expense.lineItems.length > 0 && (
              <div className="space-y-2">
                <div className="text-[10px] text-muted-foreground uppercase tracking-wider font-bold">Line Items</div>
                <div className="border border-border rounded-btn overflow-hidden text-xs">
                  <table className="w-full text-left border-collapse bg-card">
                    <thead>
                      <tr className="bg-muted border-b border-border text-muted-foreground">
                        <th className="p-2 font-bold">Item</th>
                        <th className="p-2 text-center font-bold w-12">Qty</th>
                        <th className="p-2 text-right font-bold w-20">Price</th>
                      </tr>
                    </thead>
                    <tbody>
                      {expense.lineItems.map((item: any, i: number) => (
                        <tr key={i} className="border-b border-border/50 text-foreground last:border-0 hover:bg-muted/30">
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

            {/* TRAVEL origin -> destination route */}
            {(expense.category === 'TRAVEL_TRANSPORT') && expense.travelInfo && (
              <div className="space-y-2">
                <div className="text-[10px] text-muted-foreground uppercase tracking-wider font-bold">Travel Itinerary</div>
                <div className="bg-muted/40 border border-border rounded-btn p-4 text-xs space-y-3">
                  <div className="flex items-center gap-3 text-foreground">
                    <div className="flex items-center gap-1.5 font-bold bg-card px-2.5 py-1 rounded-md border border-border">
                      <MapPin className="w-3.5 h-3.5 text-rose-500" />
                      <span>{expense.travelInfo.origin}</span>
                    </div>
                    <ArrowRight className="w-4 h-4 text-muted-foreground" />
                    <div className="flex items-center gap-1.5 font-bold bg-card px-2.5 py-1 rounded-md border border-border">
                      <MapPin className="w-3.5 h-3.5 text-emerald-500" />
                      <span>{expense.travelInfo.destination}</span>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3 text-muted-foreground pt-2 border-t border-border/50">
                    <div>
                      <span className="text-muted-foreground block text-[9px] uppercase font-bold">Distance</span>
                      <span className="text-foreground font-extrabold">{expense.travelInfo.distanceKm} km</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground block text-[9px] uppercase font-bold">Vehicle Type</span>
                      <span className="text-foreground font-extrabold capitalize">{expense.travelInfo.vehicleType}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Mock Barcode Footer */}
        <div 
          className="h-10 mt-6 rounded-xl opacity-20 bg-muted" 
          style={{
            backgroundImage: 'repeating-linear-gradient(90deg, var(--muted-foreground) 0px, var(--muted-foreground) 2px, transparent 2px, transparent 8px, var(--muted-foreground) 8px, var(--muted-foreground) 14px, transparent 14px, transparent 18px)'
          }}
        ></div>
      </div>
    </Card>
  );
};
