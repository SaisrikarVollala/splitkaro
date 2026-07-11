import { User as UserIcon } from 'lucide-react';

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
    <div className="flex items-center justify-between p-4 bg-[#12121a] border border-gray-800 rounded-2xl hover:border-gray-700 transition-colors">
      <div className="flex items-center gap-3">
        {member.image ? (
          <img src={member.image} alt={member.name} className="w-10 h-10 rounded-full border border-gray-700" />
        ) : (
          <div className="w-10 h-10 rounded-full bg-gray-800 flex items-center justify-center border border-gray-700">
            <UserIcon className="w-5 h-5 text-gray-400" />
          </div>
        )}
        <div>
          <h4 className="font-medium text-white">{member.name} {member.isMe && <span className="text-xs text-gray-500 ml-1">(You)</span>}</h4>
        </div>
      </div>

      {!member.isMe && (
        <div className="flex items-center gap-4">
          <div className="text-right">
            {isSettled ? (
              <span className="text-sm font-medium text-gray-400 bg-gray-800/50 px-3 py-1 rounded-full">Settled Up</span>
            ) : isReceive ? (
              <span className="text-sm font-bold text-[#00d09c] bg-[#00d09c]/10 px-3 py-1 rounded-full border border-[#00d09c]/20">
                Receive {displayAmount}
              </span>
            ) : (
              <span className="text-sm font-bold text-[#ff4757] bg-[#ff4757]/10 px-3 py-1 rounded-full border border-[#ff4757]/20">
                Pay {displayAmount}
              </span>
            )}
          </div>
          {!isSettled && onSettleUp && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onSettleUp(member.id, member.name, member.balance);
              }}
              className="bg-[#00d09c] hover:bg-[#00b386] text-black font-semibold text-xs px-3.5 py-1.5 rounded-xl transition-all shadow-md shadow-[#00d09c]/10"
            >
              Settle Up
            </button>
          )}
        </div>
      )}
    </div>
  );
};

