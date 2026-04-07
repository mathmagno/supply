import { useState } from "react";
import api from "@/lib/api";

interface UsuarioLogado {
  id: number;
  nome: string;
  email: string;
}

export function useAuth() {
  const [token, setToken] = useState<string | null>(localStorage.getItem("token"));
  const [usuario, setUsuario] = useState<UsuarioLogado | null>(() => {
    const salvo = localStorage.getItem("usuario");
    return salvo ? JSON.parse(salvo) : null;
  });

  async function login(email: string, senha: string) {
    const form = new URLSearchParams({ username: email, password: senha });
    const { data } = await api.post("/auth/login", form, {
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
    });
    localStorage.setItem("token", data.access_token);
    localStorage.setItem("usuario", JSON.stringify(data.usuario));
    setToken(data.access_token);
    setUsuario(data.usuario);
  }

  function logout() {
    localStorage.removeItem("token");
    localStorage.removeItem("usuario");
    setToken(null);
    setUsuario(null);
    window.location.href = "/login";
  }

  return { token, usuario, login, logout };
}
