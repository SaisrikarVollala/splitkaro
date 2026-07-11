import { Clock } from 'lucide-react';

interface ActivityItemProps {
  activity: {
    id: string;
    message: string;
    createdAt: string;
  };
}

export const ActivityItem = ({ activity }: ActivityItemProps) => {
  const date = new Date(activity.createdAt);
  const formattedDate = date.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit'
  });

  return (
    <div className="flex gap-4 p-4 bg-[#12121a] border border-gray-800 rounded-2xl relative overflow-hidden group hover:border-gray-700 transition-colors">
      <div className="absolute left-0 top-0 bottom-0 w-1 bg-gray-800 group-hover:bg-[#00d09c] transition-colors"></div>
      <div className="flex-1">
        <p className="text-gray-200">{activity.message}</p>
        <div className="flex items-center gap-1.5 mt-2 text-xs text-gray-500">
          <Clock className="w-3.5 h-3.5" />
          <span>{formattedDate}</span>
        </div>
      </div>
    </div>
  );
};
