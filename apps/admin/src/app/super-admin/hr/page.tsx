'use client';

import React, { useState } from 'react';

const mockStats = {
  openVacancies: 8,
  totalApplications: 142,
  pendingReview: 23,
  interviewsScheduled: 5,
  onboardingInProgress: 3,
  hiredThisMonth: 2,
};

const mockApplicationsByStage = [
  { stage: 'APPLIED', count: 23, color: 'bg-gray-400' },
  { stage: 'SCREENING', count: 18, color: 'bg-blue-400' },
  { stage: 'AI_SCORED', count: 45, color: 'bg-purple-400' },
  { stage: 'INTERVIEW', count: 5, color: 'bg-orange-400' },
  { stage: 'OFFER', count: 3, color: 'bg-green-400' },
  { stage: 'HIRED', count: 12, color: 'bg-emerald-500' },
  { stage: 'REJECTED', count: 36, color: 'bg-red-400' },
];

const mockVacancies = [
  { id: '1', title: 'Senior Editor — Nigeria Desk', department: 'Editorial', status: 'OPEN', applicants: 34, location: 'Remote', posted: '2026-05-01' },
  { id: '2', title: 'Regional Expert — Kenya', department: 'Content', status: 'OPEN', applicants: 22, location: 'Remote', posted: '2026-05-05' },
  { id: '3', title: 'Full-Stack Engineer', department: 'Engineering', status: 'OPEN', applicants: 45, location: 'Remote', posted: '2026-05-10' },
  { id: '4', title: 'Ad Ops Manager', department: 'Commercial', status: 'OPEN', applicants: 12, location: 'Remote', posted: '2026-05-12' },
  { id: '5', title: 'Finance Officer', department: 'Finance', status: 'PAUSED', applicants: 8, location: 'Remote', posted: '2026-04-20' },
];

const mockRecentApplications = [
  { id: '1', name: 'Olumide Adewale', role: 'Senior Editor — Nigeria Desk', stage: 'AI_SCORED', aiScore: 87, date: '2026-05-19' },
  { id: '2', name: 'Wanjiku Mwangi', role: 'Regional Expert — Kenya', stage: 'INTERVIEW', aiScore: 92, date: '2026-05-18' },
  { id: '3', name: 'David Asante-Mensah', role: 'Full-Stack Engineer', stage: 'APPLIED', aiScore: null, date: '2026-05-20' },
  { id: '4', name: 'Fatima Diallo', role: 'Ad Ops Manager', stage: 'SCREENING', aiScore: 74, date: '2026-05-17' },
];

export default function HRDashboard() {
  const [tab, setTab] = useState<'overview' | 'vacancies' | 'applications'>('overview');

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">HR & Hiring System</h1>
          <p className="text-sm text-gray-500">Applicant tracking, AI scoring, interviews, and onboarding</p>
        </div>
        <button className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700">
          Create Vacancy
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {[
          { label: 'Open Vacancies', value: mockStats.openVacancies, color: 'text-blue-600' },
          { label: 'Total Applications', value: mockStats.totalApplications, color: 'text-indigo-600' },
          { label: 'Pending Review', value: mockStats.pendingReview, color: 'text-orange-600' },
          { label: 'Interviews', value: mockStats.interviewsScheduled, color: 'text-purple-600' },
          { label: 'Onboarding', value: mockStats.onboardingInProgress, color: 'text-green-600' },
          { label: 'Hired (Month)', value: mockStats.hiredThisMonth, color: 'text-emerald-600' },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-xl border p-4">
            <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
            <p className="text-xs text-gray-500">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Pipeline */}
      <div className="bg-white rounded-xl border p-6">
        <h3 className="font-bold text-gray-900 mb-4">Hiring Pipeline</h3>
        <div className="flex gap-2 items-end h-40">
          {mockApplicationsByStage.map(s => (
            <div key={s.stage} className="flex-1 flex flex-col items-center">
              <span className="text-xs font-bold text-gray-900 mb-1">{s.count}</span>
              <div className={`w-full ${s.color} rounded-t-lg transition-all`} style={{ height: `${(s.count / 50) * 100}%`, minHeight: '8px' }} />
              <span className="text-xs text-gray-500 mt-2 text-center">{s.stage.replace('_', ' ')}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2">
        {[
          { key: 'overview', label: 'Recent Activity' },
          { key: 'vacancies', label: 'Job Vacancies' },
          { key: 'applications', label: 'Applications' },
        ].map(t => (
          <button key={t.key} onClick={() => setTab(t.key as any)}
            className={`px-4 py-2 rounded-lg text-sm font-medium ${tab === t.key ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'overview' && (
        <div className="bg-white rounded-xl border overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="text-left p-3 font-medium text-gray-500">Candidate</th>
                <th className="text-left p-3 font-medium text-gray-500">Role</th>
                <th className="text-left p-3 font-medium text-gray-500">Stage</th>
                <th className="text-left p-3 font-medium text-gray-500">AI Score</th>
                <th className="text-left p-3 font-medium text-gray-500">Date</th>
                <th className="text-right p-3 font-medium text-gray-500">Actions</th>
              </tr>
            </thead>
            <tbody>
              {mockRecentApplications.map(app => (
                <tr key={app.id} className="border-b hover:bg-gray-50">
                  <td className="p-3 font-medium text-gray-900">{app.name}</td>
                  <td className="p-3 text-gray-600">{app.role}</td>
                  <td className="p-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                      app.stage === 'INTERVIEW' ? 'bg-orange-100 text-orange-700' :
                      app.stage === 'AI_SCORED' ? 'bg-purple-100 text-purple-700' :
                      app.stage === 'APPLIED' ? 'bg-gray-100 text-gray-700' :
                      'bg-blue-100 text-blue-700'
                    }`}>{app.stage.replace('_', ' ')}</span>
                  </td>
                  <td className="p-3">
                    {app.aiScore ? (
                      <span className={`font-semibold ${app.aiScore >= 80 ? 'text-green-600' : app.aiScore >= 60 ? 'text-orange-600' : 'text-red-600'}`}>
                        {app.aiScore}/100
                      </span>
                    ) : (
                      <button className="text-xs text-purple-600 hover:underline">Run AI Score</button>
                    )}
                  </td>
                  <td className="p-3 text-gray-500">{app.date}</td>
                  <td className="p-3 text-right">
                    <button className="text-xs text-blue-600 hover:underline mr-2">Review</button>
                    <button className="text-xs text-green-600 hover:underline">Advance</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {tab === 'vacancies' && (
        <div className="bg-white rounded-xl border overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="text-left p-3 font-medium text-gray-500">Position</th>
                <th className="text-left p-3 font-medium text-gray-500">Department</th>
                <th className="text-left p-3 font-medium text-gray-500">Status</th>
                <th className="text-left p-3 font-medium text-gray-500">Location</th>
                <th className="text-right p-3 font-medium text-gray-500">Applicants</th>
                <th className="text-left p-3 font-medium text-gray-500">Posted</th>
              </tr>
            </thead>
            <tbody>
              {mockVacancies.map(v => (
                <tr key={v.id} className="border-b hover:bg-gray-50">
                  <td className="p-3 font-medium text-gray-900">{v.title}</td>
                  <td className="p-3 text-gray-600">{v.department}</td>
                  <td className="p-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${v.status === 'OPEN' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                      {v.status}
                    </span>
                  </td>
                  <td className="p-3 text-gray-600">{v.location}</td>
                  <td className="p-3 text-right text-gray-600">{v.applicants}</td>
                  <td className="p-3 text-gray-500">{v.posted}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
