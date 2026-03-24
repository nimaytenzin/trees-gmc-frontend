export interface Environment {
  apiBaseUrl: string;
  /** Base URL for uploaded files (no trailing slash). */
  uploadsBaseUrl: string;
}

const devEnvironment: Environment = {
  apiBaseUrl: 'http://localhost:3008/api',
  // NestJS ServeStaticModule serves /uploads directly (no /api prefix in dev)
  uploadsBaseUrl: 'http://localhost:3008',
};

const prodEnvironment: Environment = {
  apiBaseUrl: 'https://treesgmc.ddnsfree.com/api',
  // nginx: location /api/uploads/ → proxy_pass :2349/uploads/
  uploadsBaseUrl: 'https://treesgmc.ddnsfree.com/api',
};

export const environment: Environment =
  (typeof window !== 'undefined' && window.location.hostname === 'localhost')
    ? devEnvironment
    : prodEnvironment;

