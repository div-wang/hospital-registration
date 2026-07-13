declare global {
  namespace Express {
    interface Request {
      auth?: { userId: number; phone: string; role: "user" | "merchant_admin" | "merchant_staff" | "super_admin" };
      platform?: "h5" | "miniprogram" | "app";
    }
  }
}

export {};
