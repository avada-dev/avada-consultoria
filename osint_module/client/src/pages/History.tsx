import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";
import { ArrowLeft, CheckCircle2, XCircle, AlertCircle, Clock, Database, ExternalLink } from "lucide-react";
import { Link } from "wouter";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function History() {
  const { user } = useAuth();
  const { data: history, isLoading } = trpc.osint.getHistory.useQuery({ limit: 50 });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <CheckCircle2 className="h-4 w-4 text-green-600" />;
      case 'error':
        return <XCircle className="h-4 w-4 text-red-600" />;
      case 'empty':
        return <AlertCircle className="h-4 w-4 text-yellow-600" />;
      default:
        return null;
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'success':
        return 'Sucesso';
      case 'error':
        return 'Erro';
      case 'empty':
        return 'Sem resultados';
      default:
        return status;
    }
  };

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
                <h1 className="text-xl font-bold text-foreground">Histórico de Buscas</h1>
                <p className="text-sm text-muted-foreground">Visualize suas buscas anteriores</p>
              </div>
            </div>
            <span className="text-sm text-muted-foreground">{user?.name || user?.email}</span>
          </div>
        </div>
      </header>

      <main className="container py-8">
        <Card>
          <CardHeader>
            <CardTitle>Suas Buscas</CardTitle>
            <CardDescription>
              Histórico completo das suas consultas OSINT
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-8 text-muted-foreground">
                Carregando histórico...
              </div>
            ) : !history || history.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                Nenhuma busca realizada ainda
              </div>
            ) : (
              <div className="space-y-4">
                {history.map((record) => (
                  <div key={record.id} className="border rounded-lg p-4 hover:bg-accent/50 transition-colors">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                          {getStatusIcon(record.status)}
                          <span className="font-semibold text-foreground">
                            Matrícula {record.matricula}
                          </span>
                          <Badge variant="outline" className="text-xs">
                            {record.cidade}/{record.estado}
                          </Badge>
                          {record.fromCache === 1 && (
                            <Badge variant="secondary" className="text-xs">
                              <Database className="mr-1 h-3 w-3" />
                              Cache
                            </Badge>
                          )}
                        </div>

                        <div className="text-sm text-muted-foreground space-y-1">
                          {record.orgao && (
                            <p>Órgão: {record.orgao}</p>
                          )}
                          {record.cargo && (
                            <p>Cargo: {record.cargo}</p>
                          )}
                          <p className="font-mono text-xs bg-muted px-2 py-1 rounded inline-block">
                            {record.queryString}
                          </p>
                        </div>

                        {record.status === 'error' && record.errorMessage && (
                          <div className="mt-2 text-sm text-destructive">
                            Erro: {record.errorMessage}
                          </div>
                        )}
                      </div>

                      <div className="flex flex-col items-end gap-2 text-sm">
                        <Badge variant={record.status === 'success' ? 'default' : record.status === 'error' ? 'destructive' : 'secondary'}>
                          {getStatusLabel(record.status)}
                        </Badge>
                        <div className="flex items-center gap-1 text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          {record.responseTime}ms
                        </div>
                        {record.resultCount > 0 && (
                          <span className="text-muted-foreground">
                            {record.resultCount} resultado(s)
                          </span>
                        )}
                        <span className="text-xs text-muted-foreground">
                          {formatDistanceToNow(new Date(record.createdAt), { 
                            addSuffix: true,
                            locale: ptBR 
                          })}
                        </span>
                        {record.resultsUrl && (
                          <Button variant="ghost" size="sm" asChild>
                            <a href={record.resultsUrl} target="_blank" rel="noopener noreferrer">
                              <ExternalLink className="h-3 w-3 mr-1" />
                              JSON
                            </a>
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
