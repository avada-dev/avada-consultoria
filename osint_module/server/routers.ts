import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { z } from "zod";
import { 
  buildQueryString, 
  searchWithRetry,
  searchWithFallback,
  sanitizeInput, 
  validateSearchParams,
  type SearchParams 
} from "./serpapi";
import { filterRelevantResults } from "./resultFilter";
import { 
  generateCacheKey, 
  getCachedResults, 
  setCachedResults 
} from "./cache";
import { 
  insertSearchHistory, 
  getSearchHistoryByUserId, 
  getAllSearchHistory,
  getSearchStatistics 
} from "./db";
import { storagePut } from "./storage";
import { TRPCError } from "@trpc/server";
import { notifyCriticalResults, notifyRecurrentErrors } from "./notifications";

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),

  osint: router({
    /**
     * Procedimento principal de busca OSINT
     * Implementa sanitização, validação, cache, busca na SerpApi e persistência
     */
    search: protectedProcedure
      .input(z.object({
        matricula: z.string().min(1, "Matrícula é obrigatória"),
        cidade: z.string().min(1, "Cidade é obrigatória"),
        estado: z.string().length(2, "Estado deve ser uma sigla de 2 letras"),
        orgao: z.string().optional(),
        cargo: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const startTime = Date.now();
        
        // 1. Sanitizar entrada
        const sanitizedParams: SearchParams = {
          matricula: sanitizeInput(input.matricula),
          cidade: sanitizeInput(input.cidade),
          estado: sanitizeInput(input.estado),
          orgao: input.orgao ? sanitizeInput(input.orgao) : undefined,
          cargo: input.cargo ? sanitizeInput(input.cargo) : undefined,
        };

        // 2. Validar parâmetros
        const validation = validateSearchParams(sanitizedParams);
        if (!validation.valid) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: validation.error || 'Parâmetros inválidos',
          });
        }

        // 3. Construir query string
        const queryString = buildQueryString(sanitizedParams);
        console.log('[OSINT] Query construída:', queryString);

        // 4. Verificar cache
        const cacheKey = generateCacheKey(sanitizedParams);
        const cachedData = await getCachedResults(cacheKey);
        
        if (cachedData) {
          const responseTime = Date.now() - startTime;
          
          // Registrar busca do cache no histórico
          await insertSearchHistory({
            userId: ctx.user.id,
            matricula: sanitizedParams.matricula,
            cidade: sanitizedParams.cidade,
            estado: sanitizedParams.estado,
            orgao: sanitizedParams.orgao || null,
            cargo: sanitizedParams.cargo || null,
            queryString,
            resultCount: cachedData.results.length,
            fromCache: 1,
            responseTime,
            resultsUrl: cachedData.resultsUrl || null,
            status: cachedData.results.length > 0 ? 'success' : 'empty',
            errorMessage: null,
          });

          return {
            success: true,
            fromCache: true,
            results: cachedData.results,
            queryString,
            responseTime,
            resultCount: cachedData.results.length,
          };
        }

        // 5. Executar busca na SerpApi com fallback inteligente
        try {
          const serpApiResponse = await searchWithFallback(sanitizedParams);
          let results = serpApiResponse.organic_results || [];
          const queryUsed = serpApiResponse.queryUsed;
          const responseTime = Date.now() - startTime;

          // 5.1. Filtrar resultados para manter apenas os relacionados à matrícula
          console.log(`[OSINT] Resultados brutos: ${results.length}`);
          results = filterRelevantResults(results, sanitizedParams);
          console.log(`[OSINT] Resultados após filtro: ${results.length}`);

          // Se nenhum resultado passou no filtro, lançar erro
          if (results.length === 0) {
            throw new Error('Nenhum resultado encontrado relacionado à matrícula especificada. Verifique se a matrícula, cidade e estado estão corretos.');
          }

          // 6. Persistir resultados no S3
          let resultsUrl: string | null = null;
          try {
            const timestamp = Date.now();
            const fileName = `search-${ctx.user.id}-${timestamp}.json`;
            const fileKey = `osint-history/${fileName}`;
            const resultsData = {
              params: sanitizedParams,
              queryString,
              results,
              timestamp,
              userId: ctx.user.id,
            };
            
            const { url } = await storagePut(
              fileKey,
              JSON.stringify(resultsData, null, 2),
              'application/json'
            );
            resultsUrl = url;
          } catch (s3Error) {
            console.error('[OSINT] Erro ao salvar no S3:', s3Error);
            // Não falhar a busca se S3 falhar
          }

          // 7. Armazenar no cache
          const cacheData = {
            results,
            resultsUrl,
          };
          await setCachedResults(cacheKey, cacheData);

          // 8. Registrar no histórico
          await insertSearchHistory({
            userId: ctx.user.id,
            matricula: sanitizedParams.matricula,
            cidade: sanitizedParams.cidade,
            estado: sanitizedParams.estado,
            orgao: sanitizedParams.orgao || null,
            cargo: sanitizedParams.cargo || null,
            queryString,
            resultCount: results.length,
            fromCache: 0,
            responseTime,
            resultsUrl,
            status: results.length > 0 ? 'success' : 'empty',
            errorMessage: null,
          });

          // 9. Notificar proprietário se resultados críticos (>10 resultados)
          if (results.length > 10) {
            notifyCriticalResults({
              matricula: sanitizedParams.matricula,
              cidade: sanitizedParams.cidade,
              estado: sanitizedParams.estado,
              resultCount: results.length,
              userName: ctx.user.name || ctx.user.email || 'Usuário',
            }).catch(err => console.error('[OSINT] Erro ao notificar:', err));
          }

          return {
            success: true,
            fromCache: false,
            results,
            queryString,
            responseTime,
            resultCount: results.length,
          };

        } catch (error) {
          const responseTime = Date.now() - startTime;
          const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';

          // Registrar erro no histórico
          await insertSearchHistory({
            userId: ctx.user.id,
            matricula: sanitizedParams.matricula,
            cidade: sanitizedParams.cidade,
            estado: sanitizedParams.estado,
            orgao: sanitizedParams.orgao || null,
            cargo: sanitizedParams.cargo || null,
            queryString,
            resultCount: 0,
            fromCache: 0,
            responseTime,
            resultsUrl: null,
            status: 'error',
            errorMessage,
          });

          // Notificar sobre erros recorrentes
          notifyRecurrentErrors(errorMessage).catch(err => 
            console.error('[OSINT] Erro ao notificar sobre erros recorrentes:', err)
          );

          // Tratar erros específicos da API
          if (errorMessage.includes('401') || errorMessage.includes('403')) {
            throw new TRPCError({
              code: 'UNAUTHORIZED',
              message: 'Erro de autenticação com a API de busca. Contate o administrador.',
            });
          }

          if (errorMessage.includes('429')) {
            throw new TRPCError({
              code: 'TOO_MANY_REQUESTS',
              message: 'Limite de buscas excedido. Tente novamente mais tarde.',
            });
          }

          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: `Erro ao executar busca: ${errorMessage}`,
          });
        }
      }),

    /**
     * Obter histórico de buscas do usuário
     */
    getHistory: protectedProcedure
      .input(z.object({
        limit: z.number().min(1).max(100).default(50),
      }))
      .query(async ({ ctx, input }) => {
        const history = await getSearchHistoryByUserId(ctx.user.id, input.limit);
        return history;
      }),

    /**
     * Obter histórico completo (admin apenas)
     */
    getAllHistory: protectedProcedure
      .input(z.object({
        limit: z.number().min(1).max(200).default(100),
      }))
      .query(async ({ ctx, input }) => {
        if (ctx.user.role !== 'admin') {
          throw new TRPCError({
            code: 'FORBIDDEN',
            message: 'Acesso negado. Apenas administradores podem acessar o histórico completo.',
          });
        }

        const history = await getAllSearchHistory(input.limit);
        return history;
      }),

    /**
     * Obter estatísticas de uso
     */
    getStatistics: protectedProcedure
      .query(async ({ ctx }) => {
        if (ctx.user.role !== 'admin') {
          throw new TRPCError({
            code: 'FORBIDDEN',
            message: 'Acesso negado. Apenas administradores podem acessar estatísticas.',
          });
        }

        const stats = await getSearchStatistics();
        return stats;
      }),
  }),
});

export type AppRouter = typeof appRouter;
