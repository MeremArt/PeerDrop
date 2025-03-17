export interface AuthRequest extends Request {
  user: {
    userId: string;
    [key: string]: any;
  };
}
