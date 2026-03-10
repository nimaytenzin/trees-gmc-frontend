export interface Environment {
  apiBaseUrl: string;
}

const devEnvironment: Environment = {
  // Backend dev API (no trailing slash)
  apiBaseUrl: 'http://localhost:3000',
};

const prodEnvironment: Environment = {
  // Backend prod API (already includes /api)
  apiBaseUrl: 'https://treesgmc.ddnsfree.com/api',
};

export const environment: Environment =
  (typeof window !== 'undefined' && window.location.hostname === 'localhost')
    ? devEnvironment
    : prodEnvironment;

