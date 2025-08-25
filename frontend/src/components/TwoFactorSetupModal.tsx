import React, { useState } from 'react';
import { twoFactorService } from '../services/twoFactor';

interface TwoFactorSetupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSetupComplete: () => void;
}

const TwoFactorSetupModal: React.FC<TwoFactorSetupModalProps> = ({
  isOpen,
  onClose,
  onSetupComplete
}) => {
  const [step, setStep] = useState<'setup' | 'verify'>('setup');
  const [verificationCode, setVerificationCode] = useState('');
  const [setupData, setSetupData] = useState<any>(null);
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSetup = async () => {
    setIsLoading(true);
    setError('');
    try {
      const data = await twoFactorService.setup();
      setSetupData(data);
      setBackupCodes(data.backup_codes);
      setStep('verify');
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to setup 2FA');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerify = async () => {
    if (!verificationCode) {
      setError('Please enter verification code');
      return;
    }

    setIsLoading(true);
    setError('');
    try {
      await twoFactorService.verify(verificationCode);
      onSetupComplete();
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Invalid verification code');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownloadBackupCodes = () => {
    const blob = new Blob([backupCodes.join('\n')], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'bizzy-2fa-backup-codes.txt';
    a.click();
    URL.revokeObjectURL(url);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      {/* FIXED: Added max-h-[90vh] and overflow-y-auto to make modal content scrollable */}
      <div className="bg-white rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
        <h2 className="text-2xl font-bold mb-4">Two-Factor Authentication Setup</h2>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        {step === 'setup' && (
          <div className="space-y-4">
            <p className="text-gray-600">
              Enable two-factor authentication to add an extra layer of security to your account.
            </p>
            <button
              onClick={handleSetup}
              disabled={isLoading}
              className="w-full bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 disabled:opacity-50"
            >
              {isLoading ? 'Setting up...' : 'Start Setup'}
            </button>
          </div>
        )}

        {step === 'verify' && setupData && (
          <div className="space-y-4">
            <p className="text-gray-600">
              Scan this QR code with your authenticator app (Google Authenticator, Authy, etc.)
            </p>

            <div className="flex justify-center">
              <img
                src={setupData.qr_code_url}
                alt="QR Code"
                className="w-48 h-48"
              />
            </div>

            <div className="bg-gray-100 p-3 rounded">
              <p className="text-sm text-gray-600 mb-1">Or enter this secret key manually:</p>
              <code className="text-sm font-mono bg-white p-1 rounded">
                {setupData.secret_key}
              </code>
            </div>

            {/* Improved input and testing instructions */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Verification Code
              </label>
              <input
                type="text"
                inputMode="numeric" // Brings up numeric keypad on mobile
                pattern="[0-9]*"   // Helps with numeric input
                value={verificationCode}
                onChange={(e) => {
                  // Only allow numbers and limit to 6 digits
                  const onlyNums = e.target.value.replace(/\D/g, '');
                  setVerificationCode(onlyNums.slice(0, 6));
                }}
                placeholder="Enter 6-digit code"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <p className="text-xs text-gray-500 mt-1">
                Enter the 6-digit code from your authenticator app.
              </p>

              {/* TESTING INSTRUCTIONS */}
              {setupData && (
                <div className="mt-3 p-3 bg-gray-100 rounded-md">
                  <p className="text-xs font-semibold text-gray-700 mb-1">🧪 TESTING THIS FEATURE:</p>
                  <ol className="text-xs text-gray-600 list-decimal list-inside space-y-1">
                    <li>Install an authenticator app like <strong>Google Authenticator</strong> or <strong>Authy</strong> on your phone.</li>
                    <li>In the app, choose "<strong>Scan a QR code</strong>" and scan the code above.</li>
                    <li>The app will generate a 6-digit code that changes every 30 seconds.</li>
                    <li>Type the current 6-digit code from the app into the field above.</li>
                    <li>Click "<strong>Verify & Enable</strong>".</li>
                  </ol>
                  <p className="text-xs text-gray-700 mt-2">
                    <strong>Secret Key</strong> (for manual entry): <code className="text-xs">{setupData.secret_key}</code>
                  </p>
                </div>
              )}
            </div>

            <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3">
              <h3 className="font-medium text-yellow-800 mb-2">Backup Codes</h3>
              <p className="text-yellow-700 text-sm mb-2">
                Save these backup codes in a secure place. Each code can be used once if you lose access to your authenticator app.
              </p>
              <div className="grid grid-cols-2 gap-2 text-sm font-mono">
                {backupCodes.map((code, index) => (
                  <div key={index} className="bg-white p-1 rounded">
                    {code}
                  </div>
                ))}
              </div>
              <button
                onClick={handleDownloadBackupCodes}
                className="mt-2 text-blue-600 text-sm hover:underline"
              >
                Download Backup Codes
              </button>
            </div>

            <div className="flex space-x-2">
              <button
                onClick={handleVerify}
                disabled={isLoading || verificationCode.length !== 6}
                className="flex-1 bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 disabled:opacity-50"
              >
                {isLoading ? 'Verifying...' : 'Verify & Enable'}
              </button>
              <button
                onClick={onClose}
                className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded hover:bg-gray-400"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TwoFactorSetupModal;
