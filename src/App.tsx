/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Account, UnifiedOrder, UnifiedPosition, MarketTicker, LogMessage, PluggableAdapter } from './types';
import TerminalLogs from './components/TerminalLogs';
import AccountManager from './components/AccountManager';
import TradingConsole from './components/TradingConsole';
import TradingChart from './components/TradingChart';
import GoogleDriveManager from './components/GoogleDriveManager';
import { 
  Terminal, 
  Layers, 
  Settings, 
  HelpCircle, 
  RefreshCw, 
  TrendingUp, 
  Search, 
  FileText, 
  ShieldCheck, 
  Lock,
  Cloud
} from 'lucide-react';

export default function App() {
  // Navigation Tabs state
  const [activeTab, setActiveTab] = useState<'console' | 'accounts' | 'logs' | 'drive'>('console');

  // Core states
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [adapters, setAdapters] = useState<PluggableAdapter[]>([]);
  const [orders, setOrders] = useState<UnifiedOrder[]>([]);
  const [positions, setPositions] = useState<UnifiedPosition[]>([]);
  const [tickers, setTickers] = useState<Record<string, MarketTicker>>({});
  const [logs, setLogs] = useState<LogMessage[]>([]);
  
  // App-level status states
  const [selectedSymbol, setSelectedSymbol] = useState('DHAN');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [connectionModalError, setConnectionModalError] = useState<string | null>(null);

  // Fetch core static/dynamic dataset
  const fetchData = async (showLoader = false) => {
    if (showLoader) setIsRefreshing(true);
    try {
      const [accRes, adRes, ordRes, posRes, tickRes, logRes] = await Promise.all([
        fetch('/api/accounts'),
        fetch('/api/adapters'),
        fetch('/api/orders'),
        fetch('/api/positions'),
        fetch('/api/market/tickers'),
        fetch('/api/logs')
      ]);

      if (accRes.ok) setAccounts(await accRes.json());
      if (adRes.ok) setAdapters(await adRes.json());
      if (ordRes.ok) setOrders(await ordRes.json());
      if (posRes.ok) setPositions(await posRes.json());
      if (tickRes.ok) setTickers(await tickRes.json());
      if (logRes.ok) setLogs(await logRes.json());
    } catch (err) {
      console.error('Error fetching terminal dataset:', err);
    } finally {
      if (showLoader) setIsRefreshing(false);
    }
  };

  // 1.5s Dynamic polling interval for real-time tickers and profits calculation
  useEffect(() => {
    fetchData(true);
    const interval = setInterval(() => {
      fetchData(false);
    }, 1500);
    return () => clearInterval(interval);
  }, []);

  // API Call Handlers

  // 1. Register Account / Vault credentials
  const handleAddAccount = async (data: {
    name: string;
    venue: string;
    type: 'equity' | 'crypto';
    isPaper: boolean;
    credentials: Record<string, string>;
  }) => {
    const res = await fetch('/api/accounts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });

    if (!res.ok) {
      const errorData = await res.json();
      throw new Error(errorData.error || 'Failed to link account.');
    }

    await fetchData(false);
  };

  // 2. Erase Account Database Records
  const handleDeleteAccount = async (id: string) => {
    const res = await fetch(`/api/accounts/${id}`, {
      method: 'DELETE'
    });

    if (!res.ok) {
      const errorData = await res.json();
      throw new Error(errorData.error || 'Failed to remove account.');
    }

    await fetchData(false);
  };

  // 3. Connect to API Feed
  const handleConnectAccount = async (id: string) => {
    setConnectionModalError(null);
    const res = await fetch(`/api/accounts/${id}/connect`, {
      method: 'POST'
    });

    if (!res.ok) {
      const errorData = await res.json();
      setConnectionModalError(errorData.error || 'Connection failed.');
      throw new Error(errorData.error || 'Connection failed.');
    }

    await fetchData(false);
  };

  // 4. Tear down Active Pipeline
  const handleDisconnectAccount = async (id: string) => {
    const res = await fetch(`/api/accounts/${id}/disconnect`, {
      method: 'POST'
    });

    if (res.ok) {
      await fetchData(false);
    }
  };

  // 5. Place unified order routing
  const handleSubmitOrder = async (orderData: {
    accountId: string;
    symbol: string;
    side: 'BUY' | 'SELL';
    type: 'LIMIT' | 'MARKET';
    price: string;
    quantity: string;
  }) => {
    const res = await fetch('/api/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(orderData)
    });

    if (!res.ok) {
      const errorData = await res.json();
      throw new Error(errorData.error || 'Order transmission failed.');
    }

    await fetchData(false);
  };

  // 6. Manual order cancellation commands
  const handleCancelOrder = async (id: string) => {
    const res = await fetch(`/api/orders/${id}/cancel`, {
      method: 'POST'
    });

    if (!res.ok) {
      const errorData = await res.json();
      throw new Error(errorData.error || 'Unable to cancel order.');
    }

    await fetchData(false);
  };

  // 7. Dynamic adapters registration
  const handleRegisterAdapter = async (adapterData: {
    name: string;
    type: 'equity' | 'crypto';
    fields: Array<{ key: string; label: string; type: 'text' | 'password' }>;
  }) => {
    const res = await fetch('/api/adapters', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(adapterData)
    });

    if (!res.ok) {
      const errorData = await res.json();
      throw new Error(errorData.error || 'Pluggable adapter registration failed.');
    }

    await fetchData(false);
  };

  // 8. 3:00 AM IST Token Sweep Mock manual trigger
  const handleSweepTrigger = async () => {
    const res = await fetch('/api/sweep', {
      method: 'POST'
    });
    if (res.ok) {
      await fetchData(false);
    }
  };

  // 9. Clear system log history
  const handleClearLogs = async () => {
    const res = await fetch('/api/logs/clear', {
      method: 'POST'
    });
    if (res.ok) {
      await fetchData(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0A0B0D] text-[#D1D1D1] flex flex-col font-sans">
      {/* Dynamic Connection Failure Dialog Box */}
      {connectionModalError && (
        <div className="fixed inset-0 bg-black/75 flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-[#111214] border border-rose-950 max-w-md w-full rounded-lg shadow-2xl p-5 relative leading-relaxed">
            <h3 className="text-sm font-bold text-rose-400 uppercase font-mono tracking-wider flex items-center gap-2 mb-2.5">
              <Lock className="w-4 h-4 text-rose-500" />
              Credentials Pipeline Blocked
            </h3>
            <p className="text-xs text-slate-300 font-mono mb-4 bg-rose-950/20 p-2.5 rounded border border-rose-900/40">
              {connectionModalError}
            </p>
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => setConnectionModalError(null)}
                className="bg-rose-900/60 text-white font-mono hover:bg-rose-800 text-xs px-4 py-1.5 rounded cursor-pointer transition-colors"
                id="btn_close_error_modal"
              >
                Clear Alert
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Terminal Header bar */}
      <header className="bg-[#161719] border-b border-[#2D2F31] px-4 py-2.5 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
        <div className="flex items-center gap-3">
          {/* Custom Terminal Logo Frame */}
          <div className="p-1 px-1.5 bg-blue-950/40 border border-blue-700/50 rounded font-mono font-bold text-xs text-blue-400 tracking-wider flex items-center gap-1.5">
            <TrendingUp className="w-4 h-4 text-emerald-400" />
            <span>FINCEPT TERM</span>
          </div>

          <div>
            <h1 className="text-xs font-bold text-white uppercase tracking-tight leading-none">Fincept Terminal <span className="text-blue-500 font-mono text-[10px] ml-2 opacity-80">v2.4.0-qt6</span></h1>
            <span className="text-[10px] text-[#5C5F63] font-mono uppercase">AES-256-GCM VAULT ACTIVE</span>
          </div>
        </div>

        {/* Global Toolbar & Navigation */}
        <div className="flex items-center gap-3.5 flex-wrap sm:flex-nowrap">
          {/* Main Controls Navigator Tabs */}
          <nav className="bg-[#1A1C1E] border border-[#2D2F31] rounded flex items-center h-9 p-0 text-xs font-sans">
            <button
              onClick={() => setActiveTab('console')}
              className={`px-4 h-full text-[11px] font-bold uppercase tracking-wider transition-all border-b-2 cursor-pointer flex items-center gap-1.5 ${activeTab === 'console' ? 'text-blue-500 border-blue-500' : 'text-[#8E9299] hover:text-white border-transparent'}`}
              id="tab_console"
            >
              <TrendingUp className="w-3.5 h-3.5" />
              <span>DESK CONSOLE</span>
            </button>
            <button
              onClick={() => setActiveTab('accounts')}
              className={`px-4 h-full text-[11px] font-bold uppercase tracking-wider transition-all border-b-2 cursor-pointer flex items-center gap-1.5 ${activeTab === 'accounts' ? 'text-blue-500 border-blue-500' : 'text-[#8E9299] hover:text-white border-transparent'}`}
              id="tab_accounts"
            >
              <Settings className="w-3.5 h-3.5" />
              <span>ACCOUNT STACK</span>
            </button>
            <button
              onClick={() => setActiveTab('logs')}
              className={`px-4 h-full text-[11px] font-bold uppercase tracking-wider transition-all border-b-2 cursor-pointer flex items-center gap-1.5 ${activeTab === 'logs' ? 'text-blue-500 border-blue-500' : 'text-[#8E9299] hover:text-white border-transparent'}`}
              id="tab_logs"
            >
              <Terminal className="w-3.5 h-3.5" />
              <span>SYSTEM LOGS ({logs.length})</span>
            </button>
            <button
              onClick={() => setActiveTab('drive')}
              className={`px-4 h-full text-[11px] font-bold uppercase tracking-wider transition-all border-b-2 cursor-pointer flex items-center gap-1.5 ${activeTab === 'drive' ? 'text-blue-500 border-blue-500' : 'text-[#8E9299] hover:text-white border-transparent'}`}
              id="tab_drive"
            >
              <Cloud className="w-3.5 h-3.5" />
              <span>DRIVE EXPORT</span>
            </button>
          </nav>

          {/* Quick Stats overview */}
          <div className="hidden lg:flex items-center gap-3 text-[10px] font-mono border-l border-[#2D2F31] pl-3">
            <div className="flex items-center gap-1.5 text-[#8E9299]">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span className="text-[#5C5F63]">VAULT:</span>
              <span className="text-emerald-500 font-bold">AES-256-GCM ACTIVE</span>
            </div>
            
            <button
              onClick={() => fetchData(true)}
              className="p-1 rounded text-[#8E9299] hover:text-white hover:bg-[#1A1C1E] border border-[#2D2F31] transition-colors cursor-pointer"
              title="Manual terminal poll refresh"
              id="btn_global_refetch"
            >
              <RefreshCw className={`w-3 h-3 ${isRefreshing ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>
      </header>

      {/* Primary viewport cockpit layouts workspace */}
      <main className="flex-1 p-4 overflow-y-auto max-w-7xl w-full mx-auto">
        {activeTab === 'console' && (
          <div className="grid grid-cols-1 xl:grid-cols-12 gap-4">
            {/* Real-time Dynamic Tick Chart elements */}
            <div className="xl:col-span-7 h-full">
              <TradingChart 
                selectedSymbol={selectedSymbol} 
                ticker={tickers[selectedSymbol]} 
              />
            </div>

            {/* Trading pads, watchlist, Positions exposure desks */}
            <div className="xl:col-span-5">
              <TradingConsole
                accounts={accounts}
                orders={orders}
                positions={positions}
                tickers={tickers}
                selectedSymbol={selectedSymbol}
                setSelectedSymbol={setSelectedSymbol}
                onSubmitOrder={handleSubmitOrder}
                onCancelOrder={handleCancelOrder}
                onSweepTrigger={handleSweepTrigger}
              />
            </div>

            {/* Quick-links helpful guide footer section inside desk */}
            <div className="xl:col-span-12">
              <div className="bg-[#111214] border border-[#2D2F31] rounded-lg p-3 text-xs leading-relaxed text-[#D1D1D1]">
                <div className="flex items-center gap-1.5 font-bold font-mono text-white mb-1 leading-none uppercase">
                  <FileText className="w-4 h-4 text-blue-500" />
                  Terminal Desk Quick-Start Guides
                </div>
                <p className="text-[11px] text-[#8E9299]">
                  Select instrument tickers to load the charting feeds. Live positions are calculated and simulated continuously at 1s intervals. To simulate a credential validation error and connection block model, prepend or write the word <strong className="text-red-400 font-mono uppercase">"FAIL"</strong> inside the Dhan Client ID or Crypto keys, then click Connect Channel.
                </p>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'accounts' && (
          <AccountManager
            accounts={accounts}
            adapters={adapters}
            onAddAccount={handleAddAccount}
            onDeleteAccount={handleDeleteAccount}
            onConnectAccount={handleConnectAccount}
            onDisconnectAccount={handleDisconnectAccount}
            onRegisterAdapter={handleRegisterAdapter}
          />
        )}

        {activeTab === 'logs' && (
          <div className="h-[520px]">
            <TerminalLogs 
              logs={logs} 
              onClear={handleClearLogs} 
              onRefresh={() => fetchData(true)} 
            />
          </div>
        )}

        {activeTab === 'drive' && (
          <div className="min-h-[520px]">
            <GoogleDriveManager
              positions={positions}
              orders={orders}
              logs={logs}
              accounts={accounts}
              onAddSystemLog={(message, level) => {
                fetch('/api/logs', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    level,
                    source: 'terminal',
                    message
                  })
                }).then(() => fetchData(false));
              }}
            />
          </div>
        )}
      </main>

      {/* Terminal Desk Footer bar */}
      <footer className="bg-[#161719] border-t border-[#2D2F31] h-7 py-0 px-4 flex items-center justify-between text-[10px] font-mono shrink-0 select-none">
        <div className="flex gap-6">
          <div className="text-[#8E9299]">HOST: <span className="text-white">0.0.0.0:3000</span></div>
          <div className="hidden sm:block text-[#8E9299]">DB: <span className="text-white">fincept_main.sqlite (hydrated)</span></div>
          <div className="text-[#8E9299]">CPU: <span className="text-white">3.4%</span></div>
        </div>
        <div className="flex gap-4 items-center">
          <div className="text-[#5C5F63]">ENV: <span className="text-emerald-500">PRODUCTION_LOCAL</span></div>
          <div className="text-blue-500 font-bold tracking-widest uppercase">SYSTEM SECURE</div>
        </div>
      </footer>
    </div>
  );
}
