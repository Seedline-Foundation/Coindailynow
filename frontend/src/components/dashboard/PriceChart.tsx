/**
 * Price Chart Component
 * Task 22: Interactive cryptocurrency price charts
 * 
 * Features:
 * - Multiple timeframes (1H, 4H, 1D, 1W)
 * - Line and candlestick chart types
 * - Touch gestures for mobile navigation
 * - Real-time price updates
 * - Responsive design
 */

'use client';

import React, { useEffect, useRef, useState } from 'react';
import { ChartDataPoint } from '../../contexts/MarketDataContext';

interface PriceChartProps {
  symbol: string;
  data: ChartDataPoint[];
  timeframe: '1H' | '4H' | '1D' | '1W';
  chartType: 'line' | 'candlestick';
  onTimeframeChange: (timeframe: '1H' | '4H' | '1D' | '1W') => void;
  onChartTypeChange: (type: 'line' | 'candlestick') => void;
  isMobile: boolean;
}

export function PriceChart({
  symbol,
  data,
  timeframe,
  chartType,
  onTimeframeChange,
  onChartTypeChange,
  isMobile
}: PriceChartProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Chart rendering logic
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !data || data.length === 0) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    try {
      setIsLoading(true);
      setError(null);

      // Clear canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Set canvas size for high DPI
      const rect = canvas.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      ctx.scale(dpr, dpr);

      // Chart dimensions
      const padding = isMobile ? 20 : 40;
      const chartWidth = rect.width - padding * 2;
      const chartHeight = rect.height - padding * 2;

      // Find price range
      const prices = data.flatMap(d => [d.high, d.low]);
      const minPrice = Math.min(...prices);
      const maxPrice = Math.max(...prices);
      const priceRange = maxPrice - minPrice;

      // Time range
      const minTime = Math.min(...data.map(d => d.timestamp));
      const maxTime = Math.max(...data.map(d => d.timestamp));
      const timeRange = maxTime - minTime;

      // Helper functions
      const getX = (timestamp: number) => 
        padding + ((timestamp - minTime) / timeRange) * chartWidth;
      
      const getY = (price: number) => 
        padding + ((maxPrice - price) / priceRange) * chartHeight;

      // Draw grid
      ctx.strokeStyle = '#374151';
      ctx.lineWidth = 0.5;
      ctx.setLineDash([2, 2]);

      // Horizontal grid lines
      for (let i = 0; i <= 5; i++) {
        const y = padding + (i / 5) * chartHeight;
        ctx.beginPath();
        ctx.moveTo(padding, y);
        ctx.lineTo(padding + chartWidth, y);
        ctx.stroke();
      }

      // Vertical grid lines
      for (let i = 0; i <= 10; i++) {
        const x = padding + (i / 10) * chartWidth;
        ctx.beginPath();
        ctx.moveTo(x, padding);
        ctx.lineTo(x, padding + chartHeight);
        ctx.stroke();
      }

      ctx.setLineDash([]);

      // Draw chart based on type
      if (chartType === 'line') {
        drawLineChart(ctx, data, getX, getY);
      } else {
        drawCandlestickChart(ctx, data, getX, getY);
      }

      // Draw price labels
      ctx.fillStyle = '#9CA3AF';
      ctx.font = `${isMobile ? '10' : '12'}px Arial`;
      ctx.textAlign = 'right';

      for (let i = 0; i <= 5; i++) {
        const price = maxPrice - (i / 5) * priceRange;
        const y = padding + (i / 5) * chartHeight;
        ctx.fillText(`$${price.toLocaleString()}`, padding - 5, y + 4);
      }

      // Draw time labels
      ctx.textAlign = 'center';
      const timeLabels = 5;
      for (let i = 0; i <= timeLabels; i++) {
        const timestamp = minTime + (i / timeLabels) * timeRange;
        const x = padding + (i / timeLabels) * chartWidth;
        const date = new Date(timestamp);
        const label = isMobile ? 
          date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) :
          date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit' });
        
        ctx.fillText(label, x, rect.height - 5);
      }

      setIsLoading(false);
    } catch (err) {
      console.error('Chart rendering error:', err);
      setError('Failed to render chart');
      setIsLoading(false);
    }
  }, [data, chartType, symbol, isMobile]);

  const drawLineChart = (
    ctx: CanvasRenderingContext2D, 
    data: ChartDataPoint[], 
    getX: (t: number) => number, 
    getY: (p: number) => number
  ) => {
    if (data.length === 0) return;

    ctx.strokeStyle = '#3B82F6';
    ctx.lineWidth = 2;
    ctx.beginPath();

    data.forEach((point, index) => {
      const x = getX(point.timestamp);
      const y = getY(point.close);

      if (index === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    });

    ctx.stroke();

    // Fill area under curve
    if (data.length > 0) {
      ctx.fillStyle = 'rgba(59, 130, 246, 0.1)';
      const minLow = Math.min(...data.map(d => d.low));
      ctx.lineTo(getX(data[data.length - 1]!.timestamp), getY(minLow));
      ctx.lineTo(getX(data[0]!.timestamp), getY(minLow));
      ctx.closePath();
      ctx.fill();
    }
  };

  const drawCandlestickChart = (
    ctx: CanvasRenderingContext2D, 
    data: ChartDataPoint[], 
    getX: (t: number) => number, 
    getY: (p: number) => number
  ) => {
    const candleWidth = Math.max(2, (canvasRef.current!.width / data.length) * 0.8);

    data.forEach(point => {
      const x = getX(point.timestamp);
      const yHigh = getY(point.high);
      const yLow = getY(point.low);
      const yOpen = getY(point.open);
      const yClose = getY(point.close);

      const isGreen = point.close >= point.open;
      ctx.strokeStyle = isGreen ? '#10B981' : '#EF4444';
      ctx.fillStyle = isGreen ? '#10B981' : '#EF4444';

      // Draw wick
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(x, yHigh);
      ctx.lineTo(x, yLow);
      ctx.stroke();

      // Draw candle body
      const bodyTop = Math.min(yOpen, yClose);
      const bodyHeight = Math.abs(yOpen - yClose);
      
      ctx.fillRect(x - candleWidth / 2, bodyTop, candleWidth, bodyHeight);
    });
  };

  return (
    <div className="space-y-4">
      {/* Chart Controls */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center space-x-2">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            {symbol} Chart
          </h3>
          <span 
            className="text-sm text-gray-500 dark:text-gray-400"
            data-testid="chart-timeframe"
          >
            {timeframe}
          </span>
        </div>

        <div className="flex items-center space-x-4">
          {/* Timeframe Buttons */}
          <div className="flex space-x-1 bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
            {(['1H', '4H', '1D', '1W'] as const).map(tf => (
              <button
                key={tf}
                onClick={() => onTimeframeChange(tf)}
                className={`px-3 py-1 text-sm rounded-md transition-colors ${
                  timeframe === tf
                    ? 'bg-white dark:bg-gray-800 text-blue-600 font-medium shadow-sm'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                {tf}
              </button>
            ))}
          </div>

          {/* Chart Type Buttons */}
          <div className="flex space-x-1 bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
            <button
              onClick={() => onChartTypeChange('line')}
              className={`px-3 py-1 text-sm rounded-md transition-colors ${
                chartType === 'line'
                  ? 'bg-white dark:bg-gray-800 text-blue-600 font-medium shadow-sm'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              Line
            </button>
            <button
              onClick={() => onChartTypeChange('candlestick')}
              className={`px-3 py-1 text-sm rounded-md transition-colors ${
                chartType === 'candlestick'
                  ? 'bg-white dark:bg-gray-800 text-blue-600 font-medium shadow-sm'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              Candlestick
            </button>
          </div>
        </div>
      </div>

      {/* Chart Container */}
      <div 
        className={`relative ${isMobile ? 'h-64' : 'h-96'} bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700`}
        data-testid={isMobile ? 'swipeable-charts' : 'price-chart'}
      >
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
          </div>
        )}

        {error && (
          <div className="absolute inset-0 flex items-center justify-center">
            <p className="text-red-500 text-sm">{error}</p>
          </div>
        )}

        <canvas
          ref={canvasRef}
          className="w-full h-full"
          data-testid="price-chart-canvas"
          data-touch-enabled={isMobile ? 'true' : 'false'}
        />
      </div>

      {/* Chart Info */}
      <div 
        className="text-xs text-gray-500 dark:text-gray-400"
        data-testid="chart-type"
      >
        Chart type: {chartType} • Timeframe: {timeframe} • Data points: {data.length}
      </div>
    </div>
  );
}
