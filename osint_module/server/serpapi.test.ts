import { describe, it, expect, beforeAll } from "vitest";
import { buildQueryString, validateSearchParams, sanitizeInput } from "./serpapi";

describe("SerpApi Integration", () => {
  describe("buildQueryString", () => {
    it("deve construir query com todas as variações de matrícula", () => {
      const query = buildQueryString({
        matricula: "12345",
        cidade: "São Paulo",
        estado: "SP",
      });

      expect(query).toContain('"Matrícula 12345"');
      expect(query).toContain('"Matrícula nº 12345"');
      expect(query).toContain('"Matrícula n° 12345"');
      expect(query).toContain('"Matrícula n. 12345"');
      expect(query).toContain('"Mat. 12345"');
      expect(query).toContain("OR");
      expect(query).toContain('"São Paulo"');
      expect(query).toContain('"SP"');
    });

    it("deve incluir órgão e cargo quando fornecidos", () => {
      const query = buildQueryString({
        matricula: "12345",
        cidade: "São Paulo",
        estado: "SP",
        orgao: "Secretaria de Saúde",
        cargo: "Médico",
      });

      expect(query).toContain("Secretaria de Saúde");
      expect(query).toContain("Médico");
    });

    it("deve funcionar sem órgão e cargo", () => {
      const query = buildQueryString({
        matricula: "12345",
        cidade: "São Paulo",
        estado: "SP",
      });

      expect(query).toBeDefined();
      expect(query.length).toBeGreaterThan(0);
    });
  });

  describe("validateSearchParams", () => {
    it("deve validar parâmetros corretos", () => {
      const result = validateSearchParams({
        matricula: "12345",
        cidade: "São Paulo",
        estado: "SP",
      });

      expect(result.valid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it("deve rejeitar matrícula vazia", () => {
      const result = validateSearchParams({
        matricula: "",
        cidade: "São Paulo",
        estado: "SP",
      });

      expect(result.valid).toBe(false);
      expect(result.error).toContain("obrigatória");
    });

    it("deve rejeitar cidade vazia", () => {
      const result = validateSearchParams({
        matricula: "12345",
        cidade: "",
        estado: "SP",
      });

      expect(result.valid).toBe(false);
      expect(result.error).toContain("obrigatória");
    });

    it("deve rejeitar estado vazio", () => {
      const result = validateSearchParams({
        matricula: "12345",
        cidade: "São Paulo",
        estado: "",
      });

      expect(result.valid).toBe(false);
      expect(result.error).toContain("obrigatório");
    });

    it("deve rejeitar estado com mais de 2 caracteres", () => {
      const result = validateSearchParams({
        matricula: "12345",
        cidade: "São Paulo",
        estado: "SPP",
      });

      expect(result.valid).toBe(false);
      expect(result.error).toContain("2 letras");
    });

    it("deve rejeitar matrícula com caracteres inválidos", () => {
      const result = validateSearchParams({
        matricula: "123@45!",
        cidade: "São Paulo",
        estado: "SP",
      });

      expect(result.valid).toBe(false);
      expect(result.error).toContain("inválidos");
    });

    it("deve aceitar matrícula com separadores válidos", () => {
      const result1 = validateSearchParams({
        matricula: "123.456-7",
        cidade: "São Paulo",
        estado: "SP",
      });
      expect(result1.valid).toBe(true);

      const result2 = validateSearchParams({
        matricula: "2023/001",
        cidade: "São Paulo",
        estado: "SP",
      });
      expect(result2.valid).toBe(true);
    });
  });

  describe("sanitizeInput", () => {
    it("deve remover caracteres perigosos", () => {
      const sanitized = sanitizeInput("teste<script>alert()</script>");
      expect(sanitized).not.toContain("<");
      expect(sanitized).not.toContain(">");
    });

    it("deve remover parênteses que podem quebrar lógica booleana", () => {
      const sanitized = sanitizeInput("teste(com)parênteses");
      expect(sanitized).not.toContain("(");
      expect(sanitized).not.toContain(")");
    });

    it("deve preservar separadores válidos", () => {
      const sanitized = sanitizeInput("123.456-7");
      expect(sanitized).toContain(".");
      expect(sanitized).toContain("-");
    });

    it("deve fazer trim de espaços", () => {
      const sanitized = sanitizeInput("  teste  ");
      expect(sanitized).toBe("teste");
    });
  });
});
