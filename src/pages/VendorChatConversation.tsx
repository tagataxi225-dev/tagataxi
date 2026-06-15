import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { UniversalChatInterface } from '@/components/chat/UniversalChatInterface';

export default function VendorChatConversation() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="sticky top-0 z-50 bg-background border-b">
        <div className="container max-w-4xl mx-auto px-4 py-3 flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate('/vendeur')}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="font-semibold">Conversation</h1>
        </div>
      </header>

      <div className="flex-1">
        <UniversalChatInterface
          contextType="marketplace"
          isFloating={false}
        />
      </div>
    </div>
  );
}
