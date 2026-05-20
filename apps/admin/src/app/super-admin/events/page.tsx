'use client';

import React, { useState } from 'react';

const mockEvents = [
  { id: '1', title: 'Africa Crypto Summit 2026', type: 'CONFERENCE', category: 'CRYPTO', country: 'NG', city: 'Lagos', startDate: '2026-06-15', status: 'APPROVED', isFeatured: true, registrations: 1200 },
  { id: '2', title: 'Kenya VASP Act Workshop', type: 'WORKSHOP', category: 'REGULATORY', country: 'KE', city: 'Nairobi', startDate: '2026-06-20', status: 'APPROVED', isFeatured: false, registrations: 350 },
  { id: '3', title: 'Caribbean Fintech Week', type: 'SUMMIT', category: 'FINTECH', country: 'JM', city: 'Kingston', startDate: '2026-07-10', status: 'PENDING', isFeatured: false, registrations: 0 },
  { id: '4', title: 'LatAm DeFi Conference', type: 'CONFERENCE', category: 'DEFI', country: 'BR', city: 'São Paulo', startDate: '2026-07-25', status: 'APPROVED', isFeatured: true, registrations: 800 },
  { id: '5', title: 'Blockchain Hackathon Nigeria', type: 'HACKATHON', category: 'BLOCKCHAIN', country: 'NG', city: 'Lagos', startDate: '2026-08-01', status: 'PENDING', isFeatured: false, registrations: 0 },
];

const mockStats = {
  totalEvents: 142,
  pendingApproval: 12,
  upcomingEvents: 38,
  featuredEvents: 8,
  totalRegistrations: 12500,
  revenueCP: 45000,
};

export default function EventsIntelligencePage() {
  const [filter, setFilter] = useState('ALL');

  const filteredEvents = filter === 'ALL'
    ? mockEvents
    : mockEvents.filter(e => e.status === filter);

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Events Intelligence Engine</h1>
          <p className="text-sm text-gray-500">Manage crypto/AI/blockchain events across Africa, Caribbean, and Latin America</p>
        </div>
        <button className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700">
          Create Event
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {[
          { label: 'Total Events', value: mockStats.totalEvents, color: 'text-blue-600' },
          { label: 'Pending Approval', value: mockStats.pendingApproval, color: 'text-orange-600' },
          { label: 'Upcoming', value: mockStats.upcomingEvents, color: 'text-green-600' },
          { label: 'Featured', value: mockStats.featuredEvents, color: 'text-purple-600' },
          { label: 'Total Registrations', value: mockStats.totalRegistrations.toLocaleString(), color: 'text-indigo-600' },
          { label: 'Revenue (CP)', value: mockStats.revenueCP.toLocaleString(), color: 'text-emerald-600' },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-xl border p-4">
            <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
            <p className="text-xs text-gray-500">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex gap-2">
        {['ALL', 'APPROVED', 'PENDING', 'REJECTED'].map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium ${filter === f ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
            {f}
          </button>
        ))}
      </div>

      {/* Events Table */}
      <div className="bg-white rounded-xl border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="text-left p-3 font-medium text-gray-500">Event</th>
              <th className="text-left p-3 font-medium text-gray-500">Type</th>
              <th className="text-left p-3 font-medium text-gray-500">Location</th>
              <th className="text-left p-3 font-medium text-gray-500">Date</th>
              <th className="text-left p-3 font-medium text-gray-500">Status</th>
              <th className="text-right p-3 font-medium text-gray-500">Registrations</th>
              <th className="text-right p-3 font-medium text-gray-500">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredEvents.map(event => (
              <tr key={event.id} className="border-b hover:bg-gray-50">
                <td className="p-3">
                  <div className="flex items-center gap-2">
                    {event.isFeatured && <span className="text-yellow-500 text-xs">★</span>}
                    <span className="font-medium text-gray-900">{event.title}</span>
                  </div>
                </td>
                <td className="p-3 text-gray-600">{event.type}</td>
                <td className="p-3 text-gray-600">{event.city}, {event.country}</td>
                <td className="p-3 text-gray-600">{event.startDate}</td>
                <td className="p-3">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                    event.status === 'APPROVED' ? 'bg-green-100 text-green-700' :
                    event.status === 'PENDING' ? 'bg-yellow-100 text-yellow-700' :
                    'bg-red-100 text-red-700'
                  }`}>{event.status}</span>
                </td>
                <td className="p-3 text-right text-gray-600">{event.registrations.toLocaleString()}</td>
                <td className="p-3 text-right">
                  <button className="text-xs text-blue-600 hover:underline mr-2">View</button>
                  {event.status === 'PENDING' && (
                    <>
                      <button className="text-xs text-green-600 hover:underline mr-2">Approve</button>
                      <button className="text-xs text-red-600 hover:underline">Reject</button>
                    </>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
