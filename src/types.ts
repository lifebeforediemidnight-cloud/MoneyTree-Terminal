/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type VenueType = 'equity' | 'crypto';

export type VenueName = 'dhan' | 'zerodha' | 'binance' | 'coinbase' | 'custom_equity' | 'custom_crypto';

export interface Account {
  id: string;
  name: string;
  venue: VenueName;
  type: VenueType;
  isPaper: boolean;
  balance: number; // default 1,000,000 for paper trading portfolios
  status: 'connected' | 'disconnected';
  error: string | null;
  credentials: Record<string, string>; // Masked on frontend, raw is stored encrypted on backend
  createdAt: string;
}

export interface UnifiedOrder {
  id: string;
  accountId: string;
  venue: VenueName;
  symbol: string;
  side: 'BUY' | 'SELL';
  type: 'LIMIT' | 'MARKET';
  price: number;
  quantity: number;
  status: 'PENDING' | 'FILLED' | 'CANCELLED' | 'REJECTED';
  timestamp: string;
}

export interface UnifiedPosition {
  id: string;
  accountId: string;
  venue: VenueName;
  symbol: string;
  quantity: number;
  averagePrice: number;
  currentPrice: number;
  unrealizedPnl: number;
}

export interface LogMessage {
  id: string;
  timestamp: string;
  level: 'info' | 'warn' | 'error' | 'success' | 'system';
  source: 'terminal' | 'dhan_ws' | 'ccxt_daemon' | 'token_sweep' | 'db' | 'vault';
  message: string;
}

export interface MarketTicker {
  symbol: string;
  lastPrice: number;
  change24h: number;
  bid: number;
  ask: number;
  volume: number;
  high: number;
  low: number;
  history: { time: string; price: number }[];
}

export interface PluggableAdapter {
  id: string;
  name: string;
  type: VenueType;
  fields: Array<{
    key: string;
    label: string;
    type: 'text' | 'password';
    placeholder?: string;
  }>;
}
