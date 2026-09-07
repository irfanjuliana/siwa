import { FormEvent, useState } from "react";
import { useNavigate, Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Alert, Button, TextField } from "../components/ui";

export default function Login() {
  const { user, login } = useAuth();
  const navigate = useNavigate();
  const [nip, setNip] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  if (user) return <Navigate to="/" replace />;

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login(nip, password);
      navigate("/", { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login gagal");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen p-4 bg-gradient-to-br from-brand-800 via-brand-700 to-brand-500">
      <div className="w-full max-w-md p-8 bg-white shadow-xl rounded-2xl">
        <div className="flex flex-col items-center mb-6 text-center">
          <img
            src="/logo.jpeg"
            alt="SIWA"
            className="object-cover w-20 h-20 mb-3 rounded-full shadow"
          />
          <h1 className="text-2xl font-extrabold text-slate-800">SIWA</h1>
          <p className="text-sm text-slate-500">Sistem Informasi Wali Asrama</p>
        </div>

        {error && (
          <div className="mb-4">
            <Alert type="error">{error}</Alert>
          </div>
        )}

        <form onSubmit={onSubmit} className="space-y-4">
          <TextField
            label="NIP"
            placeholder="Masukkan NIP"
            value={nip}
            onChange={(e) => setNip(e.target.value)}
            required
            autoComplete="username"
          />
          <TextField
            label="Password"
            type="password"
            placeholder="Masukkan password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete="current-password"
          />
          <Button type="submit" loading={loading} className="w-full">
            Masuk
          </Button>
        </form>

        <p className="mt-4 text-xs text-center text-slate-400">
          Gunakan NIP dan password Anda untuk masuk
        </p>
      </div>
    </div>
  );
}
