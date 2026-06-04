/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { LogMessage } from '../types';
import { Terminal, Shield, RefreshCw, Trash2, SlidersHorizontal, AlertTriangle, Layers } from 'lucide-react';

interface TerminalLogsProps {
  logs: LogMessage[];
  onClear: () => void;
  onRefresh: () => void;
}

export default function TerminalLogs({ logs, onClear, onRefresh }: TerminalLogsProps) {
  const [levelFilter, setLevelFilter] = useState<string>('ALL');
  const [sourceFilter, setSourceFilter] = useState<string>('ALL');

  const levels = ['ALL', 'info', 'warn', 'error', 'success', 'system'];
  const sources = ['ALL', 'terminal', 'dhan_ws', 'ccxt_daemon', 'token_sweep', 'db', 'vault'];

  const filteredLogs = logs.filter(log => {
    const matchLevel = levelFilter === 'ALL' || log.level === levelFilter;
    const matchSource = sourceFilter === 'ALL' || log.source === sourceFilter;
    return matchLevel && matchSource;
  });

  const getLevelColor = (level: LogMessage['level']) => {
    switch (level) {
      case 'system': return 'text-violet-400 font-bold';
      case 'success': return 'text-emerald-400';
      case 'error': return 'text-rose-400 font-semibold';
      case 'warn': return 'text-amber-400';
      default: return 'text-slate-300';
    }
  };

  const getSourceBadge = (source: LogMessage['source']) => {
    switch (source) {
      case 'dhan_ws':
        return <span className="px-1.5 py-0.5 rounded text-[10px] bg-emerald-950/80 text-emerald-400 border border-emerald-900/40">dhan_ws</span>;
      case 'ccxt_daemon':
        return <span className="px-1.5 py-0.5 rounded text-[10px] bg-blue-950/80 text-blue-400 border border-blue-900/40">ccxt_daemon</span>;
      case 'token_sweep':
        return <span className="px-1.5 py-0.5 rounded text-[10px] bg-amber-950/80 text-amber-400 border border-amber-900/40">sweep_3am</span>;
      case 'vault':
        return <span className="px-1.5 py-0.5 rounded text-[10px] bg-rose-950/80 text-rose-400 border border-rose-900/40 font-mono">vault:gcm</span>;
      case 'db':
        return <span className="px-1.5 py-0.5 rounded text-[10px] bg-purple-950/80 text-purple-400 border border-purple-900/40">sqlite</span>;
      default:
        return <span className="px-1.5 py-0.5 rounded text-[10px] bg-slate-900 text-slate-400 border border-slate-800">core</span>;
    }
  };

  return (
    <div className="bg-[#111214] rounded-lg border border-[#2D2F31] flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 bg-[#161719] border-b border-[#2D2F31]">
        <div className="flex items-center gap-2">
          <Terminal className="w-4 h-4 text-emerald-400" />
          <span className="text-xs font-bold tracking-wider text-white font-mono">CCXT STREAMERS & KEEPER DAEMONS</span>
        </div>
        
        <div className="flex items-center gap-2">
          <button 
            onClick={onRefresh}
            className="p-1 rounded text-[#8E9299] hover:text-white hover:bg-[#1A1C1E] transition-colors"
            title="Refresh logs"
            id="btn_refresh_logs"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
          <button 
            onClick={onClear}
            className="p-1 rounded text-red-400 hover:text-red-300 hover:bg-red-950/20 transition-colors"
            title="Clear persistent log database"
            id="btn_clear_logs"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Filter panel */}
      <div className="flex flex-wrap items-center gap-3 px-3 py-1.5 bg-[#161719] border-b border-[#2D2F31] text-[11px] font-mono text-[#8E9299]">
        <div className="flex items-center gap-1.5">
          <SlidersHorizontal className="w-3 h-3 text-[#5C5F63]" />
          <span>Filters:</span>
        </div>

        {/* Level Filters */}
        <div className="flex items-center gap-1">
          <span className="text-[#5C5F63]">Level:</span>
          <div className="flex gap-1 bg-[#1A1C1E] p-0.5 rounded border border-[#2D2F31]">
            {levels.map(lvl => (
              <button
                key={lvl}
                onClick={() => setLevelFilter(lvl)}
                className={`px-1 rounded-sm capitalize cursor-pointer text-[10px] ${levelFilter === lvl ? 'bg-blue-600 text-white font-bold' : 'hover:text-slate-200'}`}
                id={`btn_log_filter_level_${lvl}`}
              >
                {lvl}
              </button>
            ))}
          </div>
        </div>

        {/* Source Filters */}
        <div className="flex items-center gap-1">
          <span className="text-[#5C5F63]">Service:</span>
          <div className="flex gap-1 bg-[#1A1C1E] p-0.5 rounded border border-[#2D2F31]">
            {sources.map(src => (
              <button
                key={src}
                onClick={() => setSourceFilter(src)}
                className={`px-1 rounded-sm cursor-pointer text-[10px] ${sourceFilter === src ? 'bg-blue-600 text-white font-bold' : 'hover:text-slate-200'}`}
                id={`btn_log_filter_source_${src}`}
              >
                {src}
              </button>
            ))}
          </div>
        </div>

        <span className="ml-auto text-[#5C5F63] text-[10px]">
          Showing {filteredLogs.length} of {logs.length} logs
        </span>
      </div>

      {/* Log list */}
      <div className="flex-1 overflow-y-auto p-2 font-mono text-[11px] leading-relaxed bg-[#1A1C1E]">
        {filteredLogs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 text-[#5C5F63]">
            <span className="text-xs">No matching system logs discovered.</span>
            <span className="text-[10px] mt-1 text-[#5C5F63]">Trigger transactions or sweep jobs to populate logs</span>
          </div>
        ) : (
          <div className="space-y-1.5">
            {filteredLogs.map(log => (
              <div 
                key={log.id} 
                className="flex items-start gap-2 hover:bg-[#111214] py-0.5 px-1 rounded transition-colors border-l border-[#2D2F31] hover:border-blue-500/30"
              >
                {/* Timestamp */}
                <span className="text-[#5C5F63] shrink-0 select-none">
                  {new Date(log.timestamp).toLocaleTimeString()}
                </span>

                {/* Source Label */}
                <span className="shrink-0">
                  {getSourceBadge(log.source)}
                </span>

                {/* Message Body */}
                <span className={`break-all ${getLevelColor(log.level)}`}>
                  {log.message}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Daemon Status Footer */}
      <div className="px-3 py-1.5 bg-[#161719] border-t border-[#2D2F31] flex items-center justify-between text-[10px] font-mono text-[#8E9299]">
        <div className="flex items-center gap-1.5">
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
          <span>ccxt.pro multiprocessor state: active</span>
        </div>
        <div className="flex items-center gap-3">
          <span>AES-256-GCM Vault Status: <span className="text-emerald-400 font-semibold">Locked</span></span>
          <span>Cron: <span className="text-amber-400">0 3 * * * IST</span></span>
        </div>
      </div>
    </div>
  );
}
