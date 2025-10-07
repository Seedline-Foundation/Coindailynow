'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'

export default function LocalizationSettingsPage() {
  const [defaultLanguage, setDefaultLanguage] = useState('en')
  const [fallbackLanguage, setFallbackLanguage] = useState('en')
  const [autoDetect, setAutoDetect] = useState(true)

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Localization Settings</h1>
        <p className="text-gray-600">Configure language preferences and translation settings</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* General Settings */}
        <Card>
          <CardHeader>
            <CardTitle>General Settings</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Default Language</label>
              <select 
                value={defaultLanguage}
                onChange={(e) => setDefaultLanguage(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="en">English</option>
                <option value="es">Español</option>
                <option value="fr">Français</option>
                <option value="de">Deutsch</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Fallback Language</label>
              <select 
                value={fallbackLanguage}
                onChange={(e) => setFallbackLanguage(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="en">English</option>
                <option value="es">Español</option>
                <option value="fr">Français</option>
                <option value="de">Deutsch</option>
              </select>
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="autoDetect"
                checked={autoDetect}
                onChange={(e) => setAutoDetect(e.target.checked)}
                className="rounded border-gray-300 focus:ring-2 focus:ring-blue-500"
              />
              <label htmlFor="autoDetect" className="text-sm font-medium">
                Auto-detect user language
              </label>
            </div>
          </CardContent>
        </Card>

        {/* Translation API Settings */}
        <Card>
          <CardHeader>
            <CardTitle>Translation API</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">API Provider</label>
              <select className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="google">Google Translate</option>
                <option value="deepl">DeepL</option>
                <option value="azure">Azure Translator</option>
                <option value="aws">AWS Translate</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">API Key</label>
              <Input
                type="password"
                placeholder="Enter your API key"
                className="w-full"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Translation Quality</label>
              <select className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="high">High Quality (Slower)</option>
                <option value="medium">Medium Quality</option>
                <option value="fast">Fast (Lower Quality)</option>
              </select>
            </div>
          </CardContent>
        </Card>

        {/* Cache Settings */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Cache Settings</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Cache Duration (hours)</label>
                <Input
                  type="number"
                  placeholder="24"
                  min="1"
                  max="168"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Max Cache Size (MB)</label>
                <Input
                  type="number"
                  placeholder="100"
                  min="10"
                  max="1000"
                />
              </div>
              <div className="flex items-end">
                <Button className="w-full">
                  Clear Translation Cache
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Save Settings */}
        <Card className="lg:col-span-2">
          <CardContent className="pt-6">
            <div className="flex justify-end space-x-4">
              <Button variant="outline">
                Reset to Defaults
              </Button>
              <Button>
                Save Settings
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
