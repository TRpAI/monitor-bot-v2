import React from 'react';
import { Bot, Heart, Shield, Cloud, Container, Server, Download } from 'lucide-react';

interface FooterProps {
  onOpenAdmin: () => void;
  botUsername?: string;
  onOpenDownload?: () => void;
}

export const Footer: React.FC<FooterProps> = ({ onOpenAdmin, botUsername, onOpenDownload }) => {
  return (
    <footer className="mt-16 border-t border-slate-900 bg-slate-950/60 py-8 text-xs text-slate-500">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
        
        {/* Left info */}
        <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-4 text-center sm:text-left">
          <div className="flex items-center gap-1.5 text-slate-300 font-medium">
            <Bot className="w-4 h-4 text-cyan-400" />
            <span>MonitorBot Web & Admin</span>
          </div>
          <span className="hidden sm:inline text-slate-800">|</span>
          <p className="text-slate-400">
            基于开源项目{' '}
            <a
              href="https://github.com/TRpAI/monitor-bot"
              target="_blank"
              rel="noreferrer"
              className="text-cyan-400 hover:text-cyan-300 underline underline-offset-2 transition-colors font-mono"
            >
              TRpAI/monitor-bot
            </a>
            {' '}构建
          </p>
        </div>

        {/* Center: Deployment Badges */}
        <div className="flex items-center gap-2 text-[10px] font-mono">
          <span className="flex items-center gap-1 px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-400">
            <Cloud className="w-3 h-3 text-orange-400" />
            <span>Cloudflare</span>
          </span>
          <span className="flex items-center gap-1 px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-400">
            <Container className="w-3 h-3 text-blue-400" />
            <span>Docker</span>
          </span>
          <span className="flex items-center gap-1 px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-400">
            <Server className="w-3 h-3 text-emerald-400" />
            <span>Bare-Metal</span>
          </span>
        </div>

        {/* Right buttons */}
        <div className="flex items-center gap-3">
          {onOpenDownload && (
            <button
              onClick={onOpenDownload}
              className="text-slate-400 hover:text-cyan-400 transition-colors flex items-center gap-1 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 text-cyan-400" />
              <span>打包下载源码与数据</span>
            </button>
          )}
          <button
            onClick={onOpenAdmin}
            className="text-slate-400 hover:text-slate-200 transition-colors flex items-center gap-1 cursor-pointer"
          >
            <Shield className="w-3.5 h-3.5 text-slate-400" />
            <span>后台管理系统</span>
          </button>
          <a
            href="https://github.com/TRpAI/monitor-bot"
            target="_blank"
            rel="noreferrer"
            className="text-slate-400 hover:text-slate-200 transition-colors p-1"
            title="GitHub 源码"
          >
            <span className="text-lg">⌨</span>
          </a>
        </div>

      </div>
    </footer>
  );
};
