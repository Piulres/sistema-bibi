"use client";

import Alert from "@/components/ui/Alert";
import LoadingState from "@/components/ui/LoadingState";
import Button from "@/components/ui/Button";

type Props = {
  loading?: boolean;
  error?: string | null;
  loadingMessage?: string;
  onRetry?: () => void;
  children: React.ReactNode;
};

/**
 * Guard de tela: loading fullscreen → erro com retry → conteúdo.
 * Padrão do mapeamento de feedback UX (camada B).
 */
export default function ViewStateBoundary({
  loading,
  error,
  loadingMessage = "Carregando...",
  onRetry,
  children,
}: Props) {
  if (loading) {
    return <LoadingState message={loadingMessage} />;
  }

  if (error) {
    return (
      <div className="space-y-3">
        <Alert tone="danger">{error}</Alert>
        {onRetry && (
          <Button type="button" variant="secondary" size="sm" onClick={onRetry}>
            Tentar novamente
          </Button>
        )}
      </div>
    );
  }

  return <>{children}</>;
}
