export interface RegisterForm {
  name: string;
  email: string;
  password: string;
}

export interface LoginForm {
  email: string;
  password: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
}
