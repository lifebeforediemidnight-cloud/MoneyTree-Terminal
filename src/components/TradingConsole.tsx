/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Account, UnifiedOrder, UnifiedPosition, MarketTicker } from '../types';
import { TrendingUp, TrendingDown, Clock, ShieldAlert, ArrowUpRight, ArrowDownRight, RefreshCw, X, Play } from 'lucide-react';

interface TradingConsoleProps {
  accounts: Account[];
  orders: UnifiedOrder[];
  positions: UnifiedPosition[];
  tickers: Record<string, MarketTicker>;
  selectedSymbol: string;
  setSelectedSymbol: (symbol: string) => void;
  onSubmitOrder: (data: { accountId: string; symbol: string; side: 'BUY' | 'SELL'; type: 'LIMIT' | 'MARKET'; price: string; quantity: string }) => Promise<void>;
  onCancelOrder: (id: string) => Promise<void>;
  onSweepTrigger: () => void;
}

export default function TradingConsole({
  accounts,
  orders,
  positions,
  tickers,
  selectedSymbol,
  setSelectedSymbol,
  onSubmitOrder,
  onCancelOrder,
  onSweepTrigger
}: TradingConsoleProps) {
  const [side, setSide] = useState<'BUY' | 'SELL'>('BUY');
  const [orderType, setOrderType] = useState<'LIMIT' | 'MARKET'>('LIMIT');
  const [price, setPrice] = useState('489.20');
  const [quantity, setQuantity] = useState('10');
  
  // Choose among CONNECTED / PAPER accounts
  const tradeableAccounts = accounts.filter(acc => acc.status === 'connected' || acc.isPaper);
  const [selectedAccountId, setSelectedAccountId] = useState(tradeableAccounts[0]?.id || '');

  // Keep selectedAccountId synced if accounts list changes
  React.useEffect(() => {
    if (tradeableAccounts.length > 0 && !selectedAccountId) {
      setSelectedAccountId(tradeableAccounts[0].id);
    }
  }, [accounts, tradeableAccounts, selectedAccountId]);

  const [orderError, setOrderError] = useState<string | null>(null);
  const [orderSuccess, setOrderSuccess] = useState<boolean>(false);

  // Sync selected symbol's current market price in forms
  const curTicker = tickers[selectedSymbol];
  
  const setPriceToLast = () => {
    if (curTicker) {
      setPrice(curTicker.lastPrice.toString());
    }
  };

  const handleSymbolClick = (sym: string) => {
    setSelectedSymbol(sym);
    const tick = tickers[sym];
    if (tick) {
      setPrice(tick.lastPrice.toString());
    }
  };

  const handleOrderSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setOrderError(null);
    setOrderSuccess(false);

    if (!selectedAccountId) {
      setOrderError('No active or paper trading account selected.');
      return;
    }

    if (parseFloat(quantity) <= 0 || isNaN(parseFloat(quantity))) {
      setOrderError('Please enter a valid positive quantity.');
      return;
    }

    if (orderType === 'LIMIT' && (parseFloat(price) <= 0 || isNaN(parseFloat(price)))) {
      setOrderError('Please enter a valid limit price.');
      return;
    }

    try {
      await onSubmitOrder({
        accountId: selectedAccountId,
        symbol: selectedSymbol,
        side,
        type: orderType,
        price: orderType === 'MARKET' ? (curTicker?.lastPrice.toString() || '0') : price,
        quantity: quantity
      });
      setOrderSuccess(true);
      setTimeout(() => setOrderSuccess(false), 3000);
    } catch (err: any) {
      setOrderError(err.message || 'Failed to place order.');
    }
  };

  // Quick close position route
  const handleClosePosition = async (pos: UnifiedPosition) => {
    const oppSide = pos.quantity > 0 ? 'SELL' : 'BUY';
    const cleanQty = Math.abs(pos.quantity).toString();
    try {
      await onSubmitOrder({
        accountId: pos.accountId,
        symbol: pos.symbol,
        side: oppSide,
        type: 'MARKET',
        price: '0', // market order ignores price
        quantity: cleanQty
      });
    } catch (err: any) {
      alert(`Close failed: ${err.message}`);
    }
  };

  // Dynamic portfolio aggregation
  const activeAccount = accounts.find(a => a.id === selectedAccountId);
  const totalUnrealizedPnl = positions.reduce((acc, pos) => {
    if (selectedAccountId && pos.accountId !== selectedAccountId) return acc;
    return acc + pos.unrealizedPnl;
  }, 0);

  return (
    <div className="space-y-4">
      {/* 1. TOP STATS HORIZONTAL BAR */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3">
        <div className="bg-[#111214] border border-[#2D2F31] rounded p-2.5 flex flex-col font-mono text-xs leading-tight">
          <span className="text-[#8E9299] uppercase text-[9px] mb-1">Active Trading Account</span>
          <select
            value={selectedAccountId}
            onChange={e => setSelectedAccountId(e.target.value)}
            className="bg-[#1A1C1E] border border-[#2D2F31] text-[11px] font-bold p-1 rounded outline-none focus:border-blue-500 cursor-pointer text-blue-500"
            id="select_terminal_trade_account"
          >
            {tradeableAccounts.length === 0 ? (
              <option value="">No trade venues connected</option>
            ) : (
              tradeableAccounts.map(acc => (
                <option key={acc.id} value={acc.id}>
                  {acc.name} ({acc.venue} - {acc.isPaper ? 'Paper' : 'Live'})
                </option>
              ))
            )}
          </select>
        </div>

        <div className="bg-[#111214] border border-[#2D2F31] rounded p-2.5 flex flex-col font-mono text-xs leading-tight">
          <span className="text-[#8E9299] uppercase text-[9px] mb-1">Account Portfolio Margin</span>
          <span className="text-[#D1D1D1] font-bold text-sm text-blue-500">
            {activeAccount && activeAccount.isPaper 
              ? `₹${activeAccount.balance.toLocaleString(undefined, { minimumFractionDigits: 2 })}` 
              : activeAccount ? 'API Portfolio Linked' : '—'}
          </span>
        </div>

        <div className="bg-[#111214] border border-[#2D2F31] rounded p-2.5 flex flex-col font-mono text-xs leading-tight">
          <span className="text-[#8E9299] uppercase text-[9px] mb-1">Overall Open Profits (Unrealized)</span>
          <span className={`font-bold text-sm flex items-center gap-1 ${totalUnrealizedPnl >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
            {totalUnrealizedPnl >= 0 ? '+' : ''}
            ₹{totalUnrealizedPnl.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            {totalUnrealizedPnl !== 0 && (
              totalUnrealizedPnl >= 0 ? <ArrowUpRight className="w-4.5 h-4.5" /> : <ArrowDownRight className="w-4.5 h-4.5" />
            )}
          </span>
        </div>

        <div className="bg-[#111214] border border-[#2D2F31] rounded p-2.5 flex flex-col font-mono text-xs leading-tight">
          <span className="text-[#8E9299] uppercase text-[9px] mb-1">Active Pipeline channels</span>
          <span className="text-white text-[11px] font-bold flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
            {accounts.filter(a => a.status === 'connected').length} connected venues
          </span>
        </div>

        <div className="bg-[#111214] border border-[#2D2F31] rounded p-2.5 hidden lg:flex flex-col font-mono text-xs leading-tight justify-center">
          <button
            onClick={onSweepTrigger}
            className="bg-amber-900/20 border border-amber-900/40 text-amber-500 text-[10px] font-bold hover:bg-amber-900/35 hover:text-white px-2 py-1.5 rounded transition-colors uppercase cursor-pointer text-center tracking-wider flex items-center justify-center gap-1.5"
            id="btn_manual_sweep_trigger"
            title="Schedules Indian brokers key validations sweep mock"
          >
            <Clock className="w-3.5 h-3.5" />
            Execute 3:00 AM Token Sweep
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* LEFT COLUMN: Tickers list and order execution pad */}
        <div className="lg:col-span-5 space-y-4">
          {/* Market Watch watchlist */}
          <div className="bg-[#111214] border border-[#2D2F31] rounded-lg p-3">
            <div className="flex items-center justify-between pb-2 border-b border-[#2D2F31]">
              <span className="text-[10px] font-bold font-mono tracking-wider text-[#8E9299] uppercase">VENUE WATCHLIST (TICKING)</span>
              <span className="text-[9px] text-[#5C5F63] uppercase font-mono">1s intervals</span>
            </div>

            <div className="mt-2 space-y-1 max-h-48 overflow-y-auto pr-1">
              {Object.keys(tickers).map(sym => {
                const item = tickers[sym];
                const isSelected = selectedSymbol === sym;
                const isPositive = item.change24h >= 0;
                return (
                  <button
                    key={sym}
                    onClick={() => handleSymbolClick(sym)}
                    className={`w-full flex items-center justify-between p-2 rounded text-left transition-colors cursor-pointer ${isSelected ? 'bg-blue-950/20 border border-blue-500/30' : 'border border-transparent hover:bg-[#1A1C1E]'}`}
                    id={`btn_symbol_select_${sym}`}
                  >
                    <div>
                      <div className="font-bold text-xs text-white font-mono tracking-tight">{sym}</div>
                      <div className="text-[9px] text-[#5C5F63] font-mono uppercase">
                        {sym.includes('USDT') ? 'Crypto / CCXT.pro' : 'Equity / Dhan Native Web API'}
                      </div>
                    </div>

                    <div className="text-right font-mono text-xs">
                      <div className="text-white font-bold">
                        {sym.includes('USDT') ? `$${item.lastPrice.toLocaleString()}` : `₹${item.lastPrice.toLocaleString()}`}
                      </div>
                      <div className={`text-[10px] flex items-center justify-end gap-0.5 ${isPositive ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {isPositive ? '+' : ''}{item.change24h}%
                        {isPositive ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Order Entry panel */}
          <div className="bg-[#111214] border border-[#2D2F31] rounded-lg p-4">
            <div className="flex justify-between items-center mb-3">
              <h3 className="text-xs font-bold font-mono tracking-wider text-white uppercase">UNIFIED DESK ORDER ENTRY</h3>
              <span className="text-[10px] font-mono bg-[#1A1C1E] text-blue-500 border border-[#2D2F31] rounded px-1.5 py-0.2">
                ACTIVE SYMBOL: <span className="font-bold text-white">{selectedSymbol}</span>
              </span>
            </div>

            <form onSubmit={handleOrderSubmit} className="space-y-3.5 text-xs text-[#D1D1D1]">
              {/* Buy Sell toggle */}
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setSide('BUY')}
                  className={`py-2 text-[11px] font-bold font-mono tracking-wider cursor-pointer rounded border text-center transition-all ${side === 'BUY' ? 'bg-emerald-950/80 text-emerald-400 border-emerald-500' : 'bg-[#1A1C1E]/50 border-[#2D2F31] hover:bg-[#1A1C1E]'}`}
                  id="btn_side_buy"
                >
                  BUY / LONG
                </button>
                <button
                  type="button"
                  onClick={() => setSide('SELL')}
                  className={`py-2 text-[11px] font-bold font-mono tracking-wider cursor-pointer rounded border text-center transition-all ${side === 'SELL' ? 'bg-rose-950/60 text-rose-450 border-rose-500' : 'bg-[#1A1C1E]/50 border-[#2D2F31] hover:bg-[#1A1C1E]'}`}
                  id="btn_side_sell"
                >
                  SELL / SHORT
                </button>
              </div>

              {/* Order Type Toggle */}
              <div className="flex items-center gap-1 bg-[#1A1C1E] p-1 rounded border border-[#2D2F31]">
                <button
                  type="button"
                  onClick={() => setOrderType('LIMIT')}
                  className={`flex-1 py-1 text-[10px] font-mono rounded cursor-pointer ${orderType === 'LIMIT' ? 'bg-[#2D2F31] text-white font-bold' : 'text-[#8E9299] hover:text-white'}`}
                  id="btn_ordertype_limit"
                >
                  LIMIT DESK PRICE
                </button>
                <button
                  type="button"
                  onClick={() => setOrderType('MARKET')}
                  className={`flex-1 py-1 text-[10px] font-mono rounded cursor-pointer ${orderType === 'MARKET' ? 'bg-[#2D2F31] text-white font-bold' : 'text-[#8E9299] hover:text-white'}`}
                  id="btn_ordertype_market"
                >
                  MARKET SLIPPAGE
                </button>
              </div>

              {/* Qty and Price Input Grid */}
              <div className="grid grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-[10px] uppercase font-bold text-[#8E9299] mb-1" htmlFor="input_trade_quantity">Quantity</label>
                  <input
                    id="input_trade_quantity"
                    type="number"
                    step="any"
                    value={quantity}
                    onChange={e => setQuantity(e.target.value)}
                    className="w-full bg-[#1A1C1E] border border-[#2D2F31] rounded px-2.5 py-1.5 font-mono text-[11px] text-white outline-none focus:border-blue-500"
                    placeholder="Enter absolute shares"
                    required
                  />
                  <div className="mt-1 flex gap-1 justify-between font-mono text-[9px] text-[#5C5F63]">
                    <button type="button" onClick={() => setQuantity('1')} className="hover:text-white">1x</button>
                    <button type="button" onClick={() => setQuantity('10')} className="hover:text-white">10x</button>
                    <button type="button" onClick={() => setQuantity('50')} className="hover:text-white">50x</button>
                    <button type="button" onClick={() => setQuantity('100')} className="hover:text-white font-semibold">100x</button>
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] uppercase font-bold text-[#8E9299] mb-1" htmlFor="input_trade_price">
                    {orderType === 'LIMIT' ? 'Limit Price' : 'Estimated Price'}
                  </label>
                  <div className="relative">
                    <input
                      id="input_trade_price"
                      type="number"
                      step="any"
                      disabled={orderType === 'MARKET'}
                      value={orderType === 'MARKET' ? (curTicker?.lastPrice || '') : price}
                      onChange={e => setPrice(e.target.value)}
                      className={`w-full bg-[#1A1C1E] border border-[#2D2F31] rounded px-2.5 py-1.5 font-mono text-[11px] outline-none text-white ${orderType === 'MARKET' ? 'text-[#5C5F63] bg-black/20 border-none select-none' : 'focus:border-blue-500'}`}
                      placeholder="Enter limit price"
                      required
                    />
                    {orderType === 'LIMIT' && (
                      <button
                        type="button"
                        onClick={setPriceToLast}
                        className="absolute right-1 text-[#8E9299] top-1 text-[9px] font-mono hover:text-white bg-[#1A1C1E] p-0.5 px-1 rounded border border-[#2D2F31]"
                      >
                        Last
                      </button>
                    )}
                  </div>
                  <div className="mt-1 flex gap-1.5 justify-between font-mono text-[9px] text-[#5C5F63]">
                    <span>Bid: {curTicker ? (selectedSymbol.includes('USDT') ? `$${curTicker.bid}` : `₹${curTicker.bid}`) : '—'}</span>
                    <span>Ask: {curTicker ? (selectedSymbol.includes('USDT') ? `$${curTicker.ask}` : `₹${curTicker.ask}`) : '—'}</span>
                  </div>
                </div>
              </div>

              {/* Transaction Cost Math */}
              <div className="p-2 py-2 px-2.5 bg-[#1A1C1E] border border-[#2D2F31] rounded font-mono text-[10px] space-y-1 text-[#8E9299]">
                <div className="flex justify-between">
                  <span>Gross Value:</span>
                  <span className="text-white font-medium">
                    {selectedSymbol.includes('USDT') ? '$' : '₹'}
                    {((parseFloat(quantity) || 0) * (orderType === 'LIMIT' ? (parseFloat(price) || 0) : (curTicker?.lastPrice || 0))).toLocaleString(undefined, { maximumFractionDigits: 2 })}
                  </span>
                </div>
                <div className="flex justify-between text-[9px] text-[#5C5F63]">
                  <span>Adapter Slip Charge / CCXT comms:</span>
                  <span>0.02% (₹0.00 estimated)</span>
                </div>
              </div>

              {/* Status notifications */}
              {orderError && (
                <div className="p-2.5 rounded bg-rose-950/20 border border-rose-900/60 text-[10px] text-rose-400 flex items-start gap-1.5 font-mono">
                  <ShieldAlert className="w-4 h-4 shrink-0" />
                  <span>{orderError}</span>
                </div>
              )}

              {orderSuccess && (
                <div className="p-2 py-2 px-2.5 rounded bg-emerald-950/20 border border-emerald-900/50 text-[10px] text-emerald-400 flex items-start gap-1.5 font-mono">
                  <ArrowUpRight className="w-4 h-4 shrink-0 animate-bounce" />
                  <span>Order routed successfully! Check state transition history.</span>
                </div>
              )}

              <button
                type="submit"
                className={`w-full py-2.5 cursor-pointer font-bold font-mono tracking-wider text-center text-xs text-white rounded transition-colors shadow-lg ${side === 'BUY' ? 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-900/10' : 'bg-rose-600 hover:bg-rose-500 shadow-rose-900/10'}`}
                id="btn_transmit_desk_order"
              >
                TRANSMIT {side} ORDER ({selectedSymbol})
              </button>
            </form>
          </div>
        </div>

        {/* RIGHT COLUMN: Active Positions and order book blocks */}
        <div className="lg:col-span-7 space-y-4">
          {/* Active holdings and Positions table */}
          <div className="bg-[#111214] border border-[#2D2F31] rounded-lg p-3">
            <h3 className="text-xs font-bold font-mono tracking-wider text-white uppercase mb-2">LIVE OPEN POSITIONS & EXPOSURE</h3>
            
            <div className="overflow-x-auto">
              <table className="w-full text-left font-mono text-[11px] leading-relaxed border-collapse">
                <thead>
                  <tr className="border-b border-[#2D2F31] text-[#5C5F63] text-[9px] uppercase tracking-wider pb-1">
                    <th className="pb-1.5">Venue/Acc</th>
                    <th className="pb-1.5">Instrument</th>
                    <th className="pb-1.5">Qty / Size</th>
                    <th className="pb-1.5">Average Entry</th>
                    <th className="pb-1.5">Live Valuation</th>
                    <th className="pb-1.5 text-right">Unrealized P&L</th>
                    <th className="pb-1.5 text-center">Desk Cmd</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#2D2F31]/30">
                  {positions.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="text-center py-6 text-[#5C5F63] text-xs">
                        No active open positions tracked in SQL portfolio database.
                      </td>
                    </tr>
                  ) : (
                    positions.map(pos => {
                      const isLong = pos.quantity >= 0;
                      const accountName = accounts.find(a => a.id === pos.accountId)?.name || 'Account';
                      const pnlIsPositive = pos.unrealizedPnl >= 0;
                      return (
                        <tr key={pos.id} className="hover:bg-[#1A1C1E]/30">
                          <td className="py-2">
                            <div className="font-semibold text-[#D1D1D1] truncate max-w-[80px]" title={accountName}>{accountName}</div>
                            <span className="text-[8px] text-blue-500 uppercase">{pos.venue}</span>
                          </td>
                          <td className="py-2 text-white font-bold">{pos.symbol}</td>
                          <td className="py-2">
                            <span className={`font-semibold ${isLong ? 'text-emerald-400' : 'text-rose-400'}`}>
                              {isLong ? '+' : ''}{pos.quantity}
                            </span>
                          </td>
                          <td className="py-2 text-[#8E9299]">
                            {pos.symbol.includes('USDT') ? `$${pos.averagePrice.toLocaleString()}` : `₹${pos.averagePrice.toLocaleString()}`}
                          </td>
                          <td className="py-2 text-white font-semibold h-5">
                            {pos.symbol.includes('USDT') ? `$${pos.currentPrice?.toLocaleString() || pos.averagePrice}` : `₹${pos.currentPrice?.toLocaleString() || pos.averagePrice}`}
                          </td>
                          <td className={`py-2 text-right font-bold ${pnlIsPositive ? 'text-emerald-400' : 'text-rose-400'}`}>
                            {pnlIsPositive ? '+' : ''}₹{pos.unrealizedPnl.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                          </td>
                          <td className="py-2 text-center">
                            <button
                              onClick={() => handleClosePosition(pos)}
                              className="px-2 py-0.5 border border-rose-900/50 bg-rose-900/10 text-rose-450 text-[9px] rounded font-mono font-bold hover:bg-rose-900/40 hover:text-white tracking-tight cursor-pointer"
                              title="Instantly execute counter-order to exit position"
                            >
                              Exit Market
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Unified Order logs history */}
          <div className="bg-[#111214] border border-[#2D2F31] rounded-lg p-3">
            <h3 className="text-xs font-bold font-mono tracking-wider text-white uppercase mb-2">UNIFIED ORDER REGISTRY</h3>
            
            <div className="overflow-x-auto max-h-56 overflow-y-auto">
              <table className="w-full text-left font-mono text-[11px] leading-relaxed border-collapse">
                <thead>
                  <tr className="border-b border-[#2D2F31] text-[#5C5F63] text-[9px] uppercase tracking-wider pb-1">
                    <th className="pb-1.5">Timestamp</th>
                    <th className="pb-1.5">Action</th>
                    <th className="pb-1.5">Symbol</th>
                    <th className="pb-1.5 text-right">Price</th>
                    <th className="pb-1.5 text-right">Quantity</th>
                    <th className="pb-1.5 text-center">Status</th>
                    <th className="pb-1.5 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#2D2F31]/30">
                  {orders.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="text-center py-6 text-[#5C5F63] text-xs">
                        No orders registered in system sqlite logs.
                      </td>
                    </tr>
                  ) : (
                    orders.map(ord => {
                      const date = new Date(ord.timestamp).toLocaleTimeString();
                      const isPending = ord.status === 'PENDING';
                      return (
                        <tr key={ord.id} className="hover:bg-[#1A1C1E]/30">
                          <td className="py-2 text-[#8E9299]">{date}</td>
                          <td className="py-2">
                            <span className={`font-semibold text-[9px] px-1 rounded-sm uppercase ${ord.side === 'BUY' ? 'bg-emerald-950/60 text-emerald-400' : 'bg-rose-950/60 text-rose-450'}`}>
                              {ord.side}
                            </span>
                          </td>
                          <td className="py-2 text-white font-bold">{ord.symbol}</td>
                          <td className="py-2 text-right text-[#D1D1D1]">
                            {ord.symbol.includes('USDT') ? `$${ord.price.toLocaleString()}` : `₹${ord.price.toLocaleString()}`}
                          </td>
                          <td className="py-2 text-right text-white font-semibold">{ord.quantity}</td>
                          <td className="py-2 text-center">
                            <span className={`px-1.5 py-0.2 rounded text-[9px] font-bold tracking-tight uppercase ${
                              ord.status === 'FILLED' ? 'bg-emerald-950 text-emerald-400 border border-emerald-900/55' :
                              ord.status === 'PENDING' ? 'bg-amber-950 text-amber-500 border border-amber-900/55 pulse-slow' :
                              'bg-slate-900 text-slate-400 border border-slate-700'
                            }`}>
                              {ord.status}
                            </span>
                          </td>
                          <td className="py-2 text-right">
                            {isPending ? (
                              <button
                                onClick={() => onCancelOrder(ord.id)}
                                className="text-[9px] cursor-pointer text-amber-400 font-bold border border-amber-900/50 bg-amber-950/20 px-1.5 py-0.5 rounded hover:bg-amber-900/50 hover:text-white"
                              >
                                Cancel Order
                              </button>
                            ) : (
                              <span className="text-[9px] text-[#5C5F63] font-mono">—</span>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
