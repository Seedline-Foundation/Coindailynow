'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardContent, Button, Select, Input } from '../../ui';

interface ThreatEvent {
  id: string;
  type: 'malware' | 'phishing' | 'ddos' | 'brute_force' | 'sql_injection' | 'xss' | 'suspicious_trading' | 'api_abuse';
  severity: 'low' | 'medium' | 'high' | 'critical';
  status: 'active' | 'investigating' | 'mitigated' | 'resolved';
  source: string;
  target: string;
  description: string;
  detectedAt: string;
  lastUpdated: string;
  attackVector: string;
  affectedUsers: number;
  blockedRequests: number;
  confidence: number;
  geoLocation?: {
    country: string;
    city: string;
    ip: string;
  };
}

interface ThreatStats {
  totalThreats: number;
  activeThreats: number;
  criticalThreats: number;
  blockedAttacks: number;
  affectedUsers: number;
  lastUpdate: string;
}

export default function ThreatDetectionDashboard() {
  const [threats, setThreats] = useState<ThreatEvent[]>([]);
  const [stats, setStats] = useState<ThreatStats>({
    totalThreats: 0,
    activeThreats: 0,
    criticalThreats: 0,
    blockedAttacks: 0,
    affectedUsers: 0,
    lastUpdate: ''
  });
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<{
    severity: string;
    status: string;
    type: string;
  }>({
    severity: 'all',
    status: 'all',
    type: 'all'
  });
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const fetchThreatData = async () => {
      try {
        // Mock data - replace with actual API calls
        const mockThreats: ThreatEvent[] = [
          {
            id: '1',
            type: 'brute_force',
            severity: 'high',
            status: 'active',
            source: '192.168.1.100',
            target: 'Login API',
            description: 'Multiple failed login attempts detected from suspicious IP address',
            detectedAt: new Date().toISOString(),
            lastUpdated: new Date().toISOString(),
            attackVector: 'Authentication Bypass',
            affectedUsers: 0,
            blockedRequests: 127,
            confidence: 95,
            geoLocation: {
              country: 'Unknown',
              city: 'Unknown',
              ip: '192.168.1.100'
            }
          },
          {
            id: '2',
            type: 'suspicious_trading',
            severity: 'critical',
            status: 'investigating',
            source: 'AI Trading Monitor',
            target: 'Trading Engine',
            description: 'Unusual trading pattern detected - potential market manipulation',
            detectedAt: new Date(Date.now() - 3600000).toISOString(),
            lastUpdated: new Date(Date.now() - 1800000).toISOString(),
            attackVector: 'Market Manipulation',
            affectedUsers: 1,
            blockedRequests: 0,
            confidence: 87,
            geoLocation: {
              country: 'Nigeria',
              city: 'Lagos',
              ip: '41.58.0.1'
            }
          },
          {
            id: '3',
            type: 'ddos',
            severity: 'medium',
            status: 'mitigated',
            source: 'Multiple IPs',
            target: 'API Gateway',
            description: 'Distributed denial of service attack successfully mitigated',
            detectedAt: new Date(Date.now() - 7200000).toISOString(),
            lastUpdated: new Date(Date.now() - 3600000).toISOString(),
            attackVector: 'Network Flooding',
            affectedUsers: 50,
            blockedRequests: 1500,
            confidence: 98,
            geoLocation: {
              country: 'Multiple',
              city: 'Multiple',
              ip: 'Multiple'
            }
          },
          {
            id: '4',
            type: 'api_abuse',
            severity: 'low',
            status: 'resolved',
            source: '10.0.0.50',
            target: 'Market Data API',
            description: 'API rate limit exceeded - automated trading bot detected',
            detectedAt: new Date(Date.now() - 10800000).toISOString(),
            lastUpdated: new Date(Date.now() - 9000000).toISOString(),
            attackVector: 'Rate Limit Abuse',
            affectedUsers: 0,
            blockedRequests: 250,
            confidence: 75,
            geoLocation: {
              country: 'South Africa',
              city: 'Cape Town',
              ip: '10.0.0.50'
            }
          }
        ];

        setThreats(mockThreats);
        setStats({
          totalThreats: mockThreats.length,
          activeThreats: mockThreats.filter(t => t.status === 'active').length,
          criticalThreats: mockThreats.filter(t => t.severity === 'critical').length,
          blockedAttacks: mockThreats.reduce((sum, t) => sum + t.blockedRequests, 0),
          affectedUsers: mockThreats.reduce((sum, t) => sum + t.affectedUsers, 0),
          lastUpdate: new Date().toISOString()
        });
      } catch (error) {
        console.error('Failed to fetch threat data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchThreatData();
    const interval = setInterval(fetchThreatData, 15000); // Refresh every 15 seconds
    return () => clearInterval(interval);
  }, []);

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-100 border-red-500 text-red-800';
      case 'high': return 'bg-orange-100 border-orange-500 text-orange-800';
      case 'medium': return 'bg-yellow-100 border-yellow-500 text-yellow-800';
      case 'low': return 'bg-blue-100 border-blue-500 text-blue-800';
      default: return 'bg-gray-100 border-gray-500 text-gray-800';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-red-100 text-red-800';
      case 'investigating': return 'bg-yellow-100 text-yellow-800';
      case 'mitigated': return 'bg-blue-100 text-blue-800';
      case 'resolved': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'brute_force':
        return <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" /></svg>;
      case 'ddos':
        return <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" /></svg>;
      case 'suspicious_trading':
        return <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>;
      default:
        return <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.268 18.5c-.77.833.192 2.5 1.732 2.5z" /></svg>;
    }
  };

  const filteredThreats = threats.filter(threat => {
    const matchesSeverity = filter.severity === 'all' || threat.severity === filter.severity;
    const matchesStatus = filter.status === 'all' || threat.status === filter.status;
    const matchesType = filter.type === 'all' || threat.type === filter.type;
    const matchesSearch = searchTerm === '' || 
      threat.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      threat.source.toLowerCase().includes(searchTerm.toLowerCase()) ||
      threat.target.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesSeverity && matchesStatus && matchesType && matchesSearch;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-red-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="border-b border-gray-200 pb-6">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Threat Detection Dashboard
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">
          AI-powered real-time threat monitoring and incident response
        </p>
      </div>

      {/* Threat Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-red-600">{stats.activeThreats}</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">Active Threats</p>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-orange-600">{stats.criticalThreats}</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">Critical</p>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-blue-600">{stats.totalThreats}</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">Total Threats</p>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-green-600">{stats.blockedAttacks}</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">Blocked</p>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-purple-600">{stats.affectedUsers}</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">Affected Users</p>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <p className="text-xs text-gray-500 dark:text-gray-400">Last Update</p>
              <p className="text-sm font-medium text-gray-900 dark:text-white">
                {new Date(stats.lastUpdate).toLocaleTimeString()}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <Card>
        <CardContent className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Severity
              </label>
              <Select
                value={filter.severity}
                onChange={(e) => setFilter(prev => ({ ...prev, severity: e.target.value }))}
                options={[
                  { value: 'all', label: 'All Severities' },
                  { value: 'critical', label: 'Critical' },
                  { value: 'high', label: 'High' },
                  { value: 'medium', label: 'Medium' },
                  { value: 'low', label: 'Low' }
                ]}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Status
              </label>
              <Select
                value={filter.status}
                onChange={(e) => setFilter(prev => ({ ...prev, status: e.target.value }))}
                options={[
                  { value: 'all', label: 'All Statuses' },
                  { value: 'active', label: 'Active' },
                  { value: 'investigating', label: 'Investigating' },
                  { value: 'mitigated', label: 'Mitigated' },
                  { value: 'resolved', label: 'Resolved' }
                ]}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Type
              </label>
              <Select
                value={filter.type}
                onChange={(e) => setFilter(prev => ({ ...prev, type: e.target.value }))}
                options={[
                  { value: 'all', label: 'All Types' },
                  { value: 'brute_force', label: 'Brute Force' },
                  { value: 'ddos', label: 'DDoS' },
                  { value: 'suspicious_trading', label: 'Suspicious Trading' },
                  { value: 'api_abuse', label: 'API Abuse' },
                  { value: 'sql_injection', label: 'SQL Injection' },
                  { value: 'xss', label: 'XSS' }
                ]}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Search
              </label>
              <Input
                placeholder="Search threats..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Threat Events List */}
      <Card>
        <CardHeader>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            Active Threat Events ({filteredThreats.length})
          </h2>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {filteredThreats.map((threat) => (
              <div
                key={threat.id}
                className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-4 flex-1">
                    <div className="flex-shrink-0 p-2 bg-gray-100 dark:bg-gray-700 rounded-lg">
                      {getTypeIcon(threat.type)}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-3 mb-2">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full border ${getSeverityColor(threat.severity)}`}>
                          {threat.severity.toUpperCase()}
                        </span>
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(threat.status)}`}>
                          {threat.status.toUpperCase()}
                        </span>
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          Confidence: {threat.confidence}%
                        </span>
                      </div>
                      
                      <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-1">
                        {threat.description}
                      </h3>
                      
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs text-gray-600 dark:text-gray-400">
                        <div>
                          <span className="font-medium">Source:</span> {threat.source}
                        </div>
                        <div>
                          <span className="font-medium">Target:</span> {threat.target}
                        </div>
                        <div>
                          <span className="font-medium">Attack Vector:</span> {threat.attackVector}
                        </div>
                        <div>
                          <span className="font-medium">Detected:</span> {new Date(threat.detectedAt).toLocaleString()}
                        </div>
                      </div>
                      
                      {threat.geoLocation && (
                        <div className="mt-2 text-xs text-gray-600 dark:text-gray-400">
                          <span className="font-medium">Location:</span> {threat.geoLocation.city}, {threat.geoLocation.country} ({threat.geoLocation.ip})
                        </div>
                      )}
                      
                      <div className="flex items-center space-x-4 mt-2 text-xs text-gray-600 dark:text-gray-400">
                        <span>
                          <span className="font-medium">Blocked Requests:</span> {threat.blockedRequests}
                        </span>
                        <span>
                          <span className="font-medium">Affected Users:</span> {threat.affectedUsers}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex space-x-2 ml-4">
                    <Button variant="outline" size="sm">
                      Investigate
                    </Button>
                    {threat.status === 'active' && (
                      <Button variant="outline" size="sm">
                        Mitigate
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            ))}
            
            {filteredThreats.length === 0 && (
              <div className="text-center py-8">
                <p className="text-gray-500 dark:text-gray-400">
                  No threats found matching your criteria.
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
