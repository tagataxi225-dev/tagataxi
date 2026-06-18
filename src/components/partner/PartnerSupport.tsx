import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { 
  Phone, 
  Mail, 
  MessageCircle, 
  Send, 
  Ticket, 
  Clock, 
  CheckCircle, 
  AlertCircle,
  Car,
  CreditCard,
  Users,
  Settings,
  HelpCircle,
  TrendingUp,
  FileText
} from "lucide-react";

const PartnerSupport = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  
  // Form state
  const [subject, setSubject] = useState("");
  const [category, setCategory] = useState("");
  const [priority, setPriority] = useState("medium");
  const [description, setDescription] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Tickets state
  const [tickets, setTickets] = useState<any[]>([]);
  const [selectedTicket, setSelectedTicket] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [isLoadingTickets, setIsLoadingTickets] = useState(true);

  // Partner-specific categories
  const partnerCategories = [
    { value: "commissions", label: "Commissions & Paiements", icon: CreditCard },
    { value: "chauffeurs", label: "Gestion des chauffeurs", icon: Users },
    { value: "vehicules", label: "Gestion de flotte", icon: Car },
    { value: "analytics", label: "Rapports & Analytics", icon: TrendingUp },
    { value: "contrats", label: "Contrats & Accords", icon: FileText },
    { value: "technique", label: "Problème technique", icon: Settings },
    { value: "autre", label: "Autre", icon: HelpCircle }
  ];

  // Contact methods for partners
  const contactMethods = [
    {
      type: "phone",
      title: "Support Partenaires",
      description: "Ligne dédiée aux partenaires",
      contact: "+243 858 040 400",
      availability: "Lun-Ven 8h-18h",
      icon: Phone,
      priority: true
    },
    {
      type: "whatsapp",
      title: "WhatsApp Business",
      description: "Support rapide partenaires",
      contact: "+243 858 040 400",
      availability: "7j/7 9h-21h",
      icon: MessageCircle,
      priority: false
    },
    {
      type: "email",
      title: "Email Partenaires",
      description: "Pour questions détaillées",
      contact: "partenaires@tembea.app",
      availability: "Réponse sous 2h",
      icon: Mail,
      priority: false
    }
  ];

  // Load user tickets
  useEffect(() => {
    if (user) {
      fetchTickets();
    }
  }, [user]);

  // Load messages when ticket is selected
  useEffect(() => {
    if (selectedTicket) {
      fetchMessages(selectedTicket.id);
    }
  }, [selectedTicket]);

  const fetchTickets = async () => {
    if (!user) return;
    
    setIsLoadingTickets(true);
    try {
      const { data, error } = await supabase
        .from('enhanced_support_tickets')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTickets(data || []);
    } catch (error) {
      console.error('Error fetching tickets:', error);
      toast({
        title: "Erreur",
        description: "Impossible de charger vos tickets",
        variant: "destructive",
      });
    } finally {
      setIsLoadingTickets(false);
    }
  };

  const fetchMessages = async (ticketId: string) => {
    try {
      const { data, error } = await supabase
        .from('support_messages')
        .select('*')
        .eq('ticket_id', ticketId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setMessages(data || []);
    } catch (error) {
      console.error('Error fetching messages:', error);
    }
  };

  const handleSubmitTicket = async () => {
    if (!user) {
      toast({
        title: "Erreur",
        description: "Vous devez être connecté pour créer un ticket",
        variant: "destructive",
      });
      return;
    }

    if (!subject.trim() || !category || !description.trim()) {
      toast({
        title: "Erreur",
        description: "Veuillez remplir tous les champs obligatoires",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const { data, error } = await supabase
        .rpc('create_support_ticket', {
          p_user_id: user.id,
          p_subject: subject.trim(),
          p_category: category,
          p_description: description.trim(),
          p_priority: priority,
          p_metadata: { user_type: 'partner' }
        });

      if (error) throw error;

      toast({
        title: "Ticket créé",
        description: `Votre ticket #${data[0]?.ticket_number} a été créé avec succès`,
        variant: "default",
      });

      // Reset form and refresh tickets
      setSubject("");
      setCategory("");
      setPriority("medium");
      setDescription("");
      fetchTickets();
    } catch (error) {
      console.error('Error creating ticket:', error);
      toast({
        title: "Erreur",
        description: "Impossible de créer le ticket",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSendMessage = async () => {
    if (!selectedTicket || !newMessage.trim() || !user) return;

    try {
      const { error } = await supabase
        .from('support_messages')
        .insert([{
          ticket_id: selectedTicket.id,
          sender_id: user.id,
          sender_type: 'partner',
          message: newMessage.trim()
        }]);

      if (error) throw error;

      setNewMessage("");
      fetchMessages(selectedTicket.id);
    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: "Erreur",
        description: "Impossible d'envoyer le message",
        variant: "destructive",
      });
    }
  };

  // Helper functions
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'open': return <AlertCircle className="w-4 h-4 text-orange-500" />;
      case 'in_progress': return <Clock className="w-4 h-4 text-blue-500" />;
      case 'resolved': return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'closed': return <CheckCircle className="w-4 h-4 text-gray-500" />;
      default: return <AlertCircle className="w-4 h-4" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open': return "bg-orange-100 text-orange-800 border-orange-200";
      case 'in_progress': return "bg-blue-100 text-blue-800 border-blue-200";
      case 'resolved': return "bg-green-100 text-green-800 border-green-200";
      case 'closed': return "bg-gray-100 text-gray-800 border-gray-200";
      default: return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'low': return "bg-green-100 text-green-800 border-green-200";
      case 'medium': return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case 'high': return "bg-red-100 text-red-800 border-red-200";
      default: return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-primary/10 rounded-lg">
          <MessageCircle className="w-6 h-6 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">Support Partenaire</h1>
          <p className="text-muted-foreground">Support dédié à nos partenaires TAGA</p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* Contact Methods */}
        <div className="lg:col-span-3">
          <h2 className="text-lg font-semibold mb-4">Nous contacter</h2>
          <div className="grid gap-4 md:grid-cols-3">
            {contactMethods.map((method, index) => {
              const IconComponent = method.icon;
              return (
                <Card key={index} className={`transition-all duration-200 hover:shadow-md ${method.priority ? 'border-blue-200 bg-blue-50' : ''}`}>
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <div className={`p-2 rounded-lg ${method.priority ? 'bg-blue-100' : 'bg-gray-100'}`}>
                        <IconComponent className={`w-5 h-5 ${method.priority ? 'text-blue-600' : 'text-gray-600'}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-sm">{method.title}</h3>
                        <p className="text-xs text-muted-foreground mb-2">{method.description}</p>
                        <p className="font-mono text-sm text-primary">{method.contact}</p>
                        <p className="text-xs text-muted-foreground">{method.availability}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>

        {/* Create Ticket Form */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Ticket className="w-5 h-5" />
                Nouveau Ticket de Support
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Catégorie *</label>
                  <Select value={category} onValueChange={setCategory}>
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionnez une catégorie" />
                    </SelectTrigger>
                    <SelectContent>
                      {partnerCategories.map((cat) => {
                        const IconComponent = cat.icon;
                        return (
                          <SelectItem key={cat.value} value={cat.value}>
                            <div className="flex items-center gap-2">
                              <IconComponent className="w-4 h-4" />
                              {cat.label}
                            </div>
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Priorité</label>
                  <Select value={priority} onValueChange={setPriority}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Faible</SelectItem>
                      <SelectItem value="medium">Moyenne</SelectItem>
                      <SelectItem value="high">Élevée</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Sujet *</label>
                <Input
                  placeholder="Décrivez brièvement votre demande"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Description détaillée *</label>
                <Textarea
                  placeholder="Décrivez votre demande en détail..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={4}
                />
              </div>

              <Button 
                onClick={handleSubmitTicket}
                disabled={isSubmitting || !user}
                className="w-full"
              >
                <Send className="w-4 h-4 mr-2" />
                {isSubmitting ? "Envoi en cours..." : "Créer le Ticket"}
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Tickets List */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Ticket className="w-5 h-5" />
                Mes Tickets
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoadingTickets ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                  <p className="mt-2 text-muted-foreground text-sm">Chargement...</p>
                </div>
              ) : (
                <ScrollArea className="h-64">
                  <div className="space-y-3">
                    {tickets.map((ticket) => (
                      <div 
                        key={ticket.id} 
                        className={`border rounded-lg p-3 hover:bg-muted/50 transition-colors cursor-pointer text-sm ${
                          selectedTicket?.id === ticket.id ? 'border-primary bg-primary/5' : ''
                        }`}
                        onClick={() => setSelectedTicket(ticket)}
                      >
                        <div className="flex items-center gap-2 mb-2">
                          <span className="font-mono text-xs text-muted-foreground">
                            {ticket.ticket_number}
                          </span>
                          <Badge className={getStatusColor(ticket.status)}>
                            {getStatusIcon(ticket.status)}
                          </Badge>
                        </div>
                        <h4 className="font-medium mb-1">{ticket.subject}</h4>
                        <p className="text-xs text-muted-foreground">
                          {new Date(ticket.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    ))}
                    {tickets.length === 0 && (
                      <div className="text-center py-8 text-muted-foreground">
                        <Ticket className="w-8 h-8 mx-auto mb-2 opacity-50" />
                        <p className="text-sm">Aucun ticket</p>
                      </div>
                    )}
                  </div>
                </ScrollArea>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Ticket Detail and Chat */}
        {selectedTicket && (
          <div className="lg:col-span-3">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageCircle className="w-5 h-5" />
                  {selectedTicket.subject}
                  <Badge className={getStatusColor(selectedTicket.status)}>
                    {selectedTicket.status.replace('_', ' ')}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="bg-muted/50 p-4 rounded-lg">
                    <p className="text-sm">{selectedTicket.description}</p>
                  </div>
                  
                  <Separator />
                  
                  <div className="space-y-4">
                    <h4 className="font-medium">Conversation</h4>
                    <ScrollArea className="h-64 border rounded-lg p-4">
                      <div className="space-y-4">
                        {messages.map((message) => (
                          <div 
                            key={message.id}
                            className={`flex ${message.sender_type === 'partner' ? 'justify-end' : 'justify-start'}`}
                          >
                            <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                              message.sender_type === 'partner' 
                                ? 'bg-primary text-primary-foreground' 
                                : 'bg-muted'
                            }`}>
                              <p className="text-sm">{message.message}</p>
                              <span className="text-xs opacity-70">
                                {new Date(message.created_at).toLocaleString()}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                    
                    {selectedTicket.status !== 'closed' && (
                      <div className="flex gap-2">
                        <Textarea
                          placeholder="Tapez votre message..."
                          value={newMessage}
                          onChange={(e) => setNewMessage(e.target.value)}
                          className="flex-1"
                          rows={3}
                        />
                        <Button 
                          onClick={handleSendMessage}
                          disabled={!newMessage.trim()}
                          size="sm"
                        >
                          <Send className="w-4 h-4" />
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
};

export default PartnerSupport;