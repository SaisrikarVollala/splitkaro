import { useState } from 'react';
import { X, Loader2 } from 'lucide-react';
import { useGroupStore } from '../stores/groupStore';
import { Button } from './ui/button';

interface CreateGroupDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (groupId: string) => void;
}

export const CreateGroupDialog = ({ isOpen, onClose, onSuccess }: CreateGroupDialogProps) => {
  const [name, setName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { createGroup } = useGroupStore();

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setIsSubmitting(true);
    const newGroup = await createGroup(name.trim());
    setIsSubmitting(false);

    if (newGroup) {
      setName('');
      onSuccess?.(newGroup.id);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-xs" onClick={onClose}></div>
      
      <div className="bg-card border border-border rounded-card w-full max-w-md p-6 relative z-10 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-foreground">Create Group</h2>
          <Button 
            onClick={onClose}
            variant="ghost"
            size="icon-sm"
            className="text-muted-foreground hover:text-foreground"
          >
            <X className="w-4.5 h-4.5" />
          </Button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="groupName" className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
              Group Name
            </label>
            <input
              id="groupName"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Manali Trip, Flat Expenses"
              className="w-full bg-muted border border-border rounded-input px-4 py-3 text-foreground placeholder-muted-foreground text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
              autoFocus
              required
            />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="font-semibold cursor-pointer text-xs"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={!name.trim() || isSubmitting}
              className="font-bold cursor-pointer text-xs"
            >
              {isSubmitting && <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" />}
              Create
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
