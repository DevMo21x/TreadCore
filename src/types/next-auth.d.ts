import 'next-auth';
import 'next-auth/jwt';
import { DefaultSession } from 'next-auth';

declare module 'next-auth/jwt' {
  interface JWT {
    id?: string;
    username?: string;
    role?: 'user' | 'guest' | 'admin';
  }
}

declare module 'next-auth' {
  interface User {
    id: string;
    username: string;
    role: 'user' | 'guest' | 'admin';
  }

  interface Session {
    user: {
      id: string;
      username: string;
      role: 'user' | 'guest' | 'admin';
    } & DefaultSession['user'];
  }
}
