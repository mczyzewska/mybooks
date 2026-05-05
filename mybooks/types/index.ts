
export type BookStatus = 'to_read' | 'reading' | 'finished';

export interface Book {
  id: string;
  user_id: string;
  title: string;
  author: string;
  status: BookStatus;
  rating?: number;
  notes?: string;
  date_added: string;
  date_finished?: string;
}

export interface User {
  id: string;
  email: string;
  username: string;
}

export interface PublicReader {
  user_id: string;
  username: string;
  rating?: number;
  date_finished?: string;
}

export interface UserFollow {
  id: string;
  follower_id: string;
  following_id: string;
  created_at: string;
}
