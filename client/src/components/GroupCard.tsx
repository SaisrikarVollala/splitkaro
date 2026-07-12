import { Link } from 'react-router-dom';
import { Users, Calendar, Compass } from 'lucide-react';
import { Group } from '../stores/groupStore';
import { Avatar, AvatarImage, AvatarFallback } from './ui/avatar';
import { Card } from './ui/card';

interface GroupCardProps {
  group: Group;
  balanceInfo?: {
    owe: number;
    owed: number;
    members: any[];
  };
}

export const GroupCard = ({ group, balanceInfo }: GroupCardProps) => {
  const memberCount = group._count?.members || 1;

  // Find balance for current user in this group
  const owe = balanceInfo?.owe || 0;
  const owed = balanceInfo?.owed || 0;
  const members = balanceInfo?.members || [];

  const isSettled = owe === 0 && owed === 0;

  // Calculate settlement progress
  const totalMembers = members.length || 1;
  const settledMembers = members.filter((m: any) => m.balance === 0).length;
  const progressPercent = Math.round((settledMembers / totalMembers) * 100);

  // Group Icon - based on name, select different icons for variety
  const getGroupIcon = (name: string) => {
    return <Compass className="w-5 h-5 text-primary" />;
  };

  return (
    <Link 
      to={`/groups/${group.id}`}
      className="block group hover:-translate-y-0.5 hover:scale-[1.01] transition-all duration-200 cursor-pointer"
    >
      <Card className="p-6 relative overflow-hidden bg-card border border-border rounded-card shadow-sm group-hover:shadow-md group-hover:border-primary/40 transition-all duration-200">
        {/* Background soft glow */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-bl-full pointer-events-none"></div>

      {/* Header Block */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-muted border border-border flex items-center justify-center shadow-inner">
            {getGroupIcon(group.name)}
          </div>
          <div>
            <h3 className="font-bold text-foreground group-hover:text-primary transition-colors text-base line-clamp-1">
              {group.name}
            </h3>
            <span className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
              <Users className="w-3.5 h-3.5" />
              <span>{memberCount} members</span>
            </span>
          </div>
        </div>
      </div>

      {/* Balance Block */}
      <div className="my-5 py-4 border-t border-b border-border/50">
        <p className="text-[10px] uppercase font-semibold text-muted-foreground tracking-wider">Group Balance</p>
        <div className="mt-1 text-sm font-semibold">
          {isSettled ? (
            <span className="text-muted-foreground">All settled up</span>
          ) : owed > 0 ? (
            <span className="text-success font-bold">You are owed ₹{owed.toLocaleString('en-IN')}</span>
          ) : (
            <span className="text-destructive font-bold">You owe ₹{owe.toLocaleString('en-IN')}</span>
          )}
        </div>
      </div>

      {/* Progress Block */}
      <div className="space-y-1.5 my-4">
        <div className="flex justify-between text-[10px] text-muted-foreground uppercase font-semibold">
          <span>Settlement Progress</span>
          <span>{progressPercent}%</span>
        </div>
        <div className="w-full bg-muted h-1.5 rounded-full overflow-hidden">
          <div 
            className="bg-primary h-full rounded-full transition-all duration-300"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* Overlapping Avatars Footer */}
      {members.length > 0 && (
        <div className="flex items-center justify-between pt-2">
          <div className="flex -space-x-1.5 overflow-hidden">
            {members.slice(0, 4).map((member) => (
              <Avatar key={member.id} size="sm" className="ring-2 ring-card">
                {member.image ? <AvatarImage src={member.image} alt={member.name} /> : null}
                <AvatarFallback>{member.name.charAt(0)}</AvatarFallback>
              </Avatar>
            ))}
            {members.length > 4 && (
              <div className="flex size-6 shrink-0 items-center justify-center rounded-full bg-muted text-[10px] font-semibold text-muted-foreground ring-2 ring-card">
                +{members.length - 4}
              </div>
            )}
          </div>
          <span className="text-[10px] text-muted-foreground font-medium">
            Active group
          </span>
        </div>
      )}
      </Card>
    </Link>
  );
};
