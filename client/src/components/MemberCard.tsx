import { User as UserIcon } from 'lucide-react';
import { Avatar, AvatarImage, AvatarFallback } from './ui/avatar';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Card } from './ui/card';

interface MemberCardProps {
  member: {
    id: string;
    name: string;
    image: string | null;
    balance: number;
    isMe: boolean;
  };
  onSettleUp?: (memberId: string, name: string, balance: number) => void;
}

export const MemberCard = ({ member, onSettleUp }: MemberCardProps) => {
  // Positive balance means member owes me (I receive)
  // Negative balance means I owe member (I pay)
  
  const isSettled = member.balance === 0;
  const isReceive = member.balance > 0;
  
  const displayAmount = `₹${Math.abs(member.balance).toLocaleString('en-IN')}`;

  return (
    <Card className="flex items-center justify-between p-4 hover:border-primary/30 hover:shadow-sm transition-all duration-200">
      <div className="flex items-center gap-3">
        <Avatar size="default" className="border border-border">
          {member.image ? <AvatarImage src={member.image} alt={member.name} /> : null}
          <AvatarFallback>{member.name.charAt(0)}</AvatarFallback>
        </Avatar>
        <div>
          <h4 className="text-sm font-bold text-foreground">
            {member.name} {member.isMe && <span className="text-xs text-muted-foreground font-normal ml-1">(You)</span>}
          </h4>
          <p className="text-[10px] text-muted-foreground font-medium mt-0.5">Group Participant</p>
        </div>
      </div>

      {!member.isMe && (
        <div className="flex items-center gap-4">
          <div className="text-right">
            {isSettled ? (
              <Badge variant="secondary" className="text-[10px] uppercase font-bold tracking-wider">
                Settled Up
              </Badge>
            ) : isReceive ? (
              <span className="inline-flex items-center text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/30 px-2.5 py-1 rounded-full border border-emerald-200 dark:border-emerald-900/50">
                Owes You {displayAmount}
              </span>
            ) : (
              <span className="inline-flex items-center text-xs font-bold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/30 px-2.5 py-1 rounded-full border border-rose-200 dark:border-rose-900/50">
                You Owe {displayAmount}
              </span>
            )}
          </div>
          {!isSettled && onSettleUp && (
            <Button
              onClick={(e) => {
                e.stopPropagation();
                onSettleUp(member.id, member.name, member.balance);
              }}
              size="sm"
              className="font-bold cursor-pointer"
            >
              Settle Up
            </Button>
          )}
        </div>
      )}
    </Card>
  );
};
