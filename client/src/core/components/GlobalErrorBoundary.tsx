import { Component, ErrorInfo, ComponentChildren } from 'preact';

interface Props {
  children: ComponentChildren;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class GlobalErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error: Error) {
    // 다음 렌더링에서 폴백 UI가 보이도록 상태를 업데이트 합니다.
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // 에러 리포팅 서비스에 에러를 기록할 수도 있습니다.
    console.error("GlobalErrorBoundary caught an error:", error, errorInfo);
    this.setState({ errorInfo });
  }

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      // 폴백 UI 커스텀
      return (
        <div style={{
          padding: '2rem',
          height: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#1a1a2e',
          color: '#ffffff',
          fontFamily: 'system-ui, -apple-system, sans-serif'
        }}>
          <h2 style={{ marginBottom: '1rem', color: '#ff4d4f' }}>앱 실행 중 문제가 발생했습니다</h2>
          <div style={{ 
            backgroundColor: '#0f0f1e', 
            padding: '1rem', 
            borderRadius: '8px', 
            marginBottom: '1.5rem',
            maxWidth: '90vw',
            overflow: 'auto',
            border: '1px solid #333'
          }}>
            <p style={{ color: '#ffccc7', fontWeight: 'bold' }}>{this.state.error?.toString()}</p>
            {this.state.errorInfo && (
              <pre style={{ fontSize: '0.8rem', color: '#888', marginTop: '0.5rem' }}>
                {this.state.errorInfo.componentStack}
              </pre>
            )}
          </div>
          <button 
            onClick={this.handleReload}
            style={{
              padding: '0.8rem 1.5rem',
              backgroundColor: '#1890ff',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              fontSize: '1rem',
              cursor: 'pointer'
            }}
          >
            앱 새로고침
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
