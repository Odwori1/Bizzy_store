import React, { useEffect, useState } from 'react';

interface SessionWarningModalProps {
  isOpen: boolean;
  secondsRemaining: number;
  onExtendSession: () => void;
  onLogout: () => void;
}

export default function SessionWarningModal({ 
  isOpen, 
  secondsRemaining, 
  onExtendSession, 
  onLogout 
}: SessionWarningModalProps) {
  const [displaySeconds, setDisplaySeconds] = useState(secondsRemaining);

  useEffect(() => {
    setDisplaySeconds(secondsRemaining);
  }, [secondsRemaining]);

  useEffect(() => {
    if (!isOpen) return;

    const interval = setInterval(() => {
      setDisplaySeconds(prev => {
        if (prev <= 1) {
          clearInterval(interval);
          onLogout();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isOpen, onLogout]);

  if (!isOpen) return null;

  const minutes = Math.floor(displaySeconds / 60);
  const seconds = displaySeconds % 60;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-96 max-w-sm mx-4">
        <div className="text-center">
          {/* Warning Icon */}
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-yellow-100 mb-4">
            <svg className="h-6 w-6 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>

          {/* Title */}
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Session About to Expire
          </h3>

          {/* Countdown */}
          <div className="mb-4">
            <p className="text-sm text-gray-600 mb-2">
              Your session will expire in:
            </p>
            <div className="text-2xl font-bold text-red-600">
              {minutes}:{seconds.toString().padStart(2, '0')}
            </div>
          </div>

          {/* Warning Message */}
          <p className="text-sm text-gray-600 mb-6">
            For security reasons, you will be automatically logged out. 
            Any unsaved work may be lost.
          </p>

          {/* Action Buttons */}
          <div className="flex space-x-3">
            <button
              onClick={onLogout}
              className="flex-1 bg-gray-300 text-gray-700 px-4 py-2 rounded-md text-sm font-medium hover:bg-gray-400 transition"
            >
              Log Out Now
            </button>
            <button
              onClick={onExtendSession}
              className="flex-1 bg-indigo-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-indigo-700 transition"
            >
              Stay Logged In
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
