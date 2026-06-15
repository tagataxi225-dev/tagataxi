import { logger } from '@/utils/logger';

export const inAppReviewService = {
  async requestReview(): Promise<boolean> {
    try {
      const { Capacitor } = await import(
        /* @vite-ignore */ '@capacitor/core'
      );
      if (!Capacitor.isNativePlatform()) {
        return false;
      }
      const pkg = '@capacitor-community' + '/in-app-review';
      const { InAppReview } = await import(/* @vite-ignore */ pkg);
      await InAppReview.requestReview();
      return true;
    } catch (error) {
      logger.warn('InAppReview not available:', error);
      return false;
    }
  }
};
