import React, { useState } from 'react';

const TermsAndConditions: React.FC<{ onAccept: () => void }> = ({ onAccept }) => {
  const [accepted, setAccepted] = useState(false);

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-lg">
        {/* Header */}
        <div className="p-6 border-b border-gray-200">
          <h1 className="text-3xl font-bold text-gray-900 text-center">
            Bizzy POS Terms & Conditions
          </h1>
        </div>

        {/* Scrollable Content */}
        <div className="p-6">
          <div className="space-y-6 text-gray-700 text-base leading-relaxed">
            <section>
              <h2 className="text-xl font-semibold mb-3 text-gray-900">1. Acceptance of Terms</h2>
              <p>By installing and using Bizzy POS, you agree to these terms and conditions.</p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3 text-gray-900">2. Data Privacy</h2>
              <p>
                Bizzy POS stores business data locally on your device. For backup and sync functionality,
                data may be transmitted to secure servers. We implement industry-standard security measures
                to protect your information.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3 text-gray-900">3. Offline Functionality</h2>
              <p>
                The application works offline and syncs data when internet connection is available.
                You are responsible for maintaining regular backups of your business data.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3 text-gray-900">4. Payment Processing</h2>
              <p>
                While Bizzy POS facilitates sales tracking, payment processing is handled through
                third-party providers. Ensure compliance with PCI DSS standards for payment data.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3 text-gray-900">5. License & Usage</h2>
              <p>
                Bizzy POS is licensed for business use. You may not reverse engineer, modify,
                or distribute the software without authorization.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3 text-gray-900">6. Limitation of Liability</h2>
              <p>
                The software is provided "as is". We are not liable for business losses,
                data loss, or interruptions in service. Regular data backups are recommended.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3 text-gray-900">7. Updates</h2>
              <p>
                The application may automatically update to provide new features and security patches.
              </p>
            </section>
          </div>

          {/* Acceptance Section - Always visible */}
          <div className="mt-8 p-6 bg-blue-50 rounded-lg border border-blue-200">
            <div className="flex items-center mb-4">
              <input
                type="checkbox"
                id="accept-terms"
                checked={accepted}
                onChange={(e) => setAccepted(e.target.checked)}
                className="h-5 w-5 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="accept-terms" className="ml-3 block text-lg font-medium text-gray-900">
                I have read and agree to the Terms & Conditions
              </label>
            </div>

            <button
              onClick={onAccept}
              disabled={!accepted}
              className={`w-full py-4 px-6 border border-transparent rounded-lg shadow-sm text-lg font-semibold text-white transition-colors ${
                accepted
                  ? 'bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-4 focus:ring-blue-300 cursor-pointer'
                  : 'bg-gray-400 cursor-not-allowed'
              }`}
            >
              Accept & Continue
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TermsAndConditions;
