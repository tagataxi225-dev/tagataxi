import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { useToast } from '@/hooks/use-toast'
import { supabase } from '@/integrations/supabase/client'
import { 
  MessageSquare, 
  Clock, 
  CheckCircle, 
  AlertTriangle, 
  Plus, 
  Search, 
  Filter,
  Send,
  Paperclip,
  User,
  Calendar,
  Star,
  Eye,
  TrendingUp,
  Users,
  Timer,
  BarChart3
} from 'lucide-react'

interface SupportTicket {
  id: string
  ticket_number: string
  user_id: string
  category: string
  priority: string
  status: string
  subject: string
  description: string
  assigned_to: string | null
  resolution_notes: string | null
  created_at: string
  updated_at: string
  resolved_at?: string
}

interface SupportMessage {
  id: string
  ticket_id: string
  sender_id: string
  sender_type: string
  message: string
  created_at: string
  attachments?: any
}

interface SupportStats {
  totalTickets: number
  openTickets: number
  inProgressTickets: number
  resolvedTickets: number
  avgResolutionTime: number
  customerSatisfaction: number
  todayTickets: number
  urgentTickets: number
}

export const EnhancedSupportCenter = () => {
  const { toast } = useToast()
  const [tickets, setTickets] = useState<SupportTicket[]>([])
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null)
  const [messages, setMessages] = useState<SupportMessage[]>([])
  const [loading, setLoading] = useState(false)
  const [newMessage, setNewMessage] = useState('')
  const [activeTab, setActiveTab] = useState('dashboard')
  const [filters, setFilters] = useState({
    status: 'all',
    priority: 'all',
    category: 'all',
    search: '',
    assignedTo: 'all'
  })

  const [stats, setStats] = useState<SupportStats>({
    totalTickets: 0,
    openTickets: 0,
    inProgressTickets: 0,
    resolvedTickets: 0,
    avgResolutionTime: 0,
    customerSatisfaction: 4.2,
    todayTickets: 0,
    urgentTickets: 0
  })

  const [newTicket, setNewTicket] = useState({
    subject: '',
    description: '',
    category: 'general',
    priority: 'medium',
    userEmail: ''
  })

  // Charger les données
  const fetchData = async () => {
    setLoading(true)
    try {
      await Promise.all([
        fetchTickets(),
        fetchStats()
      ])
    } catch (error) {
      console.error('Error fetching data:', error)
      toast({
        title: "Erreur",
        description: "Impossible de charger les données",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const fetchTickets = async () => {
    try {
      let query = supabase
        .from('enhanced_support_tickets')
        .select('*')
        .order('created_at', { ascending: false })

      // Appliquer les filtres
      if (filters.status !== 'all') {
        query = query.eq('status', filters.status)
      }
      if (filters.priority !== 'all') {
        query = query.eq('priority', filters.priority)
      }
      if (filters.category !== 'all') {
        query = query.eq('category', filters.category)
      }
      if (filters.search) {
        query = query.or(`subject.ilike.%${filters.search}%,description.ilike.%${filters.search}%`)
      }

      const { data, error } = await query

      if (error) throw error
      setTickets(data || [])
    } catch (error) {
      console.error('Error fetching tickets:', error)
    }
  }

  const fetchStats = async () => {
    try {
      const { data: ticketData, error } = await supabase
        .from('enhanced_support_tickets')
        .select('status, priority, created_at, resolved_at')

      if (error) throw error

      const tickets = ticketData || []
      const today = new Date().toDateString()
      
      const newStats: SupportStats = {
        totalTickets: tickets.length,
        openTickets: tickets.filter(t => t.status === 'open').length,
        inProgressTickets: tickets.filter(t => t.status === 'in_progress').length,
        resolvedTickets: tickets.filter(t => t.status === 'resolved').length,
        todayTickets: tickets.filter(t => new Date(t.created_at).toDateString() === today).length,
        urgentTickets: tickets.filter(t => t.priority === 'urgent').length,
        avgResolutionTime: 2.5, // À calculer réellement
        customerSatisfaction: 4.2
      }

      setStats(newStats)
    } catch (error) {
      console.error('Error fetching stats:', error)
    }
  }

  const fetchMessages = async (ticketId: string) => {
    try {
      const { data, error } = await supabase
        .from('support_messages')
        .select('*')
        .eq('ticket_id', ticketId)
        .order('created_at', { ascending: true })

      if (error) throw error
      setMessages(data || [])
    } catch (error) {
      console.error('Error fetching messages:', error)
    }
  }

  const createTicket = async () => {
    if (!newTicket.subject || !newTicket.description) {
      toast({
        title: "Erreur",
        description: "Veuillez remplir tous les champs obligatoires",
        variant: "destructive"
      })
      return
    }

    try {
      // Générer le numéro de ticket
      const { data: ticketNumber } = await supabase.rpc('generate_ticket_number')

      const { data, error } = await supabase
        .from('enhanced_support_tickets')
        .insert({
          ticket_number: ticketNumber,
          user_id: 'admin-created',
          category: newTicket.category,
          priority: newTicket.priority,
          subject: newTicket.subject,
          description: newTicket.description,
          status: 'open'
        })
        .select()
        .single()

      if (error) throw error

      toast({
        title: "Ticket créé",
        description: `Ticket ${ticketNumber} créé avec succès`,
      })

      setNewTicket({
        subject: '',
        description: '',
        category: 'general',
        priority: 'medium',
        userEmail: ''
      })

      fetchData()
    } catch (error) {
      console.error('Error creating ticket:', error)
      toast({
        title: "Erreur",
        description: "Impossible de créer le ticket",
        variant: "destructive"
      })
    }
  }

  const updateTicketStatus = async (ticketId: string, status: string) => {
    try {
      const updateData: any = { status }
      if (status === 'resolved') {
        updateData.resolved_at = new Date().toISOString()
      }

      const { error } = await supabase
        .from('enhanced_support_tickets')
        .update(updateData)
        .eq('id', ticketId)

      if (error) throw error

      toast({
        title: "Statut mis à jour",
        description: `Ticket marqué comme ${getStatusLabel(status)}`,
      })

      fetchData()
      if (selectedTicket && selectedTicket.id === ticketId) {
        setSelectedTicket({ ...selectedTicket, status })
      }
    } catch (error) {
      console.error('Error updating ticket status:', error)
      toast({
        title: "Erreur",
        description: "Impossible de mettre à jour le statut",
        variant: "destructive"
      })
    }
  }

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedTicket) return

    try {
      const { error } = await supabase
        .from('support_messages')
        .insert({
          ticket_id: selectedTicket.id,
          sender_id: 'admin',
          sender_type: 'admin',
          message: newMessage.trim()
        })

      if (error) throw error

      setNewMessage('')
      fetchMessages(selectedTicket.id)

      toast({
        title: "Message envoyé",
        description: "Votre réponse a été envoyée",
      })
    } catch (error) {
      console.error('Error sending message:', error)
      toast({
        title: "Erreur",
        description: "Impossible d'envoyer le message",
        variant: "destructive"
      })
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'open':
        return <AlertTriangle className="w-4 h-4 text-red-600" />
      case 'in_progress':
        return <Clock className="w-4 h-4 text-yellow-600" />
      case 'resolved':
        return <CheckCircle className="w-4 h-4 text-green-600" />
      case 'closed':
        return <CheckCircle className="w-4 h-4 text-gray-600" />
      default:
        return <AlertTriangle className="w-4 h-4 text-gray-600" />
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return 'destructive'
      case 'high':
        return 'destructive'
      case 'medium':
        return 'secondary'
      case 'low':
        return 'outline'
      default:
        return 'outline'
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'open': return 'Ouvert'
      case 'in_progress': return 'En cours'
      case 'resolved': return 'Résolu'
      case 'closed': return 'Fermé'
      default: return status
    }
  }

  const getPriorityLabel = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'Urgent'
      case 'high': return 'Élevée'
      case 'medium': return 'Moyenne'
      case 'low': return 'Faible'
      default: return priority
    }
  }

  useEffect(() => {
    fetchData()
  }, [filters])

  useEffect(() => {
    if (selectedTicket) {
      fetchMessages(selectedTicket.id)
    }
  }, [selectedTicket])

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Centre de Support Avancé</h1>
          <p className="text-muted-foreground">
            Gestion complète des tickets et support client
          </p>
        </div>
        <Dialog>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="w-4 h-4" />
              Nouveau Ticket
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Créer un Nouveau Ticket</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="subject">Sujet *</Label>
                <Input
                  id="subject"
                  value={newTicket.subject}
                  onChange={(e) => setNewTicket(prev => ({ ...prev, subject: e.target.value }))}
                  placeholder="Résumé du problème"
                />
              </div>
              <div>
                <Label htmlFor="userEmail">Email utilisateur</Label>
                <Input
                  id="userEmail"
                  value={newTicket.userEmail}
                  onChange={(e) => setNewTicket(prev => ({ ...prev, userEmail: e.target.value }))}
                  placeholder="email@exemple.com"
                />
              </div>
              <div>
                <Label htmlFor="category">Catégorie</Label>
                <Select 
                  value={newTicket.category}
                  onValueChange={(value) => setNewTicket(prev => ({ ...prev, category: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="technical">Technique</SelectItem>
                    <SelectItem value="billing">Facturation</SelectItem>
                    <SelectItem value="account">Compte</SelectItem>
                    <SelectItem value="general">Général</SelectItem>
                    <SelectItem value="feature">Demande de fonctionnalité</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="priority">Priorité</Label>
                <Select 
                  value={newTicket.priority}
                  onValueChange={(value) => setNewTicket(prev => ({ ...prev, priority: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Faible</SelectItem>
                    <SelectItem value="medium">Moyenne</SelectItem>
                    <SelectItem value="high">Élevée</SelectItem>
                    <SelectItem value="urgent">Urgent</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="description">Description *</Label>
                <Textarea
                  id="description"
                  value={newTicket.description}
                  onChange={(e) => setNewTicket(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Description détaillée du problème"
                  rows={4}
                />
              </div>
              <Button onClick={createTicket} className="w-full">
                Créer le Ticket
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
          <TabsTrigger value="tickets">Tickets ({tickets.length})</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="settings">Paramètres</TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard" className="space-y-6">
          {/* Statistiques */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Total Tickets</p>
                    <p className="text-2xl font-bold">{stats.totalTickets}</p>
                  </div>
                  <MessageSquare className="h-8 w-8 text-blue-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Ouverts</p>
                    <p className="text-2xl font-bold text-red-600">{stats.openTickets}</p>
                  </div>
                  <AlertTriangle className="h-8 w-8 text-red-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">En Cours</p>
                    <p className="text-2xl font-bold text-yellow-600">{stats.inProgressTickets}</p>
                  </div>
                  <Clock className="h-8 w-8 text-yellow-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Résolus</p>
                    <p className="text-2xl font-bold text-green-600">{stats.resolvedTickets}</p>
                  </div>
                  <CheckCircle className="h-8 w-8 text-green-600" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Métriques additionnelles */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Aujourd'hui</p>
                    <p className="text-2xl font-bold">{stats.todayTickets}</p>
                  </div>
                  <Calendar className="h-8 w-8 text-purple-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Urgents</p>
                    <p className="text-2xl font-bold text-orange-600">{stats.urgentTickets}</p>
                  </div>
                  <AlertTriangle className="h-8 w-8 text-orange-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Temps Résolution</p>
                    <p className="text-2xl font-bold">{stats.avgResolutionTime}h</p>
                  </div>
                  <Timer className="h-8 w-8 text-indigo-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Satisfaction</p>
                    <p className="text-2xl font-bold">{stats.customerSatisfaction}/5</p>
                  </div>
                  <Star className="h-8 w-8 text-yellow-500" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Tickets récents */}
          <Card>
            <CardHeader>
              <CardTitle>Tickets Récents</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {tickets.slice(0, 5).map((ticket) => (
                  <div key={ticket.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      {getStatusIcon(ticket.status)}
                      <div>
                        <p className="font-medium">{ticket.subject}</p>
                        <p className="text-sm text-muted-foreground">#{ticket.ticket_number}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={getPriorityColor(ticket.priority)}>
                        {getPriorityLabel(ticket.priority)}
                      </Badge>
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => {
                          setSelectedTicket(ticket)
                          setActiveTab('tickets')
                        }}
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="tickets" className="space-y-4">
          {/* Filtres */}
          <Card>
            <CardContent className="p-6">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Rechercher des tickets..."
                      value={filters.search}
                      onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                      className="pl-9"
                    />
                  </div>
                </div>
                <Select
                  value={filters.status}
                  onValueChange={(value) => setFilters(prev => ({ ...prev, status: value }))}
                >
                  <SelectTrigger className="w-[150px]">
                    <SelectValue placeholder="Statut" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tous</SelectItem>
                    <SelectItem value="open">Ouverts</SelectItem>
                    <SelectItem value="in_progress">En cours</SelectItem>
                    <SelectItem value="resolved">Résolus</SelectItem>
                    <SelectItem value="closed">Fermés</SelectItem>
                  </SelectContent>
                </Select>
                <Select
                  value={filters.priority}
                  onValueChange={(value) => setFilters(prev => ({ ...prev, priority: value }))}
                >
                  <SelectTrigger className="w-[150px]">
                    <SelectValue placeholder="Priorité" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Toutes</SelectItem>
                    <SelectItem value="urgent">Urgent</SelectItem>
                    <SelectItem value="high">Élevée</SelectItem>
                    <SelectItem value="medium">Moyenne</SelectItem>
                    <SelectItem value="low">Faible</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Liste des tickets */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Liste */}
            <div className="lg:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle>Tickets de Support ({tickets.length})</CardTitle>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Ticket</TableHead>
                        <TableHead>Sujet</TableHead>
                        <TableHead>Priorité</TableHead>
                        <TableHead>Statut</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {tickets.map((ticket) => (
                        <TableRow 
                          key={ticket.id}
                          className={selectedTicket?.id === ticket.id ? "bg-muted" : ""}
                        >
                          <TableCell className="font-mono text-sm">
                            #{ticket.ticket_number}
                          </TableCell>
                          <TableCell>
                            <div>
                              <div className="font-medium">{ticket.subject}</div>
                              <div className="text-sm text-muted-foreground">{ticket.category}</div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant={getPriorityColor(ticket.priority)}>
                              {getPriorityLabel(ticket.priority)}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              {getStatusIcon(ticket.status)}
                              {getStatusLabel(ticket.status)}
                            </div>
                          </TableCell>
                          <TableCell>
                            {new Date(ticket.created_at).toLocaleDateString('fr-FR')}
                          </TableCell>
                          <TableCell>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setSelectedTicket(ticket)}
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </div>

            {/* Détails du ticket */}
            <div className="lg:col-span-1">
              {selectedTicket ? (
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">#{selectedTicket.ticket_number}</CardTitle>
                      <div className="flex items-center gap-2">
                        {getStatusIcon(selectedTicket.status)}
                        <Badge variant={getPriorityColor(selectedTicket.priority)}>
                          {getPriorityLabel(selectedTicket.priority)}
                        </Badge>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <h4 className="font-medium">{selectedTicket.subject}</h4>
                      <p className="text-sm text-muted-foreground mt-1">
                        {selectedTicket.description}
                      </p>
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Catégorie:</span>
                        <span>{selectedTicket.category}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Créé le:</span>
                        <span>{new Date(selectedTicket.created_at).toLocaleDateString('fr-FR')}</span>
                      </div>
                      {selectedTicket.resolved_at && (
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Résolu le:</span>
                          <span>{new Date(selectedTicket.resolved_at).toLocaleDateString('fr-FR')}</span>
                        </div>
                      )}
                    </div>

                    {/* Actions rapides */}
                    <div className="space-y-2">
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => updateTicketStatus(selectedTicket.id, 'in_progress')}
                          disabled={selectedTicket.status === 'in_progress'}
                        >
                          En cours
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => updateTicketStatus(selectedTicket.id, 'resolved')}
                          disabled={selectedTicket.status === 'resolved'}
                        >
                          Résoudre
                        </Button>
                      </div>
                    </div>

                    {/* Messages */}
                    <div className="space-y-3">
                      <h5 className="font-medium">Messages ({messages.length})</h5>
                      <div className="max-h-64 overflow-y-auto space-y-2">
                        {messages.map((message) => (
                          <div key={message.id} className="p-3 bg-muted rounded-lg">
                            <div className="flex items-center justify-between mb-1">
                              <Badge variant={message.sender_type === 'admin' ? 'default' : 'secondary'}>
                                {message.sender_type === 'admin' ? 'Support' : 'Client'}
                              </Badge>
                              <span className="text-xs text-muted-foreground">
                                {new Date(message.created_at).toLocaleString('fr-FR')}
                              </span>
                            </div>
                            <p className="text-sm">{message.message}</p>
                          </div>
                        ))}
                      </div>

                      {/* Nouveau message */}
                      <div className="space-y-2">
                        <Textarea
                          placeholder="Tapez votre réponse..."
                          value={newMessage}
                          onChange={(e) => setNewMessage(e.target.value)}
                          rows={3}
                        />
                        <Button onClick={sendMessage} disabled={!newMessage.trim()} className="w-full">
                          <Send className="w-4 h-4 mr-2" />
                          Envoyer
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <Card>
                  <CardContent className="flex items-center justify-center py-8">
                    <div className="text-center">
                      <MessageSquare className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                      <p className="text-muted-foreground">Sélectionnez un ticket pour voir les détails</p>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5" />
                Analytics Support
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-medium mb-3">Résolution par Catégorie</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm">Technique</span>
                      <span className="text-sm font-medium">45%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Facturation</span>
                      <span className="text-sm font-medium">25%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Compte</span>
                      <span className="text-sm font-medium">20%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Général</span>
                      <span className="text-sm font-medium">10%</span>
                    </div>
                  </div>
                </div>
                <div>
                  <h4 className="font-medium mb-3">Temps de Réponse Moyen</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm">Première réponse</span>
                      <span className="text-sm font-medium">2.4h</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Résolution</span>
                      <span className="text-sm font-medium">{stats.avgResolutionTime}h</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Satisfaction client</span>
                      <span className="text-sm font-medium">{stats.customerSatisfaction}/5</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Paramètres du Support</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Assignation automatique</Label>
                <p className="text-sm text-muted-foreground">
                  Les nouveaux tickets seront automatiquement assignés selon la charge de travail.
                </p>
              </div>
              <div>
                <Label>Notifications email</Label>
                <p className="text-sm text-muted-foreground">
                  Recevoir des notifications pour les nouveaux tickets urgents.
                </p>
              </div>
              <div>
                <Label>SLA (Service Level Agreement)</Label>
                <p className="text-sm text-muted-foreground">
                  Définir les temps de réponse attendus par priorité.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}