import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface PartnerRentalSubscriptionAdmin {
  id: string;
  partner_id: string;
  vehicle_id: string;
  plan_id: string;
  status: string;
  start_date: string;
  end_date: string;
  auto_renew: boolean;
  created_at: string;
  updated_at: string;
}

export const usePartnerRentalSubscriptions = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch all partner rental subscriptions (admin view)
  const { data: subscriptions = [], isLoading } = useQuery({
    queryKey: ['admin-partner-rental-subscriptions'],
    queryFn: async () => {
      // First get basic subscription data
      const { data, error } = await supabase
        .from('partner_rental_subscriptions')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data || [];
    }
  });

  // Get subscription statistics
  const { data: stats } = useQuery({
    queryKey: ['rental-subscription-stats'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('partner_rental_subscriptions')
        .select('status, end_date');
      
      if (error) throw error;

      const activeCount = data.filter(sub => sub.status === 'active').length;
      const totalRevenue = activeCount * 30000; // Simulated revenue for now
      
      const expiringInWeek = data.filter(sub => {
        if (sub.status !== 'active') return false;
        const endDate = new Date(sub.end_date);
        const weekFromNow = new Date();
        weekFromNow.setDate(weekFromNow.getDate() + 7);
        return endDate <= weekFromNow;
      }).length;

      return {
        activeSubscriptions: activeCount,
        monthlyRevenue: totalRevenue,
        expiringInWeek,
        totalSubscriptions: data.length
      };
    }
  });

  // Extend subscription
  const extendSubscription = useMutation({
    mutationFn: async ({ id, days }: { id: string; days: number }) => {
      const { data: current } = await supabase
        .from('partner_rental_subscriptions')
        .select('end_date')
        .eq('id', id)
        .single();

      if (!current) throw new Error('Abonnement non trouvé');

      const currentEndDate = new Date(current.end_date);
      const newEndDate = new Date(currentEndDate);
      newEndDate.setDate(newEndDate.getDate() + days);

      const { data, error } = await supabase
        .from('partner_rental_subscriptions')
        .update({ 
          end_date: newEndDate.toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-partner-rental-subscriptions'] });
      queryClient.invalidateQueries({ queryKey: ['rental-subscription-stats'] });
      toast({
        title: "Abonnement prolongé",
        description: "L'abonnement a été prolongé avec succès",
      });
    },
    onError: () => {
      toast({
        title: "Erreur",
        description: "Impossible de prolonger l'abonnement",
        variant: "destructive",
      });
    }
  });

  // Cancel subscription
  const cancelSubscription = useMutation({
    mutationFn: async (id: string) => {
      const { data, error } = await supabase
        .from('partner_rental_subscriptions')
        .update({ 
          status: 'cancelled',
          auto_renew: false,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-partner-rental-subscriptions'] });
      queryClient.invalidateQueries({ queryKey: ['rental-subscription-stats'] });
      toast({
        title: "Abonnement annulé",
        description: "L'abonnement a été annulé avec succès",
      });
    },
    onError: () => {
      toast({
        title: "Erreur",
        description: "Impossible d'annuler l'abonnement",
        variant: "destructive",
      });
    }
  });

  return {
    subscriptions,
    stats,
    isLoading,
    extendSubscription: extendSubscription.mutate,
    cancelSubscription: cancelSubscription.mutate,
    isExtending: extendSubscription.isPending,
    isCancelling: cancelSubscription.isPending
  };
};