import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { api } from '../lib/api';
import { Users, AlertTriangle, Loader2 } from 'lucide-react';
import { Navbar } from '../components/Navbar';

interface PreviewData {
  group: {
    id: string;
    name: string;
    memberCount: number;
  };
}

export const InvitePage = () => {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const [preview, setPreview] = useState<PreviewData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAccepting, setIsAccepting] = useState(false);

  useEffect(() => {
    const fetchPreview = async () => {
      try {
        const response = await api.get(`/api/invitations/${token}`);
        setPreview(response.data);
      } catch (err) {
        const message = axios.isAxiosError(err)
          ? err.response?.data?.error || 'Failed to load invitation.'
          : 'Failed to load invitation.';
        setError(message);
      } finally {
        setIsLoading(false);
      }
    };
    
    if (token) fetchPreview();
  }, [token]);

  const handleAccept = async () => {
    if (!token) return;
    setIsAccepting(true);
    try {
      const response = await api.post(`/api/invitations/${token}/accept`);
      navigate(`/groups/${response.data.groupId}`);
    } catch (err) {
      const message = axios.isAxiosError(err)
        ? err.response?.data?.error || 'Failed to join group.'
        : 'Failed to join group.';
      setError(message);
      setIsAccepting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] text-white flex flex-col">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-[#00d09c]" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white flex flex-col">
      <Navbar />
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-[#12121a] border border-gray-800 rounded-3xl p-8 text-center shadow-2xl backdrop-blur-xl">
          {error ? (
            <div>
              <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertTriangle className="w-8 h-8 text-[#ff4757]" />
              </div>
              <h2 className="text-2xl font-bold mb-2">Invalid Invitation</h2>
              <p className="text-gray-400 mb-8">{error}</p>
              <Link 
                to="/"
                className="block w-full bg-gray-800 hover:bg-gray-700 text-white font-medium py-3 rounded-xl transition-colors"
              >
                Return Home
              </Link>
            </div>
          ) : preview ? (
            <div>
              <div className="w-16 h-16 bg-[#00d09c]/10 rounded-full flex items-center justify-center mx-auto mb-4 border border-[#00d09c]/20">
                <Users className="w-8 h-8 text-[#00d09c]" />
              </div>
              <h2 className="text-3xl font-bold text-white mb-2">{preview.group.name}</h2>
              <div className="inline-flex items-center gap-2 bg-[#1a1a24] border border-gray-700 px-4 py-1.5 rounded-full text-gray-300 text-sm mb-8">
                <Users className="w-4 h-4" />
                <span>{preview.group.memberCount} Members</span>
              </div>
              
              <div className="flex flex-col gap-3">
                <button
                  onClick={handleAccept}
                  disabled={isAccepting}
                  className="w-full flex justify-center items-center gap-2 bg-[#00d09c] text-black font-semibold py-3.5 px-4 rounded-xl hover:bg-[#00b386] transition-colors disabled:opacity-50 shadow-lg shadow-[#00d09c]/20"
                >
                  {isAccepting && <Loader2 className="w-5 h-5 animate-spin" />}
                  Accept Invitation
                </button>
                <Link
                  to="/"
                  className="w-full text-gray-400 font-medium py-3 rounded-xl hover:bg-gray-800 transition-colors"
                >
                  Cancel
                </Link>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
};

export default InvitePage;
