import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { HelpCircle, Plus, MessageCircle, Clock, CheckCircle, AlertCircle, Car, Package, CreditCard, User, Settings } from 'lucide-react';
import { useSupportTickets } from '@/hooks/useSupportTickets';

export const SupportSection = () => {
  const { 
    tickets, 
    categories, 
    createTicket, 
    getTicketsByStatus,
    getOpenTicketsCount,
    getTicketStatusColor,
    getPriorityColor,
    isLoading 
  } = useSupportTickets();

  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [newTicket, setNewTicket] = useState({
    subject: '',
    description: '',
    category_id: '',
    priority: 'medium' as 'low' | 'medium' | 'high' | 'urgent',
  });

  const resetForm = () => {
    setNewTicket({
      subject: '',
      description: '',
      category_id: '',
      priority: 'medium',
    });
  };

  const handleCreateTicket = async () => {
    const result = await createTicket(newTicket);
    if (result) {
      resetForm();
      setIsCreateDialogOpen(false);
    }
  };

  const getCategoryIcon = (iconName: string) => {
    switch (iconName) {
      case 'car': return <Car className="h-4 w-4" />;
      case 'package': return <Package className="h-4 w-4" />;
      case 'credit-card': return <CreditCard className="h-4 w-4" />;
      case 'user': return <User className="h-4 w-4" />;
      case 'settings': return <Settings className="h-4 w-4" />;
      default: return <HelpCircle className="h-4 w-4" />;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'open': return <AlertCircle className="h-4 w-4 text-blue-500" />;
      case 'in_progress': return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'resolved': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'closed': return <CheckCircle className="h-4 w-4 text-gray-500" />;
      default: return <AlertCircle className="h-4 w-4" />;
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'open': return 'Ouvert';
      case 'in_progress': return 'En cours';
      case 'resolved': return 'Résolu';
      case 'closed': return 'Fermé';
      default: return status;
    }
  };

  const getPriorityLabel = (priority: string) => {
    switch (priority) {
      case 'low': return 'Faible';
      case 'medium': return 'Moyenne';
      case 'high': return 'Élevée';
      case 'urgent': return 'Urgente';
      default: return priority;
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <HelpCircle className="h-5 w-5 text-primary" />
              <CardTitle className="text-lg">Support Client</CardTitle>
            </div>
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={resetForm}>
                  <Plus className="h-4 w-4 mr-2" />
                  Nouveau ticket
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-lg">
                <DialogHeader>
                  <DialogTitle>Créer un ticket de support</DialogTitle>
                  <DialogDescription>
                    Décrivez votre problème et nous vous aiderons rapidement
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="category">Catégorie</Label>
                    <Select value={newTicket.category_id} onValueChange={(value) => setNewTicket({...newTicket, category_id: value})}>
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionnez une catégorie" />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map((category) => (
                          <SelectItem key={category.id} value={category.id}>
                            <div className="flex items-center space-x-2">
                              {getCategoryIcon(category.icon)}
                              <span>{category.name}</span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="subject">Sujet</Label>
                    <Input
                      id="subject"
                      placeholder="Résumé de votre problème"
                      value={newTicket.subject}
                      onChange={(e) => setNewTicket({...newTicket, subject: e.target.value})}
                    />
                  </div>

                  <div>
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      placeholder="Décrivez votre problème en détail..."
                      value={newTicket.description}
                      onChange={(e) => setNewTicket({...newTicket, description: e.target.value})}
                      rows={4}
                    />
                  </div>

                  <div>
                    <Label htmlFor="priority">Priorité</Label>
                    <Select value={newTicket.priority} onValueChange={(value: any) => setNewTicket({...newTicket, priority: value})}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">Faible</SelectItem>
                        <SelectItem value="medium">Moyenne</SelectItem>
                        <SelectItem value="high">Élevée</SelectItem>
                        <SelectItem value="urgent">Urgente</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex justify-end space-x-2">
                    <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                      Annuler
                    </Button>
                    <Button 
                      onClick={handleCreateTicket} 
                      disabled={!newTicket.subject || !newTicket.description || !newTicket.category_id}
                    >
                      Créer le ticket
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
          <CardDescription>
            Contactez notre équipe de support pour toute assistance
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Statistiques rapides */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <Card>
              <CardContent className="p-4 text-center">
                <AlertCircle className="h-6 w-6 mx-auto mb-2 text-blue-500" />
                <p className="text-2xl font-bold">{getTicketsByStatus('open').length}</p>
                <p className="text-xs text-muted-foreground">Ouverts</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <Clock className="h-6 w-6 mx-auto mb-2 text-yellow-500" />
                <p className="text-2xl font-bold">{getTicketsByStatus('in_progress').length}</p>
                <p className="text-xs text-muted-foreground">En cours</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <CheckCircle className="h-6 w-6 mx-auto mb-2 text-green-500" />
                <p className="text-2xl font-bold">{getTicketsByStatus('resolved').length}</p>
                <p className="text-xs text-muted-foreground">Résolus</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <MessageCircle className="h-6 w-6 mx-auto mb-2 text-gray-500" />
                <p className="text-2xl font-bold">{tickets.length}</p>
                <p className="text-xs text-muted-foreground">Total</p>
              </CardContent>
            </Card>
          </div>

          {/* Liste des tickets */}
          <div>
            <h4 className="font-medium mb-4">Mes tickets de support</h4>
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : tickets.length > 0 ? (
              <ScrollArea className="h-[400px]">
                <div className="space-y-3">
                  {tickets.map((ticket, index) => (
                    <React.Fragment key={ticket.id}>
                      <Card className="hover:bg-muted/50 transition-colors">
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center space-x-2 mb-2">
                                <h5 className="font-medium truncate">{ticket.subject}</h5>
                                <Badge variant="outline" className="text-xs">
                                  #{ticket.id.slice(0, 8)}
                                </Badge>
                              </div>
                              <p className="text-sm text-muted-foreground mb-2 line-clamp-2">
                                {ticket.description}
                              </p>
                              <div className="flex items-center space-x-4 text-xs text-muted-foreground">
                                <span>{new Date(ticket.created_at).toLocaleDateString('fr-FR')}</span>
                                <span className={getPriorityColor(ticket.priority)}>
                                  Priorité: {getPriorityLabel(ticket.priority)}
                                </span>
                              </div>
                            </div>
                            <div className="flex items-center space-x-2 ml-4">
                              {getStatusIcon(ticket.status)}
                              <Badge variant="outline" className={getTicketStatusColor(ticket.status)}>
                                {getStatusLabel(ticket.status)}
                              </Badge>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                      {index < tickets.length - 1 && <Separator />}
                    </React.Fragment>
                  ))}
                </div>
              </ScrollArea>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <HelpCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p className="text-sm">Aucun ticket de support</p>
                <p className="text-xs">Créez un ticket si vous avez besoin d'aide</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* FAQ ou liens rapides */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Questions fréquentes</CardTitle>
          <CardDescription>
            Trouvez rapidement des réponses aux questions courantes
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[
              { question: "Comment annuler une course ?", category: "Transport" },
              { question: "Que faire si ma livraison est en retard ?", category: "Livraison" },
              { question: "Comment modifier mes informations de paiement ?", category: "Paiement" },
              { question: "Comment contacter mon chauffeur ?", category: "Transport" },
            ].map((faq, index) => (
              <Button key={index} variant="ghost" className="w-full justify-start h-auto p-3">
                <div className="text-left">
                  <p className="font-medium">{faq.question}</p>
                  <p className="text-xs text-muted-foreground">{faq.category}</p>
                </div>
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};