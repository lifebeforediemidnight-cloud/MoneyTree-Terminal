/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { MarketTicker } from '../types';
import { Activity, CandlestickChart, Info, ZoomIn, ZoomOut } from 'lucide-react';

interface TradingChartProps {
  selectedSymbol: string;
  ticker: MarketTicker;
}

export default function TradingChart({ selectedSymbol, ticker }: TradingChartProps) {
  const [timeframe, setTimeframe] = useState<'1m' | '5m' | '1h'>('5m');
  const [showTechnicalGrid, setShowTechnicalGrid] = useState(true);

  if (!ticker || !ticker.history || ticker.history.length === 0) {
    return (
      <div className="bg-[#111214] border border-[#2D2F31] rounded-lg h-96 flex flex-col items-center justify-center p-8 text-slate-500">
        <CandlestickChart className="w-8 h-8 text-[#5C5F63] animate-pulse mb-2" />
        <span className="text-xs font-mono text-[#8E9299]">Connecting pipeline chart feed...</span>
      </div>
    );
  }

  // Build simulated candlestick frames out of sequential price walk history
  const chartHeight = 240;
  const chartWidth = 500;
  
  const prices = ticker.history.map(h => h.price);
  const minPrice = Math.min(...prices) * 0.9995;
  const maxPrice = Math.max(...prices) * 1.0005;
  const priceRange = maxPrice - minPrice;

  // Render SVG points
  const points = ticker.history.map((h, idx) => {
    const x = 30 + (idx * (chartWidth - 50) / (ticker.history.length - 1));
    const y = chartHeight - 20 - ((h.price - minPrice) * (chartHeight - 40) / priceRange);
    return { x, y, price: h.price, time: h.time };
  });

  // Compile sequential candlesticks (high, low, open, close)
  const candles = points.map((p, idx) => {
    const prevY = idx > 0 ? points[idx - 1].y : p.y;
    const bodyHeight = Math.max(3, Math.abs(p.y - prevY));
    const openY = prevY;
    const closeY = p.y;
    const isBullish = closeY <= openY; // SVG coordinates are inverted (y = 0 at top)
    const wickHigh = p.y - (Math.random() * 8);
    const wickLow = p.y + (Math.random() * 8);

    return {
      x: p.x,
      openY,
      closeY,
      wickHigh,
      wickLow,
      bodyHeight,
      isBullish,
      price: p.price,
      time: p.time
    };
  });

  return (
    <div className="bg-[#111214] rounded-lg border border-[#2D2F31] p-4 flex flex-col h-full select-none">
      {/* Chart Toolbar */}
      <div className="flex items-center justify-between pb-3 border-b border-[#2D2F31] mb-3 text-xs">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 font-mono">
            <CandlestickChart className="w-4 h-4 text-emerald-400" />
            <span className="font-bold text-white uppercase tracking-tight">{selectedSymbol} INTERACTIVE DESK</span>
          </div>

          <div className="hidden sm:flex p-0.5 bg-[#1A1C1E] border border-[#2D2F31] rounded text-[10px] font-mono leading-none">
            {['1m', '5m', '15m', '1h', '1D'].map(tf => (
              <button
                key={tf}
                onClick={() => setTimeframe(tf as any)}
                className={`px-1.5 py-1 rounded-sm cursor-pointer ${timeframe === tf ? 'bg-blue-600 text-white font-bold' : 'text-[#8E9299] hover:text-white'}`}
                id={`btn_chart_tf_${tf}`}
              >
                {tf}
              </button>
            ))}
          </div>
        </div>

        {/* Real-time Indicator badging */}
        <div className="flex items-center gap-4 text-[10px] font-mono">
          <div className="hidden md:flex gap-3 text-[#8E9299]">
            <span>O: <span className="text-slate-350">{(ticker.lastPrice * 0.998).toFixed(2)}</span></span>
            <span>H: <span className="text-emerald-400">{ticker.high?.toFixed(2) || (ticker.lastPrice * 1.005).toFixed(2)}</span></span>
            <span>L: <span className="text-rose-450">{ticker.low?.toFixed(2) || (ticker.lastPrice * 0.995).toFixed(2)}</span></span>
            <span>C: <span className="text-white font-bold">{ticker.lastPrice.toFixed(2)}</span></span>
          </div>

          <button
            onClick={() => setShowTechnicalGrid(!showTechnicalGrid)}
            className={`px-2 py-0.5 rounded text-[10px] font-mono cursor-pointer border ${showTechnicalGrid ? 'bg-blue-950/20 border-blue-500/35 text-blue-500' : 'bg-[#1A1C1E] border-[#2D2F31] text-[#8E9299]'}`}
            id="btn_chart_toggle_grid"
          >
            GRID: {showTechnicalGrid ? 'ON' : 'OFF'}
          </button>
        </div>
      </div>

      {/* SVG Canvas Frame */}
      <div className="relative flex-1 bg-[#1A1C1E] border border-[#2D2F31] rounded overflow-hidden p-2 flex flex-col justify-between">
        {/* Market pricing overlay watermarks */}
        <div className="absolute top-3 left-4 text-[#2D2F31] font-mono pointer-events-none select-none z-0">
          <div className="text-3xl font-extrabold tracking-wider">{selectedSymbol}</div>
          <div className="text-[11px] font-semibold mt-1">NATIVE GATEWAY DIRECT STREAM</div>
        </div>

        {/* Dynamic coordinate readout */}
        <div className="absolute top-3 right-4 bg-[#111214]/80 border border-[#2D2F31] text-[9px] font-mono p-1 px-1.5 rounded z-1 text-slate-450 pointer-events-none">
          Live feed: <span className="text-emerald-400 font-semibold animate-pulse">● Connected</span>
        </div>

        {/* High-fidelity SVG chart rendering */}
        <div className="w-full flex-1 min-h-[220px]">
          <svg 
            viewBox={`0 0 ${chartWidth} ${chartHeight}`} 
            className="w-full h-full text-[#2D2F31] select-none z-10 relative"
            preserveAspectRatio="none"
          >
            {/* Technical gridlines */}
            {showTechnicalGrid && (
              <>
                <line x1="0" y1={chartHeight * 0.2} x2={chartWidth} y2={chartHeight * 0.2} stroke="#2D2F31" strokeDasharray="3 3" />
                <line x1="0" y1={chartHeight * 0.4} x2={chartWidth} y2={chartHeight * 0.4} stroke="#2D2F31" strokeDasharray="3 3" />
                <line x1="0" y1={chartHeight * 0.6} x2={chartWidth} y2={chartHeight * 0.6} stroke="#2D2F31" strokeDasharray="3 3" />
                <line x1="0" y1={chartHeight * 0.8} x2={chartWidth} y2={chartHeight * 0.8} stroke="#2D2F31" strokeDasharray="3 3" />
                
                {/* Horizontal reference lines */}
                <line x1={chartWidth * 0.25} y1="0" x2={chartWidth * 0.25} y2={chartHeight} stroke="#2D2F31" strokeDasharray="3 3" />
                <line x1={chartWidth * 0.5} y1="0" x2={chartWidth * 0.5} y2={chartHeight} stroke="#2D2F31" strokeDasharray="3 3" />
                <line x1={chartWidth * 0.75} y1="0" x2={chartWidth * 0.75} y2={chartHeight} stroke="#2D2F31" strokeDasharray="3 3" />
              </>
            )}

            {/* Price axis labels */}
            <text x={chartWidth - 5} y={chartHeight * 0.2} fill="#8E9299" fontSize="9" className="font-mono" textAnchor="end">
              {selectedSymbol.includes('USDT') ? '$' : '₹'}{(maxPrice - priceRange * 0.2).toLocaleString(undefined, { maximumFractionDigits: 1 })}
            </text>
            <text x={chartWidth - 5} y={chartHeight * 0.5} fill="#8E9299" fontSize="9" className="font-mono" textAnchor="end">
              {selectedSymbol.includes('USDT') ? '$' : '₹'}{(maxPrice - priceRange * 0.5).toLocaleString(undefined, { maximumFractionDigits: 1 })}
            </text>
            <text x={chartWidth - 5} y={chartHeight * 0.8} fill="#8E9299" fontSize="9" className="font-mono" textAnchor="end">
              {selectedSymbol.includes('USDT') ? '$' : '₹'}{(maxPrice - priceRange * 0.8).toLocaleString(undefined, { maximumFractionDigits: 1 })}
            </text>

            {/* Gradient background shade line chart path */}
            <path
              d={`M ${points[0].x} ${chartHeight - 20} ${points.map(p => `L ${p.x} ${p.y}`).join(' ')} L ${points[points.length - 1].x} ${chartHeight - 20} Z`}
              fill="url(#grad_chart)"
              opacity="0.12"
            />
            {/* Direct Line path connect */}
            <path
              d={points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ')}
              fill="none"
              stroke="#2563eb"
              strokeWidth="1"
              strokeOpacity="0.4"
            />

            {/* Gradient Shader model definition */}
            <defs>
              <linearGradient id="grad_chart" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#3b82f6" />
                <stop offset="100%" stopColor="#3b82f6" stopOpacity="0" />
              </linearGradient>
            </defs>

            {/* Draw Candlesticks blocks & wicks */}
            {candles.map((candle, idx) => {
              const candleWidth = Math.max(3, Math.min(10, (chartWidth / candles.length) * 0.5));
              const xPos = candle.x - candleWidth / 2;
              const color = candle.isBullish ? '#34d399' : '#f87171'; // bullish emerald, bearish rose

              return (
                <g key={idx}>
                  {/* Wick (high - low) */}
                  <line
                    x1={candle.x}
                    y1={candle.wickHigh}
                    x2={candle.x}
                    y2={candle.wickLow}
                    stroke={color}
                    strokeWidth="1"
                  />
                  {/* Candlestick Body */}
                  <rect
                    x={xPos}
                    y={Math.min(candle.openY, candle.closeY)}
                    width={candleWidth}
                    height={candle.bodyHeight}
                    fill={color}
                  />
                </g>
              );
            })}
          </svg>
        </div>

        {/* X-axis time ticker markers */}
        <div className="flex justify-between px-7 pt-1 pb-1 text-[9px] font-mono text-[#8E9299] border-t border-[#2D2F31] z-10 bg-[#1A1C1E]">
          {ticker.history.filter((_, i) => i % 4 === 0).map((h, i) => (
            <span key={i}>{h.time}</span>
          ))}
        </div>
      </div>

      {/* Dynamic Order book stream simulation mock */}
      <div className="mt-3.5 grid grid-cols-2 gap-3.5 text-[10px] font-mono leading-none">
        <div>
          <div className="text-emerald-400 font-bold mb-1.5 flex items-center gap-1 uppercase tracking-wider">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            Bid depth book (Longs Queue)
          </div>
          <div className="space-y-1 font-mono text-[10px] text-slate-400">
            <div className="flex justify-between">
              <span>{(ticker.lastPrice * 0.999).toFixed(1)}</span>
              <span className="text-slate-500 font-bold">14,290 qty</span>
            </div>
            <div className="flex justify-between">
              <span>{(ticker.lastPrice * 0.998).toFixed(1)}</span>
              <span className="text-slate-500 font-bold">38,100 qty</span>
            </div>
            <div className="flex justify-between">
              <span>{(ticker.lastPrice * 0.997).toFixed(1)}</span>
              <span className="text-slate-500">12,490 qty</span>
            </div>
          </div>
        </div>

        <div>
          <div className="text-rose-400 font-bold mb-1.5 flex items-center gap-1 uppercase tracking-wider">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-450 bg-rose-500" />
            Ask depth book (Shorts Queue)
          </div>
          <div className="space-y-1 font-mono text-[10px] text-slate-400">
            <div className="flex justify-between">
              <span>{(ticker.lastPrice * 1.001).toFixed(1)}</span>
              <span className="text-slate-500 font-bold">22,400 qty</span>
            </div>
            <div className="flex justify-between">
              <span>{(ticker.lastPrice * 1.002).toFixed(1)}</span>
              <span className="text-slate-500 font-bold">41,200 qty</span>
            </div>
            <div className="flex justify-between">
              <span>{(ticker.lastPrice * 1.003).toFixed(1)}</span>
              <span className="text-slate-500">9,810 qty</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
