import React, { useState, useEffect } from 'react';
import { useAuthStore } from '../hooks/useAuth';

interface Business {
  id: number;
  user_id: number;
  name: string;
  address?: string;
  phone?: string;
  email?: string;
  logo_url?: string;
  tax_id?: string;
}

export default function BusinessSettings() {
  const [business, setBusiness] = useState<Business | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState('');
  const { user } = useAuthStore();

  useEffect(() => {
    fetchBusiness();
  }, []);

  const fetchBusiness = async () => {
    try {
      const response = await fetch('/api/business/', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        setBusiness(data);
      } else if (response.status === 404) {
        // Business not found, create empty form
        setBusiness({
          id: 0,
          user_id: user?.id || 0,
          name: '',
          address: '',
          phone: '',
          email: '',
          tax_id: ''
        });
      }
    } catch (error) {
      console.error('Failed to fetch business data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setMessage('');

    try {
      const response = await fetch('/api/business/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        },
        body: JSON.stringify(business)
      });

      if (response.ok) {
        setMessage('Business settings saved successfully!');
        const savedBusiness = await response.json();
        setBusiness(savedBusiness);
      } else {
        setMessage('Failed to save business settings');
      }
    } catch (error) {
      console.error('Save failed:', error);
      setMessage('Error saving business settings');
    } finally {
      setIsSaving(false);
    }
  };

  const handleInputChange = (field: keyof Business, value: string) => {
    setBusiness(prev => prev ? {...prev, [field]: value} : null);
  };

  if (isLoading) return <div className="p-6">Loading business settings...</div>;

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h2 className="text-2xl font-bold mb-6">Business Settings</h2>
      
      {message && (
        <div className={`mb-4 p-3 rounded-md ${
          message.includes('success') ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
        }`}>
          {message}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-2">Business Name *</label>
          <input
            type="text"
            value={business?.name || ''}
            onChange={(e) => handleInputChange('name', e.target.value)}
            className="w-full p-2 border border-gray-300 rounded-md"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Address</label>
          <input
            type="text"
            value={business?.address || ''}
            onChange={(e) => handleInputChange('address', e.target.value)}
            className="w-full p-2 border border-gray-300 rounded-md"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Phone</label>
          <input
            type="tel"
            value={business?.phone || ''}
            onChange={(e) => handleInputChange('phone', e.target.value)}
            className="w-full p-2 border border-gray-300 rounded-md"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Email</label>
          <input
            type="email"
            value={business?.email || ''}
            onChange={(e) => handleInputChange('email', e.target.value)}
            className="w-full p-2 border border-gray-300 rounded-md"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Tax ID</label>
          <input
            type="text"
            value={business?.tax_id || ''}
            onChange={(e) => handleInputChange('tax_id', e.target.value)}
            className="w-full p-2 border border-gray-300 rounded-md"
          />
        </div>

        <button
          type="submit"
          disabled={isSaving}
          className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 disabled:opacity-50"
        >
          {isSaving ? 'Saving...' : 'Save Settings'}
        </button>
      </form>
    </div>
  );
}
