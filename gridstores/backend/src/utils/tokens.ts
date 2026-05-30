import jwt from "jsonwebtoken";
import { env } from "../config/env";
import { IUser } from "../models/User";

export const createAccessToken = (user: IUser): string =>
  jwt.sign({ id: user._id.toString(), role: user.role, email: user.email }, env.jwtSecret, { expiresIn: "15m" });

export const createRefreshToken = (user: IUser): string =>
  jwt.sign({ id: user._id.toString(), role: user.role, email: user.email }, env.jwtRefreshSecret, { expiresIn: "7d" });
