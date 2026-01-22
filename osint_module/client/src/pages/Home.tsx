import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getLoginUrl } from "@/const";
import { trpc } from "@/lib/trpc";
import { Search, Loader2, AlertCircle, CheckCircle2, Clock, Database } from "lucide-react";
import { Link } from "wouter";
import { useState } from "react";
import { toast } from "sonner";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";


export default function Home() {
  const { user, loading, isAuthenticated } = useAuth();
  const [formData, setFormData] = useState({
    matricula: "",
    cidade: "",
    estado: "",
    orgao: "",
    cargo: "",
  });

  const searchMutation = trpc.osint.search.useMutation({
    onSuccess: (data) => {
      if (data.resultCount === 0) {
        toast.info("Nenhum resultado encontrado", {
          description: "Nenhum registro exato encontrado para os parâmetros informados. Verifique se os dados estão corretos.",
        });
      } else {
        toast.success(`${data.resultCount} resultado(s) encontrado(s)`, {
          description: data.fromCache ? "Resultados recuperados do cache" : "Busca realizada com sucesso",
        });
      }
    },
    onError: (error) => {
      toast.error("Erro na busca", {
        description: error.message,
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validação básica
    if (!formData.matricula.trim()) {
      toast.error("Matrícula é obrigatória");
      return;
    }
    if (!formData.cidade.trim()) {
      toast.error("Cidade é obrigatória");
      return;
    }
    if (!formData.estado.trim()) {
      toast.error("Estado é obrigatório");
      return;
    }

    searchMutation.mutate(formData);
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Card className="w-full max-w-md mx-4">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
              <Search className="h-8 w-8 text-primary" />
            </div>
            <CardTitle className="text-2xl">AVADA OSINT Servidor</CardTitle>
            <CardDescription>
              Plataforma de busca avançada para consultar matrículas de servidores públicos em fontes brasileiras
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild className="w-full" size="lg">
              <a href={getLoginUrl()}>Entrar para Começar</a>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="container py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                <Search className="h-5 w-5" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-foreground">AVADA OSINT Servidor</h1>
                <p className="text-sm text-muted-foreground">Busca Precisa de Matrículas</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="sm" asChild>
                <Link href="/history">Histórico</Link>
              </Button>
              {user?.role === 'admin' && (
                <Button variant="ghost" size="sm" asChild>
                  <Link href="/statistics">Estatísticas</Link>
                </Button>
              )}
              <span className="text-sm text-muted-foreground">{user?.name || user?.email}</span>
              <Button variant="outline" size="sm" onClick={() => trpc.auth.logout.useMutation().mutate()}>
                Sair
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="container py-8">
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Formulário de Busca */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Formulário de Busca</CardTitle>
                <CardDescription>
                  Preencha os campos obrigatórios para realizar uma busca precisa. A matrícula deve conter apenas letras, números e separadores (-, ., /)
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                  {/* Campos Obrigatórios */}
                  <div className="grid gap-4 md:grid-cols-3">
                    <div className="space-y-2">
                      <Label htmlFor="matricula">
                        Matrícula <span className="text-destructive">*</span>
                      </Label>
                      <Input
                        id="matricula"
                        placeholder="Ex: 12345"
                        value={formData.matricula}
                        onChange={(e) => handleInputChange("matricula", e.target.value)}
                        pattern="^[a-zA-Z0-9\-\.\/]+$"
                        title="Apenas letras, números e separadores (-, ., /)"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="cidade">
                        Cidade <span className="text-destructive">*</span>
                      </Label>
                      <Input
                        id="cidade"
                        placeholder="Ex: São Paulo"
                        value={formData.cidade}
                        onChange={(e) => handleInputChange("cidade", e.target.value)}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="estado">
                        Estado (UF) <span className="text-destructive">*</span>
                      </Label>
                      <Input
                        id="estado"
                        placeholder="Ex: SP"
                        value={formData.estado}
                        onChange={(e) => handleInputChange("estado", e.target.value.toUpperCase())}
                        maxLength={2}
                        pattern="[A-Z]{2}"
                        title="Sigla de 2 letras (ex: SP, RJ, MG)"
                        required
                      />
                    </div>
                  </div>

                  {/* Campos Opcionais */}
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="orgao">Órgão (Opcional)</Label>
                      <Input
                        id="orgao"
                        placeholder="Ex: Secretaria de Saúde"
                        value={formData.orgao}
                        onChange={(e) => handleInputChange("orgao", e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="cargo">Cargo (Opcional)</Label>
                      <Input
                        id="cargo"
                        placeholder="Ex: Médico"
                        value={formData.cargo}
                        onChange={(e) => handleInputChange("cargo", e.target.value)}
                      />
                    </div>
                  </div>

                  <Button type="submit" className="w-full" size="lg" disabled={searchMutation.isPending}>
                    {searchMutation.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Buscando...
                      </>
                    ) : (
                      <>
                        <Search className="mr-2 h-4 w-4" />
                        Buscar
                      </>
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>

            {/* Resultados */}
            {searchMutation.data && (
              <Card className="mt-6">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>Resultados da Busca</CardTitle>
                    <div className="flex items-center gap-2">
                      {searchMutation.data.fromCache && (
                        <Badge variant="secondary">
                          <Database className="mr-1 h-3 w-3" />
                          Cache
                        </Badge>
                      )}
                      <Badge variant="outline">
                        <Clock className="mr-1 h-3 w-3" />
                        {searchMutation.data.responseTime}ms
                      </Badge>
                    </div>
                  </div>
                  <CardDescription>
                    Query: <code className="text-xs bg-muted px-2 py-1 rounded">{searchMutation.data.queryString}</code>
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {searchMutation.data.results.length === 0 ? (
                    <Alert>
                      <AlertCircle className="h-4 w-4" />
                      <AlertTitle>Nenhum resultado encontrado</AlertTitle>
                      <AlertDescription>
                        Nenhum registro exato encontrado para a matrícula {formData.matricula} na cidade de {formData.cidade}/{formData.estado}.
                        Verifique se o número está correto ou tente variações no nome da cidade.
                      </AlertDescription>
                    </Alert>
                  ) : (
                    <div className="space-y-4">
                      {searchMutation.data.results.map((result: any, index: number) => (
                        <Card key={index} className="border-l-4 border-l-primary">
                          <CardContent className="pt-6">
                            <div className="flex items-start justify-between gap-4">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-2">
                                  <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
                                    {index + 1}
                                  </span>
                                  <a
                                    href={result.link}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="font-semibold text-primary hover:underline"
                                  >
                                    {result.title}
                                  </a>
                                </div>
                                <p className="text-sm text-muted-foreground mb-3">{result.snippet}</p>
                                <a
                                  href={result.link}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-xs text-muted-foreground hover:text-primary break-all"
                                >
                                  {result.link}
                                </a>
                              </div>
                            </div>
                            <div className="mt-4 pt-4 border-t">
                              <div className="grid grid-cols-3 gap-2 text-xs">
                                <div className="flex items-center gap-1">
                                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                                  <span className="text-muted-foreground">Matrícula: {formData.matricula}</span>
                                </div>
                                <div className="flex items-center gap-1">
                                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                                  <span className="text-muted-foreground">Cidade: {formData.cidade}</span>
                                </div>
                                <div className="flex items-center gap-1">
                                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                                  <span className="text-muted-foreground">Estado: {formData.estado}</span>
                                </div>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar com Informações */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Como Funciona</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm text-muted-foreground">
                <div className="flex gap-3">
                  <CheckCircle2 className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium text-foreground">Busca Exata</p>
                    <p>Utiliza múltiplas variações de matrícula com operadores booleanos para precisão cirúrgica</p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <CheckCircle2 className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium text-foreground">Contexto Geográfico</p>
                    <p>Filtra resultados rigorosamente pela cidade e estado informados</p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <CheckCircle2 className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium text-foreground">Cache Inteligente</p>
                    <p>Resultados são armazenados por 24 horas para respostas instantâneas</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Validação de Matrícula</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm text-muted-foreground">
                <p className="font-medium text-foreground">A matrícula deve conter apenas:</p>
                <ul className="list-disc list-inside space-y-1">
                  <li>Letras (a-z, A-Z)</li>
                  <li>Números (0-9)</li>
                  <li>Separadores: hífen (-), ponto (.), barra (/)</li>
                </ul>
                <p className="text-xs mt-3">Exemplos válidos: 12345, 123.456-7, 2023/001</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
