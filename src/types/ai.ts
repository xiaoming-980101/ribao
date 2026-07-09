export interface RouteInfo {
  requestedModel?: string;
  actualModel?: string;
  providerName?: string;
  retryAfterSeconds?: number;
  isAutoRoute?: boolean;
  status?: 'success' | 'error';
  statusCode?: number;
  errorType?: 'rate_limit' | 'no_access' | 'invalid_model' | 'safety' | 'empty' | 'unknown';
}

export interface CompareResult {
  id: string;
  requestedModel: string;
  title?: string;
  content?: string;
  routeInfo?: RouteInfo;
  error?: string;
}
