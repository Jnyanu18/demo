"use client";

import Link from "next/link";
import { Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import toast from "react-hot-toast";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { api, ApiResponse } from "@/lib/api";
import { useAuthStore } from "@/store/authStore";
import { useCartStore } from "@/store/cartStore";
import { User } from "@/types";

const schema = z.object({ email: z.string().email(), password: z.string().min(8) });
type FormValues = z.infer<typeof schema>;

export default function LoginPage() {
  return <Suspense fallback={<main className="mx-auto flex min-h-screen max-w-md items-center px-4">Loading...</main>}><LoginContent /></Suspense>;
}

function LoginContent() {
  const router = useRouter();
  const params = useSearchParams();
  const setSession = useAuthStore((state) => state.setSession);
  const items = useCartStore((state) => state.items);
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormValues>({ resolver: zodResolver(schema) });
  const onSubmit = async (values: FormValues) => {
    const res = await api.post<ApiResponse<{ user: User; accessToken: string }>>("/auth/login", values);
    if (!res.data.success) return toast.error(res.data.error);
    setSession(res.data.data.user, res.data.data.accessToken);
    await api.post("/cart/sync", { items: items.map((item) => ({ product: item.product._id, quantity: item.quantity, color: item.color })) });
    router.push(params.get("next") ?? "/");
  };
  return <main className="mx-auto flex min-h-screen max-w-md items-center px-4"><form onSubmit={handleSubmit(onSubmit)} className="w-full rounded-lg bg-cream-card p-6 shadow-textile"><Link href="/" className="font-serif text-3xl font-bold text-burgundy">Grid Stores</Link><h1 className="mt-6 font-serif text-2xl font-bold">Login</h1><div className="mt-4 space-y-3"><Input placeholder="Email" {...register("email")} />{errors.email ? <p className="text-sm text-burgundy">{errors.email.message}</p> : null}<Input type="password" placeholder="Password" {...register("password")} />{errors.password ? <p className="text-sm text-burgundy">{errors.password.message}</p> : null}</div><Button className="mt-5 w-full" disabled={isSubmitting}>Login</Button><p className="mt-4 text-sm">New here? <Link className="font-bold text-burgundy" href="/register">Register</Link></p></form></main>;
}
