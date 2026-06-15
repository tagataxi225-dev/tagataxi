import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { useLanguage } from "@/contexts/LanguageContext";
import { supabase } from "@/integrations/supabase/client";
import { Phone, Mail, MessageCircle, Send, Ticket, HelpCircle, X } from "lucide-react";

const CustomerSupport = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const { t } = useLanguage();
  
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
        title: t('system.error'),
        description: t('support.error_login_required'),
        variant: "destructive",
      });
      return;
    }

    if (!subject.trim() || !category || !description.trim()) {
      toast({
        title: t('system.error'),
        description: t('support.error_required_fields'),
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
          p_metadata: { user_type: 'client' }
        });

      if (error) throw error;

      toast({
        title: t('support.ticket_created'),
        description: t('support.ticket_created_desc').replace('{0}', data[0]?.ticket_number),
        variant: "default",
      });

      setSubject("");
      setCategory("");
      setPriority("medium");
      setDescription("");
      fetchTickets();
    } catch (error) {
      console.error('Error creating ticket:', error);
      toast({
        title: t('system.error'),
        description: t('support.error_create_ticket'),
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
          sender_type: 'user',
          message: newMessage.trim()
        }]);

      if (error) throw error;

      setNewMessage("");
      fetchMessages(selectedTicket.id);
    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: t('system.error'),
        description: t('support.error_send_message'),
        variant: "destructive",
      });
    }
  };

  const getStatusDot = (status: string) => {
    const colors: Record<string, string> = {
      open: 'bg-orange-500',
      in_progress: 'bg-blue-500',
      resolved: 'bg-emerald-500',
      closed: 'bg-muted-foreground/40',
    };
    return colors[status] || 'bg-muted-foreground/40';
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      open: 'Ouvert',
      in_progress: 'En cours',
      resolved: 'Résolu',
      closed: 'Fermé',
    };
    return labels[status] || status;
  };

  // FAQ items
  const faqItems = [
    { question: t('faq.cancel_trip'), answer: t('faq.cancel_trip_answer') },
    { question: t('faq.payment'), answer: t('faq.payment_answer') },
    { question: t('faq.lost_item'), answer: t('faq.lost_item_answer') },
    { question: t('faq.become_driver'), answer: t('faq.become_driver_answer') },
    { question: t('faq.data_security'), answer: t('faq.data_security_answer') },
  ];

  // Ticket conversation view
  if (selectedTicket) {
    return (
      <div className="space-y-4 p-4">
        {/* Conversation header */}
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9 rounded-xl"
            onClick={() => setSelectedTicket(null)}
          >
            <X className="h-4 w-4" />
          </Button>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-sm truncate">{selectedTicket.subject}</h3>
            <div className="flex items-center gap-2 mt-0.5">
              <span className={`h-2 w-2 rounded-full ${getStatusDot(selectedTicket.status)}`} />
              <span className="text-xs text-muted-foreground">{getStatusLabel(selectedTicket.status)}</span>
              <span className="text-xs text-muted-foreground">· {selectedTicket.ticket_number}</span>
            </div>
          </div>
        </div>

        {/* Original message */}
        <div className="bg-muted/30 rounded-2xl p-4">
          <p className="text-sm text-muted-foreground">{selectedTicket.description}</p>
        </div>

        {/* Messages */}
        <div className="space-y-3 min-h-[200px]">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.sender_type === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`max-w-[80%] px-4 py-2.5 rounded-2xl ${
                message.sender_type === 'user'
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted/50'
              }`}>
                <p className="text-sm">{message.message}</p>
                <span className="text-[10px] opacity-60 mt-1 block">
                  {new Date(message.created_at).toLocaleString()}
                </span>
              </div>
            </div>
          ))}
          {messages.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <MessageCircle className="h-6 w-6 mx-auto mb-2 opacity-30" />
              <p className="text-xs">Aucun message pour l'instant</p>
            </div>
          )}
        </div>

        {/* Input */}
        {selectedTicket.status !== 'closed' && (
          <div className="flex items-center gap-2 bg-muted/30 rounded-2xl p-1.5 pl-4">
            <input
              type="text"
              placeholder="Votre message..."
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
              className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground/50"
            />
            <Button
              size="icon"
              className="h-9 w-9 rounded-xl shrink-0"
              onClick={handleSendMessage}
              disabled={!newMessage.trim()}
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Contact rapide — chips horizontaux */}
      <div className="flex flex-wrap gap-2">
        <a href={`tel:${t('support.contact_phone')}`} className="inline-flex">
          <Button variant="outline" size="sm" className="rounded-xl gap-2 h-9 text-xs">
            <Phone className="h-3.5 w-3.5" />
            {t('support.contact_phone')}
          </Button>
        </a>
        <a href={`mailto:${t('support.contact_email')}`} className="inline-flex">
          <Button variant="outline" size="sm" className="rounded-xl gap-2 h-9 text-xs">
            <Mail className="h-3.5 w-3.5" />
            {t('support.contact_email')}
          </Button>
        </a>
        <Button size="sm" className="rounded-xl gap-2 h-9 text-xs" disabled>
          <MessageCircle className="h-3.5 w-3.5" />
          Chat en direct
          <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4 ml-1">Bientôt</Badge>
        </Button>
      </div>

      {/* Formulaire ticket — compact, sans Card wrapper */}
      <section className="space-y-3">
        <h2 className="text-sm font-semibold flex items-center gap-2">
          <Ticket className="h-4 w-4 text-muted-foreground" />
          {t('support.create_ticket')}
        </h2>

        <div className="flex gap-2">
          <Select value={category} onValueChange={setCategory}>
            <SelectTrigger className="flex-1 bg-muted/30 border-border/40 rounded-xl h-10 text-sm">
              <SelectValue placeholder={t('support.select_category')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="transport">{t('support.category_transport')}</SelectItem>
              <SelectItem value="paiement">{t('support.category_payment')}</SelectItem>
              <SelectItem value="compte">{t('support.category_account')}</SelectItem>
              <SelectItem value="livraison">{t('support.category_delivery')}</SelectItem>
              <SelectItem value="marketplace">{t('support.category_marketplace')}</SelectItem>
              <SelectItem value="technique">{t('support.category_technical')}</SelectItem>
              <SelectItem value="autre">{t('support.category_other')}</SelectItem>
            </SelectContent>
          </Select>
          <Select value={priority} onValueChange={setPriority}>
            <SelectTrigger className="w-28 bg-muted/30 border-border/40 rounded-xl h-10 text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="low">{t('support.priority_low')}</SelectItem>
              <SelectItem value="medium">{t('support.priority_medium')}</SelectItem>
              <SelectItem value="high">{t('support.priority_high')}</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Input
          placeholder={t('support.subject_placeholder')}
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          className="bg-muted/30 border-border/40 rounded-xl h-10"
        />

        <Textarea
          placeholder={t('support.description_placeholder')}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
          className="bg-muted/30 border-border/40 rounded-xl resize-none"
        />

        <Button
          onClick={handleSubmitTicket}
          disabled={isSubmitting || !user}
          className="w-full h-12 rounded-2xl font-semibold"
        >
          <Send className="h-4 w-4 mr-2" />
          {isSubmitting ? t('support.sending') : t('support.send_ticket')}
        </Button>
      </section>

      {/* Mes Tickets — liste compacte */}
      <section className="space-y-3">
        <h2 className="text-sm font-semibold flex items-center gap-2">
          <Ticket className="h-4 w-4 text-muted-foreground" />
          Mes Tickets
          {tickets.length > 0 && (
            <span className="text-xs text-muted-foreground font-normal">({tickets.length})</span>
          )}
        </h2>

        {isLoadingTickets ? (
          <div className="flex items-center justify-center py-6">
            <div className="animate-spin rounded-full h-5 w-5 border-2 border-primary border-t-transparent" />
          </div>
        ) : tickets.length === 0 ? (
          <div className="text-center py-6 text-muted-foreground">
            <Ticket className="h-6 w-6 mx-auto mb-1.5 opacity-30" />
            <p className="text-xs">Aucun ticket</p>
          </div>
        ) : (
          <div className="divide-y divide-border/20">
            {tickets.map((ticket) => (
              <button
                key={ticket.id}
                className="w-full text-left py-3 px-1 flex items-center gap-3 hover:bg-muted/20 transition-colors rounded-lg"
                onClick={() => setSelectedTicket(ticket)}
              >
                <span className={`h-2.5 w-2.5 rounded-full shrink-0 ${getStatusDot(ticket.status)}`} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{ticket.subject}</p>
                  <p className="text-[11px] text-muted-foreground">
                    {ticket.ticket_number} · {new Date(ticket.created_at).toLocaleDateString()}
                  </p>
                </div>
                <span className="text-[11px] text-muted-foreground shrink-0">
                  {getStatusLabel(ticket.status)}
                </span>
              </button>
            ))}
          </div>
        )}
      </section>

      {/* FAQ — accordion direct */}
      <section className="space-y-3">
        <h2 className="text-sm font-semibold">Questions fréquentes</h2>
        <Accordion type="single" collapsible className="space-y-1">
          {faqItems.map((item, index) => (
            <AccordionItem
              key={index}
              value={`faq-${index}`}
              className="border-none"
            >
              <AccordionTrigger className="text-left text-sm font-normal py-2.5 px-3 rounded-xl hover:bg-muted/30 hover:no-underline [&[data-state=open]]:bg-muted/20">
                <span className="flex items-center gap-2.5">
                  <HelpCircle className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                  {item.question}
                </span>
              </AccordionTrigger>
              <AccordionContent className="text-sm text-muted-foreground px-3 pb-3 pt-0 pl-9">
                {item.answer}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </section>
    </div>
  );
};

export default CustomerSupport;
