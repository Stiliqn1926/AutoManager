declare global {
  namespace Express {
    interface Request {
      user?: {
        userId: string;
        email: string;
        role: string;
        serviceCompanyId?: string;
        workerId?: string;
        clientId?: string;
      };
    }
  }
}

export {};

