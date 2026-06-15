import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { 
  ArrowLeft, 
  Calendar, 
  Clock, 
  DollarSign, 
  Receipt,
  ChevronRight,
  CheckCircle,
  XCircle,
  TrendingUp,
  TrendingDown,
  Eye
} from 'lucide-react';
import { usePOSSession, POSSession } from '@/hooks/usePOSSession';
import { usePOSTransactions } from '@/hooks/usePOSTransactions';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface POSHistoryProps {
  restaurantId: string;
  onBack: () => void;
}

export const POSHistory = ({ restaurantId, onBack }: POSHistoryProps) => {
  const [sessions, setSessions] = useState<POSSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSession, setSelectedSession] = useState<POSSession | null>(null);
  const [sessionTransactions, setSessionTransactions] = useState<any[]>([]);

  const { getSessionHistory } = usePOSSession();
  const { getSessionTransactions } = usePOSTransactions();

  useEffect(() => {
    loadSessions();
  }, [restaurantId]);

  const loadSessions = async () => {
    setLoading(true);
    const history = await getSessionHistory(restaurantId, 50);
    setSessions(history as POSSession[]);
    setLoading(false);
  };

  const handleViewSession = async (session: POSSession) => {
    setSelectedSession(session);
    const txs = await getSessionTransactions(session.id);
    setSessionTransactions(txs);
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('fr-FR', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  const formatTime = (dateStr: string) => {
    return new Date(dateStr).toLocaleTimeString('fr-FR', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusBadge = (session: POSSession) => {
    if (session.status === 'open') {
      return <Badge className="bg-green-500">En cours</Badge>;
    }
    if (session.cash_difference === 0) {
      return <Badge variant="outline" className="text-green-600 border-green-600">Équilibré</Badge>;
    }
    if (session.cash_difference && session.cash_difference > 0) {
      return <Badge className="bg-blue-500">+{session.cash_difference.toLocaleString()}</Badge>;
    }
    return <Badge variant="destructive">{session.cash_difference?.toLocaleString()}</Badge>;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={onBack}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Historique des sessions</h1>
          <p className="text-muted-foreground">{sessions.length} sessions enregistrées</p>
        </div>
      </div>

      {/* Sessions List */}
      <Card>
        <CardContent className="p-0">
          <ScrollArea className="h-[60vh]">
            <div className="divide-y">
              {sessions.map((session, index) => (
                <motion.div
                  key={session.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="p-4 hover:bg-muted/50 transition-colors cursor-pointer"
                  onClick={() => handleViewSession(session)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className={`p-3 rounded-xl ${
                        session.status === 'open'
                          ? 'bg-green-500/10'
                          : session.cash_difference === 0
                            ? 'bg-muted'
                            : session.cash_difference && session.cash_difference > 0
                              ? 'bg-blue-500/10'
                              : 'bg-red-500/10'
                      }`}>
                        {session.status === 'open' ? (
                          <Clock className="h-5 w-5 text-green-600" />
                        ) : session.cash_difference === 0 ? (
                          <CheckCircle className="h-5 w-5 text-green-600" />
                        ) : session.cash_difference && session.cash_difference > 0 ? (
                          <TrendingUp className="h-5 w-5 text-blue-600" />
                        ) : (
                          <TrendingDown className="h-5 w-5 text-red-600" />
                        )}
                      </div>
                      
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-medium">{formatDate(session.opened_at)}</p>
                          {getStatusBadge(session)}
                        </div>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {formatTime(session.opened_at)}
                            {session.closed_at && ` - ${formatTime(session.closed_at)}`}
                          </span>
                          <span className="flex items-center gap-1">
                            <Receipt className="h-3 w-3" />
                            {session.total_transactions || 0} ventes
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="font-bold text-lg">{(session.total_sales || 0).toLocaleString()} CDF</p>
                        <p className="text-xs text-muted-foreground">
                          Fond: {session.opening_cash.toLocaleString()} CDF
                        </p>
                      </div>
                      <ChevronRight className="h-5 w-5 text-muted-foreground" />
                    </div>
                  </div>
                </motion.div>
              ))}

              {sessions.length === 0 && !loading && (
                <div className="p-8 text-center text-muted-foreground">
                  <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Aucune session enregistrée</p>
                </div>
              )}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Session Detail Dialog */}
      <Dialog open={!!selectedSession} onOpenChange={() => setSelectedSession(null)}>
        <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Receipt className="h-5 w-5" />
              Détail de la session
            </DialogTitle>
          </DialogHeader>

          {selectedSession && (
            <div className="space-y-4">
              {/* Session Info */}
              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 rounded-lg bg-muted/50">
                  <p className="text-xs text-muted-foreground">Ouverture</p>
                  <p className="font-medium">{formatTime(selectedSession.opened_at)}</p>
                </div>
                <div className="p-3 rounded-lg bg-muted/50">
                  <p className="text-xs text-muted-foreground">Fermeture</p>
                  <p className="font-medium">
                    {selectedSession.closed_at ? formatTime(selectedSession.closed_at) : '-'}
                  </p>
                </div>
                <div className="p-3 rounded-lg bg-muted/50">
                  <p className="text-xs text-muted-foreground">Fond de caisse</p>
                  <p className="font-medium">{selectedSession.opening_cash.toLocaleString()} CDF</p>
                </div>
                <div className="p-3 rounded-lg bg-muted/50">
                  <p className="text-xs text-muted-foreground">Clôture</p>
                  <p className="font-medium">
                    {selectedSession.closing_cash?.toLocaleString() || '-'} CDF
                  </p>
                </div>
              </div>

              {/* Totals */}
              <div className="p-4 rounded-lg bg-gradient-to-r from-orange-500/10 to-red-500/10 border border-orange-500/20">
                <div className="flex justify-between items-center">
                  <span>Total des ventes</span>
                  <span className="text-xl font-bold">
                    {(selectedSession.total_sales || 0).toLocaleString()} CDF
                  </span>
                </div>
                {selectedSession.cash_difference !== null && (
                  <div className="flex justify-between items-center mt-2 pt-2 border-t border-orange-500/20">
                    <span>Écart de caisse</span>
                    <Badge variant={
                      selectedSession.cash_difference === 0 
                        ? 'outline' 
                        : selectedSession.cash_difference > 0 
                          ? 'default' 
                          : 'destructive'
                    }>
                      {selectedSession.cash_difference > 0 ? '+' : ''}
                      {selectedSession.cash_difference.toLocaleString()} CDF
                    </Badge>
                  </div>
                )}
              </div>

              {/* Transactions */}
              <div>
                <h4 className="font-medium mb-3">Transactions ({sessionTransactions.length})</h4>
                <ScrollArea className="h-48">
                  <div className="space-y-2">
                    {sessionTransactions.map((tx, i) => (
                      <div key={tx.id} className="flex items-center justify-between p-2 rounded bg-muted/50 text-sm">
                        <div>
                          <span className="font-medium">#{tx.transaction_number || i + 1}</span>
                          <span className="text-muted-foreground ml-2">
                            {new Date(tx.created_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-xs">
                            {tx.payment_method === 'cash' ? 'Espèces' :
                             tx.payment_method === 'card' ? 'Carte' :
                             tx.payment_method === 'mobile_money' ? 'Mobile' : 'TembeaPay'}
                          </Badge>
                          <span className="font-bold">{tx.total_amount.toLocaleString()} CDF</span>
                        </div>
                      </div>
                    ))}
                    {sessionTransactions.length === 0 && (
                      <p className="text-center text-muted-foreground py-4">Aucune transaction</p>
                    )}
                  </div>
                </ScrollArea>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};
