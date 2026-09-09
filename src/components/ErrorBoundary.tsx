import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, ArrowLeft, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
  onReset?: () => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  stack: string | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    stack: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, stack: null };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error in component tree:', error);
    console.error('Component stack:', errorInfo.componentStack);
    this.setState({ stack: errorInfo.componentStack });
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center p-6 text-center">
          <div className="w-16 h-16 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400 mb-4 shadow-lg">
            <AlertTriangle className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold text-white mb-2">管理控制台渲染异常</h2>
          <p className="text-sm text-slate-400 max-w-md mb-6 leading-relaxed">
            页面加载时捕获到运行时错误。这通常是因为某些配置字段为空或数据格式变更引起。
          </p>
          {this.state.error && (
            <div className="w-full max-w-lg mb-3 p-3 rounded-lg bg-slate-900 border border-slate-800 text-left font-mono text-xs text-rose-300 overflow-x-auto">
              {this.state.error.message}
            </div>
          )}
          {this.state.stack && (
            <div className="w-full max-w-lg mb-6 p-3 rounded-lg bg-slate-900 border border-slate-800 text-left font-mono text-xs text-rose-200 overflow-x-auto max-h-48">
              {this.state.stack}
            </div>
          )}
          <div className="flex items-center gap-3">
            {this.props.onReset && (
              <button
                onClick={() => {
                  this.setState({ hasError: false, error: null, stack: null });
                  this.props.onReset?.();
                }}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold transition-all border border-slate-700"
              >
                <ArrowLeft className="w-4 h-4" />
                返回前台主页
              </button>
            )}
            <button
              onClick={() => window.location.reload()}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold transition-all"
            >
              <RefreshCw className="w-4 h-4" />
              重新刷新页面
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
