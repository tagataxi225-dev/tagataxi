import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const DriverProfilEmail = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <div className="sticky top-0 z-10 bg-white border-b px-4 py-3 flex items-center gap-3">
        <button
          type="button"
          onClick={() => navigate(-1)}
          aria-label="Retour"
          className="p-2 rounded-full hover:bg-muted"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <span className="font-semibold text-base">Email</span>
      </div>

      {!user ? (
        <div className="flex-1 px-4 py-6 space-y-6">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-gray-200 rounded w-3/4" />
            <div className="h-4 bg-gray-200 rounded w-1/2" />
          </div>
        </div>
      ) : (
        <div className="flex-1 px-4 py-6 space-y-6">
          <div className="bg-white rounded-xl p-4 space-y-4 border">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm text-gray-600">
                Adresse email
              </Label>
              <Input
                id="email"
                type="email"
                value={user.email ?? ''}
                readOnly
                className="bg-gray-100 text-gray-600 cursor-not-allowed"
              />
              <p className="text-xs text-gray-500">
                L'email est lié à votre compte et ne peut pas être modifié ici
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DriverProfilEmail;
