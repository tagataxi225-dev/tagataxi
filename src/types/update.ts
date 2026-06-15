export type UpdateSeverity = 'info' | 'minor' | 'major' | 'critical';

export interface ChangelogItem {
  type?: string;
  icon?: string;
  text: string;
}

export interface UpdateInfo {
  version: string;
  buildDate?: string;
  cacheSize?: string;
  severity?: UpdateSeverity;
  changelog?: (string | ChangelogItem)[];
}

export interface UpdateConfig {
  last_check: string;
  dismissed_at: string | null;
  dismiss_count: number;
  current_version: string;
  skipped_versions: string[];
}
