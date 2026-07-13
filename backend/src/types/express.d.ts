declare global {
  namespace Express {
    interface Request {
      auth?: { userId: number; mobile: string };
    }
  }
}

export {};
