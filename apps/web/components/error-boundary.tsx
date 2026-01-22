'use client';

import React, { Component, type ReactNode } from 'react';

interface ErrorBoundaryProps {
    children: ReactNode;
    fallback?: ReactNode;
    onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
}

interface ErrorBoundaryState {
    hasError: boolean;
    error: Error | null;
}

/**
 * Error Boundary para capturar erros React e exibir fallback UI.
 * Previne que erros em componentes filhos crashem toda a aplicação.
 * 
 * @example
 * <ErrorBoundary fallback={<ErrorFallback />}>
 *   <MyComponent />
 * </ErrorBoundary>
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
    constructor(props: ErrorBoundaryProps) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error: Error): ErrorBoundaryState {
        return { hasError: true, error };
    }

    componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
        // Log para serviço de monitoramento (Sentry, etc)
        console.error('[ErrorBoundary] Caught error:', error, errorInfo);

        // Callback opcional para handling customizado
        this.props.onError?.(error, errorInfo);
    }

    handleReset = (): void => {
        this.setState({ hasError: false, error: null });
    };

    render(): ReactNode {
        if (this.state.hasError) {
            // Usa fallback customizado se fornecido
            if (this.props.fallback) {
                return this.props.fallback;
            }

            // Fallback padrão
            return (
                <div className="flex min-h-[400px] flex-col items-center justify-center p-8">
                    <div className="rounded-lg border border-red-200 bg-red-50 p-6 text-center dark:border-red-800 dark:bg-red-900/20">
                        <h2 className="mb-2 text-lg font-semibold text-red-800 dark:text-red-200">
                            Algo deu errado
                        </h2>
                        <p className="mb-4 text-sm text-red-600 dark:text-red-300">
                            Ocorreu um erro inesperado. Por favor, tente novamente.
                        </p>
                        <button
                            onClick={this.handleReset}
                            className="rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
                        >
                            Tentar novamente
                        </button>
                        {process.env.NODE_ENV === 'development' && this.state.error && (
                            <details className="mt-4 text-left">
                                <summary className="cursor-pointer text-xs text-red-500">
                                    Detalhes do erro (dev only)
                                </summary>
                                <pre className="mt-2 overflow-auto rounded bg-red-100 p-2 text-xs dark:bg-red-900/50">
                                    {this.state.error.message}
                                    {'\n'}
                                    {this.state.error.stack}
                                </pre>
                            </details>
                        )}
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}

/**
 * Hook wrapper para usar ErrorBoundary com error callback.
 * Útil para integração com serviços de monitoramento.
 */
export function withErrorBoundary<P extends object>(
    WrappedComponent: React.ComponentType<P>,
    fallback?: ReactNode
): React.FC<P> {
    const WithErrorBoundary: React.FC<P> = (props) => (
        <ErrorBoundary fallback={fallback}>
            <WrappedComponent {...props} />
        </ErrorBoundary>
    );

    WithErrorBoundary.displayName = `WithErrorBoundary(${WrappedComponent.displayName || WrappedComponent.name || 'Component'})`;

    return WithErrorBoundary;
}
