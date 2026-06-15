import { supabase } from '@/integrations/supabase/client';
import { APP_CONFIG } from '@/config/appConfig';
import { getPlatformType, getOS } from '@/services/platformDetection';
import { logger } from '@/utils/logger';

export interface StoreUpdateInfo {
  updateAvailable: boolean;
  isMandatory: boolean;
  releaseNotes: string | null;
  storeUrl: string | null;
  latestVersion: string;
  currentVersion: string;
}

/**
 * Compare two semver strings. Returns true if remote > local.
 */
function isNewerVersion(remote: string, local: string): boolean {
  const r = remote.split('.').map(Number);
  const l = local.split('.').map(Number);
  for (let i = 0; i < 3; i++) {
    const rv = r[i] || 0;
    const lv = l[i] || 0;
    if (rv > lv) return true;
    if (rv < lv) return false;
  }
  return false;
}

async function getCurrentVersion(): Promise<string> {
  const platform = getPlatformType();
  if (platform === 'capacitor') {
    try {
      const { App } = await import('@capacitor/app');
      const info = await App.getInfo();
      return info.version; // e.g. "1.2.0"
    } catch {
      logger.warn('Could not get native app version, falling back to config');
    }
  }
  return APP_CONFIG.version;
}

function getQueryPlatform(): string {
  const platform = getPlatformType();
  if (platform === 'capacitor') {
    const os = getOS();
    return os === 'ios' ? 'ios' : 'android';
  }
  return 'web';
}

export async function checkForUpdate(): Promise<StoreUpdateInfo> {
  const currentVersion = await getCurrentVersion();
  const platform = getQueryPlatform();

  const { data, error } = await supabase
    .from('app_versions' as any)
    .select('*')
    .eq('platform', platform)
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  if (error || !data) {
    logger.info('No app_versions entry found for platform:', platform);
    return {
      updateAvailable: false,
      isMandatory: false,
      releaseNotes: null,
      storeUrl: null,
      latestVersion: currentVersion,
      currentVersion,
    };
  }

  const row = data as any;
  const latestVersion = row.version as string;
  const updateAvailable = isNewerVersion(latestVersion, currentVersion);

  return {
    updateAvailable,
    isMandatory: row.is_mandatory ?? false,
    releaseNotes: row.release_notes ?? null,
    storeUrl: row.store_url ?? null,
    latestVersion,
    currentVersion,
  };
}
