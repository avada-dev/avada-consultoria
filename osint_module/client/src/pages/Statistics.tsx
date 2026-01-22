import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { ArrowLeft, TrendingUp, CheckCircle2, XCircle, AlertCircle, Database, Clock } from "lucide-react";
import { Link } from "wouter";

export default function Statistics() {
  const { user } = useAuth();
  const { data: stats, isLoading } = trpc.osint.getStatistics.useQuery();

  if (user?.role !== 'admin') {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle>Acesso Negado</CardTitle>
            <CardDescription>
              Apenas administradores podem acessar esta página
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild>
              <Link href="/">Voltar para Busca</Link>
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
              <Button variant="ghost" size="icon" asChild>
                <Link href="/">
                  <ArrowLeft className="h-5 w-5" />
                </Link>
              </Button>
              <div>
                <h1 className="text-xl font-bold text-foreground">Estatísticas da Plataforma</h1>
                <p className="text-sm text-muted-foreground">Métricas de uso e performance</p>
              </div>
            </div>
            <span className="text-sm text-muted-foreground">{user?.name || user?.email}</span>
          </div>
        </div>
      </header>

      <main className="container py-8">
        {isLoading ? (
          <div className="text-center py-8 text-muted-foreground">
            Carregando estatísticas...
          </div>
        ) : stats ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {/* Total de Buscas */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total de Buscas</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalSearches}</div>
                <p className="text-xs text-muted-foreground">
                  Todas as consultas realizadas
                </p>
              </CardContent>
            </Card>

            {/* Buscas Bem-Sucedidas */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Buscas Bem-Sucedidas</CardTitle>
                <CheckCircle2 className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.successfulSearches}</div>
                <p className="text-xs text-muted-foreground">
                  {stats.totalSearches > 0 
                    ? `${Math.round((stats.successfulSearches / stats.totalSearches) * 100)}% do total`
                    : '0% do total'
                  }
                </p>
              </CardContent>
            </Card>

            {/* Buscas com Erro */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Buscas com Erro</CardTitle>
                <XCircle className="h-4 w-4 text-red-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.errorSearches}</div>
                <p className="text-xs text-muted-foreground">
                  {stats.totalSearches > 0 
                    ? `${Math.round((stats.errorSearches / stats.totalSearches) * 100)}% do total`
                    : '0% do total'
                  }
                </p>
              </CardContent>
            </Card>

            {/* Buscas Sem Resultados */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Buscas Sem Resultados</CardTitle>
                <AlertCircle className="h-4 w-4 text-yellow-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.emptySearches}</div>
                <p className="text-xs text-muted-foreground">
                  {stats.totalSearches > 0 
                    ? `${Math.round((stats.emptySearches / stats.totalSearches) * 100)}% do total`
                    : '0% do total'
                  }
                </p>
              </CardContent>
            </Card>

            {/* Taxa de Cache Hit */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Taxa de Cache Hit</CardTitle>
                <Database className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.cacheHitRate}%</div>
                <p className="text-xs text-muted-foreground">
                  {stats.cacheHitRate >= 50 
                    ? 'Excelente performance'
                    : stats.cacheHitRate >= 30
                    ? 'Performance adequada'
                    : 'Considerar otimização'
                  }
                </p>
              </CardContent>
            </Card>

            {/* Tempo Médio de Resposta */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Tempo Médio de Resposta</CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.avgResponseTime}ms</div>
                <p className="text-xs text-muted-foreground">
                  {stats.avgResponseTime < 1000 
                    ? 'Excelente latência'
                    : stats.avgResponseTime < 3000
                    ? 'Latência aceitável'
                    : 'Considerar otimização'
                  }
                </p>
              </CardContent>
            </Card>
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            Nenhuma estatística disponível
          </div>
        )}

        {/* Informações Adicionais */}
        {stats && (
          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Análise de Performance</CardTitle>
              <CardDescription>
                Recomendações baseadas nas métricas atuais
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {stats.cacheHitRate < 30 && (
                <div className="flex gap-3 p-4 bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200 dark:border-yellow-900 rounded-lg">
                  <AlertCircle className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium text-foreground">Taxa de cache baixa</p>
                    <p className="text-sm text-muted-foreground">
                      Considere verificar se o Redis está configurado corretamente ou aumentar o TTL do cache.
                    </p>
                  </div>
                </div>
              )}

              {stats.errorSearches > stats.successfulSearches && stats.totalSearches > 10 && (
                <div className="flex gap-3 p-4 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900 rounded-lg">
                  <XCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium text-foreground">Alta taxa de erros</p>
                    <p className="text-sm text-muted-foreground">
                      Verifique a configuração da API SerpApi e os créditos disponíveis.
                    </p>
                  </div>
                </div>
              )}

              {stats.avgResponseTime > 5000 && (
                <div className="flex gap-3 p-4 bg-orange-50 dark:bg-orange-950/20 border border-orange-200 dark:border-orange-900 rounded-lg">
                  <Clock className="h-5 w-5 text-orange-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium text-foreground">Latência elevada</p>
                    <p className="text-sm text-muted-foreground">
                      O tempo médio de resposta está alto. Verifique a conectividade com a API e considere otimizações.
                    </p>
                  </div>
                </div>
              )}

              {stats.cacheHitRate >= 50 && stats.errorSearches === 0 && stats.avgResponseTime < 2000 && (
                <div className="flex gap-3 p-4 bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-900 rounded-lg">
                  <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium text-foreground">Sistema operando perfeitamente</p>
                    <p className="text-sm text-muted-foreground">
                      Todas as métricas estão dentro dos parâmetros ideais. Continue monitorando.
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}
