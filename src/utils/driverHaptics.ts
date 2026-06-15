/**
 * 📳 PHASE 5+8: Retours haptiques avancés pour actions chauffeur
 * Vibrations intensives et patterns reconnaissables
 */

export const driverHaptics = {
  // 💥 NOUVELLE COURSE - Vibration INTENSE et répétée (impossible à rater)
  onNewRide: async () => {
    if ('vibrate' in navigator) {
      // Pattern dramatique: long-court-long-court-très long
      navigator.vibrate([500, 200, 500, 200, 1000]);
    }
  },

  // ✅ Course acceptée - Vibration de succès double
  onRideAccepted: async () => {
    if ('vibrate' in navigator) {
      navigator.vibrate([100, 50, 100]);
    }
  },

  // ❌ Course refusée - Vibration légère
  onRideRejected: () => {
    if ('vibrate' in navigator) {
      navigator.vibrate(50);
    }
  },

  // 🏁 Course terminée - Vibration de réussite progressive
  onRideCompleted: () => {
    if ('vibrate' in navigator) {
      navigator.vibrate([50, 30, 50, 30, 100]);
    }
  },

  // 🔔 Nouvelle notification standard - Vibration forte
  onNewNotification: () => {
    if ('vibrate' in navigator) {
      navigator.vibrate([100, 50, 100]);
    }
  },

  // 🟢 Mise en ligne - Feedback de confirmation double
  onGoOnline: async () => {
    if ('vibrate' in navigator) {
      navigator.vibrate([100, 50, 100]);
    }
  },

  // ⏸️ Mise hors ligne - Feedback simple
  onGoOffline: () => {
    if ('vibrate' in navigator) {
      navigator.vibrate(50);
    }
  },

  // 🧭 Navigation turn - Feedback léger directionnel
  onTurnByTurn: async () => {
    if ('vibrate' in navigator) {
      navigator.vibrate(30);
    }
  },

  // 📍 GPS activé - Feedback tactile court
  onGPSStart: () => {
    if ('vibrate' in navigator) {
      navigator.vibrate(20);
    }
  },

  // ⚠️ Alerte importante - Pattern urgent
  onUrgentAlert: () => {
    if ('vibrate' in navigator) {
      navigator.vibrate([200, 100, 200, 100, 200]);
    }
  }
};
