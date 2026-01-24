'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface EventData {
  title: string
  date: string
  description: string
  location: string
  submittedAt: string
}

interface EventSubmissionFormProps {
  onSubmit?: (eventData: EventData) => void
  className?: string
}

export function EventSubmissionForm({ onSubmit, className }: EventSubmissionFormProps) {
  const [eventTitle, setEventTitle] = useState('')
  const [eventDate, setEventDate] = useState('')
  const [eventDescription, setEventDescription] = useState('')
  const [eventLocation, setEventLocation] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    const eventData = {
      title: eventTitle,
      date: eventDate,
      description: eventDescription,
      location: eventLocation,
      submittedAt: new Date().toISOString()
    }

    try {
      await onSubmit?.(eventData)
      // Reset form on successful submission
      setEventTitle('')
      setEventDate('')
      setEventDescription('')
      setEventLocation('')
    } catch (error) {
      console.error('Failed to submit event:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>Submit Event</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="eventTitle" className="block text-sm font-medium mb-1">
              Event Title
            </label>
            <Input
              id="eventTitle"
              type="text"
              value={eventTitle}
              onChange={(e) => setEventTitle(e.target.value)}
              placeholder="Enter event title"
              required
            />
          </div>

          <div>
            <label htmlFor="eventDate" className="block text-sm font-medium mb-1">
              Event Date
            </label>
            <Input
              id="eventDate"
              type="datetime-local"
              value={eventDate}
              onChange={(e) => setEventDate(e.target.value)}
              required
            />
          </div>

          <div>
            <label htmlFor="eventLocation" className="block text-sm font-medium mb-1">
              Location
            </label>
            <Input
              id="eventLocation"
              type="text"
              value={eventLocation}
              onChange={(e) => setEventLocation(e.target.value)}
              placeholder="Event location or 'Online'"
              required
            />
          </div>

          <div>
            <label htmlFor="eventDescription" className="block text-sm font-medium mb-1">
              Description
            </label>
            <textarea
              id="eventDescription"
              value={eventDescription}
              onChange={(e) => setEventDescription(e.target.value)}
              placeholder="Describe your event..."
              className="w-full min-h-[100px] px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <Button 
            type="submit" 
            disabled={isSubmitting}
            className="w-full"
          >
            {isSubmitting ? 'Submitting...' : 'Submit Event'}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}

export default EventSubmissionForm
