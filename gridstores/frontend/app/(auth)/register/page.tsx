"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import toast from "react-hot-toast";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { api, ApiResponse } from "@/lib/api";
import { useAuthStore } from "@/store/authStore";
import { User } from "@/types";

const schema = z.object({ name: z.string().min(2), email: z.string().email(), phone: z.string().min(8), password: z.string().min(8) });
type FormValues = z.infer<typeof schema>;

export default function RegisterPage() {
  const router = useRouter();
  const setSession = useAuthStore((state) => state.setSession);
  const { register, handleSubmit, formState: { isSubmitting } } = useForm<FormValues>({ resolver: zodResolver(schema) });
  const onSubmit = async (values: FormValues) => {
    const res = await api.post<ApiResponse<{ user: User; accessToken: string }>>("/auth/register", values);
    if (!res.data.success) return toast.error(res.data.error);
    setSession(res.data.data.user, res.data.data.accessToken);
    router.push("/");
  };
  return <main className="mx-auto flex min-h-screen max-w-md items-center px-4"><form onSubmit={handleSubmit(onSubmit)} className="w-full rounded-lg bg-cream-card p-6 shadow-textile"><Link href="/" className="font-serif text-3xl font-bold text-burgundy">Grid Stores</Link><h1 className="mt-6 font-serif text-2xl font-bold">Create account</h1><div className="mt-4 space-y-3"><Input placeholder="Name" {...register("name")} /><Input placeholder="Email" {...register("email")} /><Input placeholder="Phone" {...register("phone")} /><Input type="password" placeholder="Password" {...register("password")} /></div><Button className="mt-5 w-full" disabled={isSubmitting}>Register</Button><p className="mt-4 text-sm">Already registered? <Link className="font-bold text-burgundy" href="/login">Login</Link></p></form></main>;
}
