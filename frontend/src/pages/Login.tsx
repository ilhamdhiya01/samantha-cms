import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useNavigate, Navigate } from "react-router-dom";
import { login } from "@/api/auth";
import { useAuth } from "@/store/auth";

const schema = z.object({
  email: z.string().email("Email tidak valid").min(1, "Email wajib diisi"),
  password: z.string().min(8, "Password minimal 8 karakter"),
});

type FormValues = z.infer<typeof schema>;

export function Login() {
  const nav = useNavigate();
  const setSession = useAuth((s) => s.setSession);
  const isAuthed = useAuth((s) => !!s.token);
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      email: "admin@samantha.local",
      password: "",
    },
  });

  if (isAuthed) return <Navigate to="/" replace />;

  async function onSubmit(values: FormValues) {
    try {
      const result = await login(values.email, values.password);
      setSession(result.token, result.admin);
      nav("/", { replace: true });
    } catch (err) {
      setError("root", {
        type: "manual",
        message: (err as Error).message || "Login gagal",
      });
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-100 p-4">
      <form
        onSubmit={handleSubmit(onSubmit)}
        className="w-full max-w-sm bg-white shadow rounded-lg p-6 space-y-4"
      >
        <h1 className="text-xl font-semibold">Samantha CMS</h1>
        <div>
          <label
            className="block text-sm font-medium text-slate-700"
            htmlFor="email"
          >
            Email
          </label>
          <input
            id="email"
            type="email"
            autoComplete="username"
            {...register("email")}
            className="mt-1 w-full rounded border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
          {errors.email && (
            <p className="text-xs text-rose-600 mt-1">{errors.email.message}</p>
          )}
        </div>
        <div>
          <label
            className="block text-sm font-medium text-slate-700"
            htmlFor="password"
          >
            Password
          </label>
          <input
            id="password"
            type="password"
            autoComplete="current-password"
            {...register("password")}
            className="mt-1 w-full rounded border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
          {errors.password && (
            <p className="text-xs text-rose-600 mt-1">
              {errors.password.message}
            </p>
          )}
        </div>
        {errors.root && (
          <p className="text-sm text-rose-600">{errors.root.message}</p>
        )}
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full rounded bg-brand-600 hover:bg-brand-700 disabled:opacity-50 text-white py-2 text-sm font-medium"
        >
          {isSubmitting ? "Memproses…" : "Masuk"}
        </button>
      </form>
    </div>
  );
}
