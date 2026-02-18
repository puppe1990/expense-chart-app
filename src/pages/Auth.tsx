import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { useAuth } from "@/hooks/use-auth";
import { Eye, EyeOff } from "lucide-react";

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
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Entrar no Controle Financeiro</CardTitle>
          <CardDescription>Use sua conta para acessar seus dados no Turso.</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="signin">
            <TabsList className="grid grid-cols-2 w-full">
              <TabsTrigger value="signin">Sign In</TabsTrigger>
              <TabsTrigger value="signup">Sign Up</TabsTrigger>
            </TabsList>

            <TabsContent value="signin">
              <form onSubmit={handleSignIn} className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label htmlFor="signin-email">Email</Label>
                  <Input
                    id="signin-email"
                    type="email"
                    required
                    value={signInEmail}
                    onChange={(event) => setSignInEmail(event.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signin-password">Senha</Label>
                  <div className="relative">
                    <Input
                      id="signin-password"
                      type={showSignInPassword ? "text" : "password"}
                      required
                      value={signInPassword}
                      onChange={(event) => setSignInPassword(event.target.value)}
                      className="pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowSignInPassword((prev) => !prev)}
                      className="absolute inset-y-0 right-0 px-3 text-muted-foreground hover:text-foreground"
                      aria-label={showSignInPassword ? "Ocultar senha" : "Mostrar senha"}
                    >
                      {showSignInPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? "Entrando..." : "Entrar"}
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="signup">
              <form onSubmit={handleSignUp} className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label htmlFor="signup-email">Email</Label>
                  <Input
                    id="signup-email"
                    type="email"
                    required
                    value={signUpEmail}
                    onChange={(event) => setSignUpEmail(event.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-password">Senha</Label>
                  <div className="relative">
                    <Input
                      id="signup-password"
                      type={showSignUpPassword ? "text" : "password"}
                      required
                      minLength={8}
                      value={signUpPassword}
                      onChange={(event) => setSignUpPassword(event.target.value)}
                      className="pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowSignUpPassword((prev) => !prev)}
                      className="absolute inset-y-0 right-0 px-3 text-muted-foreground hover:text-foreground"
                      aria-label={showSignUpPassword ? "Ocultar senha" : "Mostrar senha"}
                    >
                      {showSignUpPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? "Criando..." : "Criar conta"}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default AuthPage;
