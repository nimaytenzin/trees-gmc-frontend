export interface User {
  id: string;
  name: string;
  designation?: string;
  email: string;
  role: 'ADMIN' | 'ENUMERATOR';
}

export interface LoginResponse {
  accessToken: string;
  user: User;
}
