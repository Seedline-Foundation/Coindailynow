'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default function LocalizationPage() {
  const [selectedLanguage, setSelectedLanguage] = useState('en')

  const languages = [
    { code: 'en', name: 'English' },
    { code: 'es', name: 'Español' },
    { code: 'fr', name: 'Français' },
    { code: 'de', name: 'Deutsch' },
    { code: 'zh', name: '中文' },
    { code: 'ja', name: '日本語' },
    { code: 'ko', name: '한국어' },
    { code: 'pt', name: 'Português' },
    { code: 'ru', name: 'Русский' },
    { code: 'ar', name: 'العربية' }
  ]

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Localization Management</h1>
        <p className="text-gray-600">Manage translations and multi-language content</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Language Selection */}
        <Card>
          <CardHeader>
            <CardTitle>Supported Languages</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {languages.map((language) => (
                <div key={language.code} className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <div className="font-medium">{language.name}</div>
                    <div className="text-sm text-gray-500">{language.code.toUpperCase()}</div>
                  </div>
                  <Button
                    variant={selectedLanguage === language.code ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSelectedLanguage(language.code)}
                  >
                    {selectedLanguage === language.code ? 'Active' : 'Select'}
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Translation Status */}
        <Card>
          <CardHeader>
            <CardTitle>Translation Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span>UI Components</span>
                <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-sm">95% Complete</span>
              </div>
              <div className="flex justify-between items-center">
                <span>Error Messages</span>
                <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded text-sm">80% Complete</span>
              </div>
              <div className="flex justify-between items-center">
                <span>Marketing Content</span>
                <span className="bg-red-100 text-red-800 px-2 py-1 rounded text-sm">60% Complete</span>
              </div>
              <div className="flex justify-between items-center">
                <span>Help Documentation</span>
                <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-sm">In Progress</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Button variant="outline" className="h-auto p-4 flex flex-col items-center">
                <div className="text-lg mb-2">📝</div>
                <div className="font-medium">Add Translation</div>
                <div className="text-sm text-gray-500 text-center">Add new translation keys</div>
              </Button>
              <Button variant="outline" className="h-auto p-4 flex flex-col items-center">
                <div className="text-lg mb-2">🔄</div>
                <div className="font-medium">Sync Translations</div>
                <div className="text-sm text-gray-500 text-center">Update all language files</div>
              </Button>
              <Button variant="outline" className="h-auto p-4 flex flex-col items-center">
                <div className="text-lg mb-2">📊</div>
                <div className="font-medium">View Reports</div>
                <div className="text-sm text-gray-500 text-center">Translation coverage reports</div>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
