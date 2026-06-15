import { supabase } from '@/integrations/supabase/client';

/**
 * Helper pour envoyer une notification admin via le dispatcher
 */
export const notifyAdmins = async (params: {
  event_type: 'driver_pending' | 'partner_pending' | 'product_reported' | 'marketplace_product_pending' | 
              'food_product_pending' | 'restaurant_pending' | 'vehicle_pending' | 'withdrawal_requested' | 
              'ticket_urgent' | 'order_issue';
  entity_id: string;
  entity_type: string;
  title: string;
  message: string;
  severity?: 'info' | 'warning' | 'error' | 'success';
  metadata?: any;
  priority?: 'low' | 'normal' | 'high' | 'urgent';
}) => {
  try {
    const { data, error } = await supabase.functions.invoke('admin-role-notification-dispatcher', {
      body: params
    });

    if (error) {
      console.error('Error notifying admins:', error);
      return { success: false, error };
    }

    console.log('Admins notified successfully:', data);
    return { success: true, data };
  } catch (error) {
    console.error('Error in notifyAdmins helper:', error);
    return { success: false, error };
  }
};

/**
 * Notifications spécifiques par cas d'usage
 */

export const notifyNewDriverPending = async (driverId: string, driverName: string) => {
  return notifyAdmins({
    event_type: 'driver_pending',
    entity_id: driverId,
    entity_type: 'driver',
    title: '🚗 Nouveau chauffeur en attente',
    message: `${driverName} attend la validation de son compte chauffeur`,
    severity: 'info',
    priority: 'high',
    metadata: { driver_name: driverName }
  });
};

export const notifyNewPartnerPending = async (partnerId: string, companyName: string) => {
  return notifyAdmins({
    event_type: 'partner_pending',
    entity_id: partnerId,
    entity_type: 'partner',
    title: '🤝 Nouvelle demande de partenaire',
    message: `${companyName} a soumis une demande de partenariat`,
    severity: 'info',
    priority: 'high',
    metadata: { company_name: companyName }
  });
};

export const notifyProductReported = async (productId: string, productName: string, reason: string) => {
  return notifyAdmins({
    event_type: 'product_reported',
    entity_id: productId,
    entity_type: 'marketplace_product',
    title: '⚠️ Produit signalé',
    message: `Le produit "${productName}" a été signalé : ${reason}`,
    severity: 'warning',
    priority: 'high',
    metadata: { product_name: productName, report_reason: reason }
  });
};

export const notifyMarketplaceProductPending = async (productId: string, productName: string, vendorName: string) => {
  return notifyAdmins({
    event_type: 'marketplace_product_pending',
    entity_id: productId,
    entity_type: 'marketplace_product',
    title: '🛍️ Nouveau produit marketplace en attente',
    message: `${vendorName} a ajouté "${productName}" en attente de modération`,
    severity: 'info',
    priority: 'normal',
    metadata: { product_name: productName, vendor_name: vendorName }
  });
};

export const notifyFoodProductPending = async (productId: string, productName: string, restaurantName: string) => {
  return notifyAdmins({
    event_type: 'food_product_pending',
    entity_id: productId,
    entity_type: 'food_product',
    title: '🍽️ Nouveau plat en attente',
    message: `${restaurantName} a ajouté "${productName}" en attente de modération`,
    severity: 'info',
    priority: 'normal',
    metadata: { product_name: productName, restaurant_name: restaurantName }
  });
};

export const notifyRestaurantPending = async (restaurantId: string, restaurantName: string) => {
  return notifyAdmins({
    event_type: 'restaurant_pending',
    entity_id: restaurantId,
    entity_type: 'restaurant',
    title: '🍴 Nouveau restaurant en attente',
    message: `${restaurantName} attend la validation de son inscription`,
    severity: 'info',
    priority: 'high',
    metadata: { restaurant_name: restaurantName }
  });
};

export const notifyVehiclePending = async (vehicleId: string, vehicleModel: string, partnerName: string) => {
  return notifyAdmins({
    event_type: 'vehicle_pending',
    entity_id: vehicleId,
    entity_type: 'rental_vehicle',
    title: '🚙 Nouveau véhicule en attente',
    message: `${partnerName} a ajouté un ${vehicleModel} en attente de modération`,
    severity: 'info',
    priority: 'normal',
    metadata: { vehicle_model: vehicleModel, partner_name: partnerName }
  });
};

export const notifyWithdrawalRequested = async (withdrawalId: string, amount: number, userName: string) => {
  return notifyAdmins({
    event_type: 'withdrawal_requested',
    entity_id: withdrawalId,
    entity_type: 'withdrawal',
    title: '💰 Demande de retrait',
    message: `${userName} a demandé un retrait de ${amount} CDF`,
    severity: 'warning',
    priority: 'high',
    metadata: { amount, user_name: userName }
  });
};

export const notifyTicketUrgent = async (ticketId: string, subject: string, userName: string) => {
  return notifyAdmins({
    event_type: 'ticket_urgent',
    entity_id: ticketId,
    entity_type: 'support_ticket',
    title: '🆘 Ticket urgent',
    message: `${userName} a créé un ticket urgent : ${subject}`,
    severity: 'error',
    priority: 'urgent',
    metadata: { subject, user_name: userName }
  });
};

export const notifyOrderIssue = async (orderId: string, issue: string, orderType: string) => {
  return notifyAdmins({
    event_type: 'order_issue',
    entity_id: orderId,
    entity_type: orderType,
    title: '⚠️ Problème de commande',
    message: `Problème signalé sur une commande : ${issue}`,
    severity: 'warning',
    priority: 'high',
    metadata: { issue, order_type: orderType }
  });
};
