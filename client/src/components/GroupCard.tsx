import { Link } from 'react-router-dom';
import { Users } from 'lucide-react';
import { Group } from '../stores/groupStore';

interface GroupCardProps {
  group: Group;
}

export const GroupCard = ({ group }: GroupCardProps) => {
  return (
    <Link 
      to={`/groups/${group.id}`}
      className="block bg-[#12121a] border border-gray-800 rounded-2xl p-6 hover:border-[#00d09c]/50 hover:bg-[#1a1a24] transition-all group-hover:shadow-lg shadow-black/50 cursor-pointer relative overflow-hidden"
    >
      <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-[#00d09c]/5 to-transparent rounded-bl-full pointer-events-none"></div>
      
      <h3 className="text-xl font-semibold text-white mb-4 group-hover:text-[#00d09c] transition-colors">{group.name}</h3>
      
      <div className="flex items-center gap-2 text-gray-400 text-sm">
        <Users className="w-4 h-4" />
        <span>{group._count?.members || 1} Members</span>
      </div>
    </Link>
  );
};
