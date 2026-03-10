export interface User {
  id: string;
  name: string;
  designation?: string;
  email: string;
  role: 'ADMIN' | 'ENUMERATOR';
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface BulkUploadResult {
  created: number;
  errors: string[];
}

export interface LoginResponse {
  accessToken: string;
  user: User;
}
