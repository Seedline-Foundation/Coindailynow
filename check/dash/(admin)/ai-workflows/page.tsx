'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Brain, Zap, BarChart3, Clock, Settings, Play, Pause } from 'lucide-react'

export default function AIWorkflowsPage() {
  const [workflows, setWorkflows] = useState([
    {
      id: 1,
      name: 'Auto News Generation',
      description: 'Automatically generate news articles from market data',
      status: 'active',
      lastRun: '2 minutes ago',
      enabled: true
    },
    {
      id: 2,
      name: 'Sentiment Analysis',
      description: 'Analyze market sentiment from social media and news',
      status: 'active',
      lastRun: '5 minutes ago',
      enabled: true
    },
    {
      id: 3,
      name: 'Price Prediction',
      description: 'AI-powered cryptocurrency price predictions',
      status: 'idle',
      lastRun: '1 hour ago',
      enabled: false
    },
    {
      id: 4,
      name: 'Content Optimization',
      description: 'Optimize articles for SEO and engagement',
      status: 'processing',
      lastRun: 'Running now',
      enabled: true
    }
  ])

  const toggleWorkflow = (id: number) => {
    setWorkflows(prev => prev.map(workflow => 
      workflow.id === id 
        ? { ...workflow, enabled: !workflow.enabled, status: workflow.enabled ? 'idle' : 'active' }
        : workflow
    ))
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800'
      case 'processing': return 'bg-blue-100 text-blue-800'
      case 'idle': return 'bg-gray-100 text-gray-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">AI Workflows</h1>
        <p className="text-gray-600">Manage and monitor your AI-powered automation workflows</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Stats Cards */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Active Workflows</p>
                <p className="text-2xl font-bold">3</p>
              </div>
              <Brain className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Processing Tasks</p>
                <p className="text-2xl font-bold">12</p>
              </div>
              <Zap className="h-8 w-8 text-yellow-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Efficiency Score</p>
                <p className="text-2xl font-bold">94%</p>
              </div>
              <BarChart3 className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Workflows List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Workflow Management</span>
            <Button>
              <Settings className="h-4 w-4 mr-2" />
              Configure New Workflow
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {workflows.map((workflow) => (
              <div key={workflow.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-2">
                    {workflow.enabled ? (
                      <Play className="h-5 w-5 text-green-600" />
                    ) : (
                      <Pause className="h-5 w-5 text-gray-400" />
                    )}
                    <div>
                      <h3 className="font-medium">{workflow.name}</h3>
                      <p className="text-sm text-gray-600">{workflow.description}</p>
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-4">
                  <div className="text-right">
                    <Badge className={getStatusColor(workflow.status)}>
                      {workflow.status}
                    </Badge>
                    <div className="flex items-center text-sm text-gray-500 mt-1">
                      <Clock className="h-3 w-3 mr-1" />
                      {workflow.lastRun}
                    </div>
                  </div>

                  <Switch
                    checked={workflow.enabled}
                    onCheckedChange={() => toggleWorkflow(workflow.id)}
                  />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Button variant="outline" className="h-auto p-4 flex flex-col items-center">
              <Brain className="h-6 w-6 mb-2" />
              <span className="font-medium">Train Model</span>
              <span className="text-xs text-gray-500">Update AI models</span>
            </Button>
            <Button variant="outline" className="h-auto p-4 flex flex-col items-center">
              <BarChart3 className="h-6 w-6 mb-2" />
              <span className="font-medium">View Analytics</span>
              <span className="text-xs text-gray-500">Performance metrics</span>
            </Button>
            <Button variant="outline" className="h-auto p-4 flex flex-col items-center">
              <Settings className="h-6 w-6 mb-2" />
              <span className="font-medium">Settings</span>
              <span className="text-xs text-gray-500">Configure workflows</span>
            </Button>
            <Button variant="outline" className="h-auto p-4 flex flex-col items-center">
              <Zap className="h-6 w-6 mb-2" />
              <span className="font-medium">Run All</span>
              <span className="text-xs text-gray-500">Execute workflows</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
