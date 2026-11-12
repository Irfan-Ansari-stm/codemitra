declare global {
  namespace Express {
    interface Request {
      requestId: string;
      user?: {
        id: string;
        tenantId: string | null;
        role: string;
        email: string;
      };
    }
  }
}

export {};
