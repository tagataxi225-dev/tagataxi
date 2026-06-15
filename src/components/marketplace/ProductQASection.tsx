import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { MessageCircle, Send } from 'lucide-react';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';

interface ProductQASectionProps {
  productId: string;
  sellerId: string;
}

interface QuestionAnswer {
  id: string;
  question: string;
  answer: string | null;
  created_at: string;
  answered_at: string | null;
  user_id: string;
}

export const ProductQASection: React.FC<ProductQASectionProps> = ({ productId, sellerId }) => {
  const { user } = useAuth();
  const [questions, setQuestions] = useState<QuestionAnswer[]>([]);
  const [newQuestion, setNewQuestion] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadQuestions();
  }, [productId]);

  const loadQuestions = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('product_qa')
        .select('*')
        .eq('product_id', productId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setQuestions(data || []);
    } catch (error) {
      console.error('Erreur chargement questions:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitQuestion = async () => {
    if (!user) {
      toast.error('Connectez-vous pour poser une question');
      return;
    }

    if (!newQuestion.trim()) {
      toast.error('Veuillez saisir une question');
      return;
    }

    try {
      setSubmitting(true);
      
      // Insérer question
      const { error: insertError } = await supabase
        .from('product_qa')
        .insert({
          product_id: productId,
          user_id: user.id,
          question: newQuestion.trim()
        });

      if (insertError) throw insertError;

      // Notifier vendeur
      await supabase.from('system_notifications').insert({
        notification_type: 'product_question',
        title: 'Nouvelle question sur votre produit',
        message: newQuestion.trim(),
        data: { product_id: productId, type: 'product_question' },
        user_id: sellerId
      });

      toast.success('Question envoyée au vendeur');
      setNewQuestion('');
      loadQuestions();
    } catch (error) {
      console.error('Erreur envoi question:', error);
      toast.error('Impossible d\'envoyer la question');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageCircle className="h-5 w-5" />
            Questions / Réponses
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-10" />
          <Skeleton className="h-20" />
          <Skeleton className="h-20" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageCircle className="h-5 w-5" />
          Questions / Réponses
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Formulaire question */}
        <div className="flex gap-2">
          <Input
            placeholder="Posez votre question au vendeur..."
            value={newQuestion}
            onChange={(e) => setNewQuestion(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && !submitting && handleSubmitQuestion()}
            disabled={submitting}
          />
          <Button 
            onClick={handleSubmitQuestion}
            disabled={submitting || !newQuestion.trim()}
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>

        {/* Liste questions/réponses */}
        <div className="space-y-4">
          {questions.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <MessageCircle className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>Aucune question pour le moment</p>
              <p className="text-sm">Soyez le premier à poser une question !</p>
            </div>
          ) : (
            questions.map(qa => (
              <div key={qa.id} className="border-l-2 border-primary pl-4 space-y-2">
                <div>
                  <p className="font-semibold text-sm">Q: {qa.question}</p>
                  <span className="text-xs text-muted-foreground">
                    {formatDistanceToNow(new Date(qa.created_at), { 
                      addSuffix: true,
                      locale: fr 
                    })}
                  </span>
                </div>
                {qa.answer ? (
                  <div className="bg-muted/50 p-3 rounded-md">
                    <p className="text-sm">R: {qa.answer}</p>
                    {qa.answered_at && (
                      <span className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(qa.answered_at), { 
                          addSuffix: true,
                          locale: fr 
                        })}
                      </span>
                    )}
                  </div>
                ) : (
                  <div className="text-xs text-muted-foreground italic">
                    En attente de réponse du vendeur...
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
};
