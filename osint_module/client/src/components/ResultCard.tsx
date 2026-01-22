import { CheckCircle2, AlertCircle } from 'lucide-react';
import { Card } from '@/components/ui/card';

interface ValidationInfo {
  hasMatricula: boolean;
  hasCidade: boolean;
  hasEstado: boolean;
  isRelevant: boolean;
}

interface ResultCardProps {
  index: number;
  title: string;
  snippet: string;
  link: string;
  validation: ValidationInfo;
  matricula: string;
  cidade: string;
  estado: string;
}

export function ResultCard({
  index,
  title,
  snippet,
  link,
  validation,
  matricula,
  cidade,
  estado,
}: ResultCardProps) {
  const highlightMatricula = (text: string) => {
    const regex = new RegExp(`(${matricula})`, 'gi');
    return text.split(regex).map((part, i) =>
      regex.test(part) ? (
        <span key={i} className="bg-yellow-200 font-semibold">
          {part}
        </span>
      ) : (
        part
      )
    );
  };

  return (
    <Card className="p-6 mb-4 border-l-4 border-l-green-500">
      <div className="flex gap-4">
        {/* Número do resultado */}
        <div className="flex-shrink-0 w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-bold">
          {index}
        </div>

        {/* Conteúdo principal */}
        <div className="flex-1">
          {/* Título */}
          <a
            href={link}
            target="_blank"
            rel="noopener noreferrer"
            className="text-lg font-semibold text-blue-600 hover:underline block mb-2"
          >
            {title}
          </a>

          {/* Snippet com destaque */}
          <p className="text-gray-700 text-sm mb-3 leading-relaxed">
            {highlightMatricula(snippet)}
          </p>

          {/* Link */}
          <p className="text-xs text-gray-500 mb-4 truncate">{link}</p>

          {/* Validações */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-3 border-t border-gray-200">
            {/* Matrícula */}
            <div className="flex items-center gap-2">
              {validation.hasMatricula ? (
                <CheckCircle2 className="w-4 h-4 text-green-600" />
              ) : (
                <AlertCircle className="w-4 h-4 text-red-600" />
              )}
              <span className={`text-xs font-medium ${validation.hasMatricula ? 'text-green-600' : 'text-red-600'}`}>
                Matrícula {matricula}
              </span>
            </div>

            {/* Cidade */}
            <div className="flex items-center gap-2">
              {validation.hasCidade ? (
                <CheckCircle2 className="w-4 h-4 text-green-600" />
              ) : (
                <AlertCircle className="w-4 h-4 text-red-600" />
              )}
              <span className={`text-xs font-medium ${validation.hasCidade ? 'text-green-600' : 'text-red-600'}`}>
                {cidade}
              </span>
            </div>

            {/* Estado */}
            <div className="flex items-center gap-2">
              {validation.hasEstado ? (
                <CheckCircle2 className="w-4 h-4 text-green-600" />
              ) : (
                <AlertCircle className="w-4 h-4 text-red-600" />
              )}
              <span className={`text-xs font-medium ${validation.hasEstado ? 'text-green-600' : 'text-red-600'}`}>
                {estado}
              </span>
            </div>

            {/* Relevância */}
            <div className="flex items-center gap-2">
              {validation.isRelevant ? (
                <CheckCircle2 className="w-4 h-4 text-green-600" />
              ) : (
                <AlertCircle className="w-4 h-4 text-red-600" />
              )}
              <span className={`text-xs font-medium ${validation.isRelevant ? 'text-green-600' : 'text-red-600'}`}>
                Relevante
              </span>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}
