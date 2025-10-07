'use client';

import React, { useState, useEffect } from 'react';
import { LivePodcast, LivePodcastFeatures, User, LiveChat } from '../../types/user';

interface LivePodcastSystemProps {
  user: User;
  podcastFeatures: LivePodcastFeatures;
}

export default function LivePodcastSystem({ user, podcastFeatures }: LivePodcastSystemProps) {
  const [activePodcast, setActivePodcast] = useState<LivePodcast | null>(null);
  const [chatMessages, setChatMessages] = useState<LiveChat[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isJoined, setIsJoined] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);

  const handleJoinPodcast = (podcast: LivePodcast) => {
    setActivePodcast(podcast);
    setIsJoined(true);
  };

  const handleLeavePodcast = () => {
    setActivePodcast(null);
    setIsJoined(false);
    setIsSpeaking(false);
  };

  const handleSendMessage = () => {
    if (!newMessage.trim() || !activePodcast) return;

    const message: LiveChat = {
      id: Date.now().toString(),
      podcastId: activePodcast.id,
      user,
      message: newMessage,
      timestamp: new Date(),
      reactions: []
    };

    setChatMessages(prev => [...prev, message]);
    setNewMessage('');
  };

  const handleRequestToSpeak = () => {
    // Handle request to speak logic
    console.log('Requesting to speak');
  };

  const handleReaction = (emoji: string) => {
    // Handle live reaction
    console.log(`Reacting with ${emoji}`);
  };

  if (!isJoined || !activePodcast) {
    return <PodcastLobby podcastFeatures={podcastFeatures} onJoinPodcast={handleJoinPodcast} />;
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto px-4 py-8">
        {/* Podcast Header */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-red-500 rounded-full flex items-center justify-center">
                <span className="text-white font-bold">🔴</span>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  {activePodcast.title}
                </h1>
                <p className="text-gray-600 dark:text-gray-400">
                  Hosted by {activePodcast.host.displayName}
                </p>
                <div className="flex items-center gap-4 mt-2">
                  <span className="text-sm text-red-600 font-medium">🔴 LIVE</span>
                  <span className="text-sm text-gray-500">
                    {activePodcast.listeners.length} listeners
                  </span>
                </div>
              </div>
            </div>

            <button
              onClick={handleLeavePodcast}
              className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg"
            >
              Leave
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Podcast Area */}
          <div className="lg:col-span-2">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
              {/* Speakers Section */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Speakers</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {/* Host */}
                  <div className="text-center">
                    <div className="relative">
                      <img
                        src={activePodcast.host.avatar || '/default-avatar.png'}
                        alt={activePodcast.host.displayName}
                        className="w-16 h-16 rounded-full mx-auto mb-2 ring-4 ring-red-500"
                      />
                      <div className="absolute -top-1 -right-1 bg-red-500 text-white text-xs px-1 rounded">
                        HOST
                      </div>
                    </div>
                    <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                      {activePodcast.host.displayName}
                    </div>
                  </div>

                  {/* Guests */}
                  {activePodcast.guests.map((guest) => (
                    <div key={guest.id} className="text-center">
                      <img
                        src={guest.avatar || '/default-avatar.png'}
                        alt={guest.displayName}
                        className="w-16 h-16 rounded-full mx-auto mb-2 ring-2 ring-blue-500"
                      />
                      <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                        {guest.displayName}
                      </div>
                    </div>
                  ))}

                  {/* Current User if Speaking */}
                  {isSpeaking && (
                    <div className="text-center">
                      <img
                        src={user.avatar || '/default-avatar.png'}
                        alt={user.displayName}
                        className="w-16 h-16 rounded-full mx-auto mb-2 ring-2 ring-green-500"
                      />
                      <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                        {user.displayName} (You)
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Podcast Description */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">About</h3>
                <p className="text-gray-600 dark:text-gray-400">{activePodcast.description}</p>
              </div>

              {/* Controls */}
              <div className="flex items-center justify-center gap-4">
                {podcastFeatures.participation.canRequestToSpeak && !isSpeaking && (
                  <button
                    onClick={handleRequestToSpeak}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium"
                  >
                    🎤 Request to Speak
                  </button>
                )}

                {isSpeaking && (
                  <button
                    onClick={() => setIsSpeaking(false)}
                    className="bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-lg font-medium"
                  >
                    🔇 Stop Speaking
                  </button>
                )}

                {/* Reaction Buttons */}
                {podcastFeatures.participation.canReactLive && (
                  <div className="flex gap-2">
                    {podcastFeatures.features.reactions.map((reaction) => (
                      <button
                        key={reaction}
                        onClick={() => handleReaction(reaction)}
                        className="bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 p-2 rounded-lg text-lg"
                      >
                        {reaction}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Chat Sidebar */}
          <div className="lg:col-span-1">
            {activePodcast.chatEnabled && podcastFeatures.participation.canChatDuringPodcast && (
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 h-96 flex flex-col">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Live Chat</h3>
                
                {/* Chat Messages */}
                <div className="flex-1 overflow-y-auto space-y-3 mb-4">
                  {chatMessages.map((message) => (
                    <div key={message.id} className="flex gap-2">
                      <img
                        src={message.user.avatar || '/default-avatar.png'}
                        alt={message.user.displayName}
                        className="w-6 h-6 rounded-full flex-shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          {message.user.displayName}
                        </div>
                        <div className="text-sm text-gray-900 dark:text-gray-100 break-words">
                          {message.message}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Chat Input */}
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                    placeholder="Type a message..."
                    className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <button
                    onClick={handleSendMessage}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-lg"
                  >
                    Send
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// Podcast Lobby Component
function PodcastLobby({ 
  podcastFeatures, 
  onJoinPodcast 
}: { 
  podcastFeatures: LivePodcastFeatures; 
  onJoinPodcast: (podcast: LivePodcast) => void;
}) {
  const [livePodcasts] = useState<LivePodcast[]>([
    {
      id: '1',
      title: 'Bitcoin Bull Run Discussion',
      description: 'Analyzing the current Bitcoin market trends and predictions for the next quarter',
      host: {
        id: 'host1',
        displayName: 'CryptoExpert',
        avatar: '/avatars/host1.jpg'
      } as User,
      guests: [],
      listeners: [],
      status: 'live',
      startTime: new Date(),
      endTime: new Date(Date.now() + 3600000),
      duration: 60,
      chatEnabled: true,
      reactionsEnabled: true,
      maxListeners: 100
    }
  ]);

  const [scheduledPodcasts] = useState<LivePodcast[]>([
    {
      id: '2',
      title: 'DeFi Security Best Practices',
      description: 'Learn how to protect your DeFi investments from common security threats',
      host: {
        id: 'host2',
        displayName: 'SecurityGuru',
        avatar: '/avatars/host2.jpg'
      } as User,
      guests: [],
      listeners: [],
      status: 'scheduled',
      startTime: new Date(Date.now() + 7200000), // 2 hours from now
      endTime: new Date(Date.now() + 10800000),
      duration: 90,
      chatEnabled: true,
      reactionsEnabled: true,
      maxListeners: 150
    }
  ]);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-4">
            Live Podcasts
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-400">
            Join live discussions with crypto experts and the community
          </p>
        </div>

        {/* Live Podcasts */}
        {livePodcasts.length > 0 && (
          <div className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100 mb-4">
              🔴 Live Now
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {livePodcasts.map((podcast) => (
                <div key={podcast.id} className="bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-hidden border-2 border-red-200 dark:border-red-800">
                  <div className="p-6">
                    <div className="flex items-center gap-3 mb-3">
                      <img
                        src={podcast.host.avatar || '/default-avatar.png'}
                        alt={podcast.host.displayName}
                        className="w-10 h-10 rounded-full"
                      />
                      <div>
                        <div className="font-medium text-gray-900 dark:text-gray-100">
                          {podcast.host.displayName}
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs bg-red-500 text-white px-2 py-1 rounded-full">
                            LIVE
                          </span>
                          <span className="text-xs text-gray-500">
                            {podcast.listeners.length} listening
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                      {podcast.title}
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400 text-sm mb-4">
                      {podcast.description}
                    </p>
                    
                    <button
                      onClick={() => onJoinPodcast(podcast)}
                      className="w-full bg-red-600 hover:bg-red-700 text-white py-2 px-4 rounded-lg font-medium"
                    >
                      Join Live
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Scheduled Podcasts */}
        {scheduledPodcasts.length > 0 && (
          <div className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100 mb-4">
              📅 Scheduled
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {scheduledPodcasts.map((podcast) => (
                <div key={podcast.id} className="bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-hidden">
                  <div className="p-6">
                    <div className="flex items-center gap-3 mb-3">
                      <img
                        src={podcast.host.avatar || '/default-avatar.png'}
                        alt={podcast.host.displayName}
                        className="w-10 h-10 rounded-full"
                      />
                      <div>
                        <div className="font-medium text-gray-900 dark:text-gray-100">
                          {podcast.host.displayName}
                        </div>
                        <div className="text-xs text-gray-500">
                          {new Date(podcast.startTime).toLocaleString()}
                        </div>
                      </div>
                    </div>
                    
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                      {podcast.title}
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400 text-sm mb-4">
                      {podcast.description}
                    </p>
                    
                    <button className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg font-medium">
                      Set Reminder
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Host Podcast Section */}
        {podcastFeatures.hosting.canHost && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-8 text-center">
            <div className="w-16 h-16 bg-purple-100 dark:bg-purple-900 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">🎙️</span>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
              Host Your Own Podcast
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-2xl mx-auto">
              Share your expertise with the community. Start a live discussion, invite guests, and engage with listeners in real-time.
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6 max-w-2xl mx-auto">
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">{podcastFeatures.hosting.maxDuration}</div>
                <div className="text-sm text-gray-500">Max Duration (min)</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">
                  {podcastFeatures.hosting.canRecord ? '✓' : '✗'}
                </div>
                <div className="text-sm text-gray-500">Recording Available</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">
                  {podcastFeatures.hosting.canInviteGuests ? '✓' : '✗'}
                </div>
                <div className="text-sm text-gray-500">Invite Guests</div>
              </div>
            </div>
            
            <button className="bg-purple-600 hover:bg-purple-700 text-white px-8 py-3 rounded-lg font-medium">
              Start New Podcast
            </button>
          </div>
        )}
      </div>
    </div>
  );
}