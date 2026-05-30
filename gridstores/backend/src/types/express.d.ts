declare namespace Express {
  interface Request {
    user?: {
      id: string;
      role: "customer" | "admin";
      email: string;
    };
  }
}
