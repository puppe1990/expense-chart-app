import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { useAuth } from "@/hooks/use-auth";
import { Eye, EyeOff, ShieldCheck, TrendingUp } from "lucide-react";

const AuthPage = () => {
  const navigate = useNavigate();
  const { signIn, signUp, isAuthenticated, loading: authLoading } = useAuth();
  const [signInEmail, setSignInEmail] = useState("");
  const [signInPassword, setSignInPassword] = useState("");
  const [signUpEmail, setSignUpEmail] = useState("");
  const [signUpPassword, setSignUpPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showSignInPassword, setShowSignInPassword] = useState(false);
  const [showSignUpPassword, setShowSignUpPassword] = useState(false);

  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      navigate("/");
    }
  }, [authLoading, isAuthenticated, navigate]);

  const handleSignIn = async (event: React.FormEvent) => {
    event.preventDefault();
    try {
      setLoading(true);
      await signIn(signInEmail, signInPassword);
      toast.success("Login realizado com sucesso.");
      navigate("/");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Falha no login.");
    } finally {
      setLoading(false);
    }
  };

  const handleSignUp = async (event: React.FormEvent) => {
    event.preventDefault();
    try {
      setLoading(true);
      await signUp(signUpEmail, signUpPassword);
      toast.success("Conta criada com sucesso.");
      navigate("/");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Falha no cadastro.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-slate-950 text-slate-100">
      <div className="absolute -left-20 top-10 h-80 w-80 rounded-full bg-emerald-500/20 blur-3xl" />
      <div className="absolute -right-16 bottom-10 h-72 w-72 rounded-full bg-lime-400/20 blur-3xl" />
      <div className="relative mx-auto flex min-h-screen max-w-6xl items-center px-4 py-8 md:px-8">
        <div className="grid w-full gap-6 lg:grid-cols-[1.1fr_1fr]">
          <section className="hidden rounded-3xl border border-white/10 bg-gradient-to-br from-slate-900/80 via-slate-900/40 to-emerald-950/30 p-10 shadow-2xl backdrop-blur lg:flex lg:flex-col lg:justify-between">
            <div className="space-y-6">
              <img
                src="/pwa-192x192.png"
                alt="Logo Controle Financeiro"
                className="h-16 w-16 rounded-2xl ring-1 ring-white/20"
              />
              <div className="space-y-3">
                <p className="inline-flex rounded-full border border-emerald-300/30 bg-emerald-300/10 px-3 py-1 text-xs font-medium text-emerald-200">
                  Painel financeiro inteligente
                </p>
                <h1 className="text-4xl font-black leading-tight tracking-tight">
                  Controle total das suas finanças em um só lugar.
                </h1>
                <p className="max-w-md text-slate-300">
                  Acompanhe entradas, saídas, investimentos e empréstimos com visão clara e decisões mais rápidas.
                </p>
              </div>
            </div>
            <div className="space-y-4">
              <div className="flex items-center gap-3 rounded-xl border border-white/10 bg-black/20 p-3">
                <ShieldCheck className="h-5 w-5 text-emerald-300" />
                <p className="text-sm text-slate-200">Sessão segura e dados sempre disponíveis</p>
              </div>
              <div className="flex items-center gap-3 rounded-xl border border-white/10 bg-black/20 p-3">
                <TrendingUp className="h-5 w-5 text-lime-300" />
                <p className="text-sm text-slate-200">Métricas e gráficos para decisões melhores</p>
              </div>
            </div>
          </section>

          <section className="flex items-center">
            <Card className="w-full border-white/15 bg-slate-900/75 text-slate-100 shadow-2xl backdrop-blur-md">
              <CardHeader className="space-y-4">
                <div className="flex items-center gap-4">
                  <img
                    src="/pwa-192x192.png"
                    alt="Logo Controle Financeiro"
                    className="h-12 w-12 rounded-xl ring-1 ring-white/20 lg:hidden"
                  />
                  <div className="space-y-1">
                    <CardTitle className="text-2xl font-black tracking-tight">Controle Financeiro</CardTitle>
                    <CardDescription className="text-slate-300">
                      Entre com sua conta ou crie um novo acesso.
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="signin">
                  <TabsList className="grid h-11 w-full grid-cols-2 rounded-xl bg-slate-800/80 p-1">
                    <TabsTrigger value="signin" className="rounded-lg data-[state=active]:bg-slate-100 data-[state=active]:text-slate-900">
                      Entrar
                    </TabsTrigger>
                    <TabsTrigger value="signup" className="rounded-lg data-[state=active]:bg-slate-100 data-[state=active]:text-slate-900">
                      Criar conta
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="signin" className="mt-6">
                    <form onSubmit={handleSignIn} className="space-y-5">
                      <div className="space-y-2">
                        <Label htmlFor="signin-email" className="text-slate-200">Email</Label>
                        <Input
                          id="signin-email"
                          type="email"
                          required
                          value={signInEmail}
                          onChange={(event) => setSignInEmail(event.target.value)}
                          className="h-11 border-slate-700 bg-slate-800/80 text-slate-100 placeholder:text-slate-400 focus-visible:ring-emerald-400"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="signin-password" className="text-slate-200">Senha</Label>
                        <div className="relative">
                          <Input
                            id="signin-password"
                            type={showSignInPassword ? "text" : "password"}
                            required
                            value={signInPassword}
                            onChange={(event) => setSignInPassword(event.target.value)}
                            className="h-11 border-slate-700 bg-slate-800/80 pr-10 text-slate-100 placeholder:text-slate-400 focus-visible:ring-emerald-400"
                          />
                          <button
                            type="button"
                            onClick={() => setShowSignInPassword((prev) => !prev)}
                            className="absolute inset-y-0 right-0 px-3 text-slate-400 transition-colors hover:text-slate-100"
                            aria-label={showSignInPassword ? "Ocultar senha" : "Mostrar senha"}
                          >
                            {showSignInPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </button>
                        </div>
                      </div>
                      <Button
                        type="submit"
                        className="h-11 w-full bg-gradient-to-r from-emerald-500 to-lime-400 font-semibold text-slate-900 hover:from-emerald-400 hover:to-lime-300"
                        disabled={loading}
                      >
                        {loading ? "Entrando..." : "Entrar"}
                      </Button>
                    </form>
                  </TabsContent>

                  <TabsContent value="signup" className="mt-6">
                    <form onSubmit={handleSignUp} className="space-y-5">
                      <div className="space-y-2">
                        <Label htmlFor="signup-email" className="text-slate-200">Email</Label>
                        <Input
                          id="signup-email"
                          type="email"
                          required
                          value={signUpEmail}
                          onChange={(event) => setSignUpEmail(event.target.value)}
                          className="h-11 border-slate-700 bg-slate-800/80 text-slate-100 placeholder:text-slate-400 focus-visible:ring-emerald-400"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="signup-password" className="text-slate-200">Senha</Label>
                        <div className="relative">
                          <Input
                            id="signup-password"
                            type={showSignUpPassword ? "text" : "password"}
                            required
                            minLength={8}
                            value={signUpPassword}
                            onChange={(event) => setSignUpPassword(event.target.value)}
                            className="h-11 border-slate-700 bg-slate-800/80 pr-10 text-slate-100 placeholder:text-slate-400 focus-visible:ring-emerald-400"
                          />
                          <button
                            type="button"
                            onClick={() => setShowSignUpPassword((prev) => !prev)}
                            className="absolute inset-y-0 right-0 px-3 text-slate-400 transition-colors hover:text-slate-100"
                            aria-label={showSignUpPassword ? "Ocultar senha" : "Mostrar senha"}
                          >
                            {showSignUpPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </button>
                        </div>
                        <p className="text-xs text-slate-400">Use pelo menos 8 caracteres.</p>
                      </div>
                      <Button
                        type="submit"
                        className="h-11 w-full bg-gradient-to-r from-emerald-500 to-lime-400 font-semibold text-slate-900 hover:from-emerald-400 hover:to-lime-300"
                        disabled={loading}
                      >
                        {loading ? "Criando..." : "Criar conta"}
                      </Button>
                    </form>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </section>
        </div>
      </div>
    </div>
  );
};

export default AuthPage;
