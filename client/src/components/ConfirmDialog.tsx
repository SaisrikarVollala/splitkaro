import { AlertTriangle, Loader2 } from 'lucide-react';
import { Button } from './ui/button';

interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  isLoading?: boolean;
}

export const ConfirmDialog = ({ isOpen, onClose, onConfirm, title, message, isLoading }: ConfirmDialogProps) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-xs" onClick={!isLoading ? onClose : undefined}></div>
      
      <div className="bg-card border border-border rounded-card w-full max-w-sm p-6 relative z-10 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
        <div className="w-12 h-12 bg-destructive/10 rounded-2xl flex items-center justify-center mb-4">
          <AlertTriangle className="w-6 h-6 text-destructive" />
        </div>
        
        <h3 className="text-lg font-bold text-foreground mb-2">{title}</h3>
        <p className="text-xs text-muted-foreground mb-6 leading-relaxed">{message}</p>
        
        <div className="flex gap-3">
          <Button
            onClick={onClose}
            disabled={isLoading}
            variant="outline"
            className="flex-1 font-bold cursor-pointer text-xs"
          >
            Cancel
          </Button>
          <Button
            onClick={onConfirm}
            disabled={isLoading}
            variant="destructive"
            className="flex-1 font-bold cursor-pointer text-xs"
          >
            {isLoading && <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" />}
            Confirm
          </Button>
        </div>
      </div>
    </div>
  );
};
