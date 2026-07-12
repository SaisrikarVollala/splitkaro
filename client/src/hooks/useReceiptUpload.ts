import { useState } from 'react';
import { useExpenseStore } from '../stores/expenseStore';

export const useReceiptUpload = () => {
  const [isUploading, setIsUploading] = useState(false);
  const uploadReceipt = useExpenseStore(state => state.uploadReceipt);

  const handleUpload = async (groupId: string, file: File) => {
    setIsUploading(true);
    try {
      await uploadReceipt(groupId, file);
    } catch (err) {
      console.error('Error uploading receipt:', err);
    } finally {
      setIsUploading(false);
    }
  };

  return {
    handleUpload,
    isUploading
  };
};
