import * as React from 'react';

interface Props {
    children: React.ReactNode;
}

interface State {
    hasError: boolean;
    error: Error | null;
}

class ErrorBoundary extends React.Component<Props, State> {
    public state: State = {
        hasError: false,
        error: null,
    };

    public static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error };
    }

    public componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
        console.error("=== ERROR BOUNDARY CAUGHT ERROR ===");
        console.error("Error:", error);
        console.error("Error Message:", error.message);
        console.error("Stack:", error.stack);
        console.error("Component Stack:", errorInfo.componentStack);
        console.error("===================================");
    }

    public render() {
        if (this.state.hasError) {
            return (
                <div style={{
                    padding: '2rem',
                    textAlign: 'center',
                    backgroundColor: '#fee2e2',
                    color: '#b91c1c',
                    margin: '2rem',
                    borderRadius: '8px'
                }}>
                    <h2>Something went wrong.</h2>
                    <p>{this.state.error?.message || "An unexpected error occurred."}</p>
                    <button
                        onClick={() => this.setState({ hasError: false })}
                        style={{
                            marginTop: '1rem',
                            padding: '0.5rem 1rem',
                            backgroundColor: '#b91c1c',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer'
                        }}
                    >
                        Try again
                    </button>
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;
