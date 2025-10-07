'use client';

import { Calendar } from 'lucide-react';

const EventCalendar = () => {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow">
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-3" />
          <p className="text-gray-500 dark:text-gray-400">
            Event Calendar coming soon
          </p>
        </div>
      </div>
    </div>
  );
};

export default EventCalendar;
