'use client';

import React, { useState } from 'react';
import { SparklesIcon } from '@heroicons/react/24/outline';

interface NarrativeNode {
  id: string;
  label: string;
  x: number;
  y: number;
  radius: number;
  weight: string;
  connections: string[];
  description: string;
}

const initialNodes: NarrativeNode[] = [
  { id: 'n1', label: 'Stablecoin Hedging', x: 180, y: 120, radius: 24, weight: 'High', connections: ['n2', 'n4', 'n5'], description: 'Users shifting local currencies into USDT and USDC due to FX inflation pressure.' },
  { id: 'n2', label: 'Cross-Border Rails', x: 380, y: 100, radius: 18, weight: 'Medium', connections: ['n1', 'n3'], description: 'Fintech portals employing crypto networks to facilitate cheaper remittances.' },
  { id: 'n3', label: 'Mobile Money Integration', x: 480, y: 220, radius: 20, weight: 'High', connections: ['n2', 'n5'], description: 'Direct on/off-ramp interfaces between stablecoins and regional mobile wallets.' },
  { id: 'n4', label: 'Regulatory ARIP Frameworks', x: 80, y: 220, radius: 16, weight: 'Low', connections: ['n1', 'n5'], description: 'Regulatory licensing processes like Nigeria SEC ARIP and SA FSCA licenses.' },
  { id: 'n5', label: 'Local Exchange Liquidity', x: 260, y: 240, radius: 22, weight: 'High', connections: ['n1', 'n3', 'n4'], description: 'Liquidity shifts, P2P transaction indices, and regional arbitrage premiums.' },
];

export default function NarrativeGalaxyPreview() {
  const [selectedNode, setSelectedNode] = useState<NarrativeNode | null>(initialNodes[0]);
  const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null);

  return (
    <div className="bg-gradient-to-b from-slate-900 to-slate-950 border border-slate-800 rounded-2xl p-5 shadow-soft mb-8 text-white relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,rgba(249,115,22,0.05),transparent_60%)] pointer-events-none" />
      
      <div className="flex items-center justify-between mb-4 relative z-10">
        <div className="flex items-center gap-2">
          <SparklesIcon className="w-5 h-5 text-amber-500 animate-pulse" />
          <div>
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-300">
              Narrative Relationship Galaxy
            </h2>
            <p className="text-[10px] text-slate-500">
              Interactive node graph mapping interconnected news themes
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 relative z-10 items-center">
        {/* Node Graph Box */}
        <div className="lg:col-span-2 bg-slate-950/60 rounded-xl border border-slate-850 p-2 relative h-64 sm:h-72">
          <svg className="w-full h-full" viewBox="0 0 560 320" style={{ touchAction: 'none' }}>
            {/* Draw connections */}
            {initialNodes.map((node) =>
              node.connections.map((targetId) => {
                const target = initialNodes.find((n) => n.id === targetId);
                if (!target) return null;
                const isHighlighted = 
                  selectedNode?.id === node.id || 
                  selectedNode?.id === target.id ||
                  hoveredNodeId === node.id ||
                  hoveredNodeId === target.id;

                return (
                  <line
                    key={`${node.id}-${targetId}`}
                    x1={node.x}
                    y1={node.y}
                    x2={target.x}
                    y2={target.y}
                    stroke={isHighlighted ? '#f97316' : '#334155'}
                    strokeWidth={isHighlighted ? 1.5 : 0.8}
                    strokeDasharray={isHighlighted ? '0' : '4 4'}
                    className="transition-all duration-300"
                  />
                );
              })
            )}

            {/* Draw nodes */}
            {initialNodes.map((node) => {
              const isSelected = selectedNode?.id === node.id;
              const isHovered = hoveredNodeId === node.id;
              
              return (
                <g
                  key={node.id}
                  className="cursor-pointer group"
                  onClick={() => setSelectedNode(node)}
                  onMouseEnter={() => setHoveredNodeId(node.id)}
                  onMouseLeave={() => setHoveredNodeId(null)}
                >
                  {/* Outer Glow */}
                  {(isSelected || isHovered) && (
                    <circle
                      cx={node.x}
                      cy={node.y}
                      r={node.radius + 6}
                      fill="none"
                      stroke="#f97316"
                      strokeWidth={1}
                      strokeOpacity={0.5}
                      className="animate-pulse"
                    />
                  )}
                  {/* Main Circle */}
                  <circle
                    cx={node.x}
                    cy={node.y}
                    r={node.radius}
                    fill={isSelected ? '#ea580c' : '#1e293b'}
                    stroke={isSelected ? '#f97316' : '#475569'}
                    strokeWidth={isSelected ? 2 : 1}
                    className="transition-colors duration-300"
                  />
                  {/* Node Label Text */}
                  <text
                    x={node.x}
                    y={node.y + 4}
                    textAnchor="middle"
                    fill="white"
                    fontSize="9px"
                    fontWeight="bold"
                    pointerEvents="none"
                    className="select-none"
                  >
                    {node.label.split(' ')[0]}
                  </text>
                </g>
              );
            })}
          </svg>
        </div>

        {/* Detailed node panel */}
        <div className="bg-slate-900/90 rounded-xl border border-slate-800 p-4 h-full flex flex-col justify-between min-h-[220px]">
          {selectedNode ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <h3 className="text-sm font-bold text-white leading-tight">
                  {selectedNode.label}
                </h3>
                <span className="text-[9px] bg-slate-800 text-amber-400 px-2 py-0.5 rounded font-bold uppercase">
                  {selectedNode.weight} Impact
                </span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed font-sans">
                {selectedNode.description}
              </p>
              <div className="space-y-1">
                <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider block">
                  Connected Themes:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {selectedNode.connections.map((connId) => {
                    const conn = initialNodes.find((n) => n.id === connId);
                    return conn ? (
                      <span key={connId} className="text-[10px] bg-slate-800 border border-slate-700 px-2 py-0.5 rounded-full text-slate-300 font-medium">
                        {conn.label}
                      </span>
                    ) : null;
                  })}
                </div>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center h-full text-slate-500 text-xs italic">
              Select a node in the galaxy map to view relational details
            </div>
          )}
          
          <button 
            onClick={() => setSelectedNode(null)}
            className="text-[10px] text-amber-500 hover:text-amber-400 font-semibold mt-4 text-left hover:underline"
          >
            ← View Overview
          </button>
        </div>
      </div>
    </div>
  );
}
