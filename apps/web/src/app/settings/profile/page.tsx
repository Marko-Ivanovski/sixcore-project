'use client';

import { useState, useEffect } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { updateProfile } from '@/lib/users';
import { Modal } from '@/components/ui/Modal';
import { checkPasswordStrength } from '@/utils/validation';
import { uploadImage, validateImageFile } from '@/lib/uploads';

export default function EditProfilePage() {
  const { user, refreshUser } = useAuth();
  const [activeTab, setActiveTab] = useState<'account' | 'profile'>('profile');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Profile Form State
  const [displayName, setDisplayName] = useState(user?.displayName || '');
  const [bio, setBio] = useState(user?.bio || '');
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(user?.avatarUrl || null);
  const [avatarError, setAvatarError] = useState<string | null>(null);

  // Sync state with user data when it loads
  useEffect(() => {
    if (user) {
      setDisplayName(user.displayName || '');
      setBio(user.bio || '');
      setPreviewUrl(user.avatarUrl ? encodeURI(user.avatarUrl) : null);
    }
  }, [user]);

  // Modals State
  const [isEmailModalOpen, setIsEmailModalOpen] = useState(false);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);

  // Email Modal State
  const [oldEmail, setOldEmail] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [confirmNewEmail, setConfirmNewEmail] = useState('');
  const [emailError, setEmailError] = useState<string | null>(null);

  // Password Modal State
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [passwordErrors, setPasswordErrors] = useState<string[]>([]);
  const [passwordSubmitError, setPasswordSubmitError] = useState<string | null>(null);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Handlers
  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const validationError = validateImageFile(file);
      if (validationError) {
        setAvatarError(validationError);
        e.target.value = '';
        return;
      }

      if (previewUrl && previewUrl.startsWith('blob:')) {
        URL.revokeObjectURL(previewUrl);
      }

      setAvatarFile(file);
      setPreviewUrl(URL.createObjectURL(file));
      setAvatarError(null);
    }
  };

  const uploadAvatar = async (): Promise<string | null> => {
    if (!avatarFile) return null;
    return uploadImage(avatarFile, 'avatars');
  };

  const handleProfileSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      let avatarUrl = undefined;
      if (avatarFile) {
        avatarUrl = await uploadAvatar() || undefined;
      }

      await updateProfile({
        displayName,
        bio,
        ...(avatarUrl ? { avatarUrl } : {}),
      });
      
      await refreshUser();
      setAvatarFile(null); // Clear the file so preview uses the server URL
      setAvatarError(null);
      setMessage({ type: 'success', text: 'Profile updated successfully' });
    } catch (err: any) {
       console.error(err);
       setMessage({ type: 'error', text: err.message || 'Failed to update profile' });
    } finally {
      setLoading(false);
    }
  };

  const handleEmailSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setEmailError(null);

    // Client-side verification of old email (as requested)
    if (oldEmail.toLowerCase() !== user?.email.toLowerCase()) {
      setEmailError('Old email does not match.');
      return;
    }

    if (newEmail !== confirmNewEmail) {
      setEmailError('New emails do not match.');
      return;
    }

    if (newEmail.toLowerCase() === user?.email.toLowerCase()) {
      setEmailError('New email must be different.');
      return;
    }

    setLoading(true);
    try {
      await updateProfile({ email: newEmail });
      await refreshUser();
      setIsEmailModalOpen(false);
      setMessage({ type: 'success', text: 'Email updated successfully' });
      // Reset form
      setOldEmail('');
      setNewEmail('');
      setConfirmNewEmail('');
    } catch (err: any) {
      console.error(err);
      setEmailError(err.message || 'Failed to update email');
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordChangeInput = (pwd: string) => {
      setNewPassword(pwd);
      setPasswordErrors(checkPasswordStrength(pwd));
  };

  const handlePasswordSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordSubmitError(null);

    if (newPassword !== confirmNewPassword) {
      setPasswordSubmitError('Passwords do not match');
      return;
    }

    if (passwordErrors.length > 0) {
        return; // UI should disable button, but double check
    }

    setLoading(true);
    try {
      await updateProfile({ password: newPassword });
      setIsPasswordModalOpen(false);
      setMessage({ type: 'success', text: 'Password updated successfully' });
      // Reset form
      setNewPassword('');
      setConfirmNewPassword('');
      setPasswordErrors([]);
    } catch (err: any) {
      console.error(err);
      setPasswordSubmitError(err.message || 'Failed to update password');
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
      return <div className="p-8 text-center">Please log in.</div>;
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <h1 className="mb-6 text-3xl font-bold text-gray-900">Edit Profile</h1>
      
      {message && (
        <div className={`mb-6 rounded-lg p-4 ${
          message.type === 'success' ? 'bg-green-100 text-green-700 border border-green-200' : 'bg-red-100 text-red-700 border border-red-200'
        }`}>
          {message.text}
        </div>
      )}

      <div className="grid gap-8 md:grid-cols-[250px_1fr]">
        <aside>
          <nav className="flex flex-col space-y-1">
            <button
              onClick={() => setActiveTab('profile')}
              className={`rounded-lg px-4 py-2 text-left text-sm font-medium transition-colors ${
                activeTab === 'profile'
                  ? 'bg-blue-50 text-blue-700'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              Profile Information
            </button>
            <button
              onClick={() => setActiveTab('account')}
              className={`rounded-lg px-4 py-2 text-left text-sm font-medium transition-colors ${
                activeTab === 'account'
                  ? 'bg-blue-50 text-blue-700'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              Account Settings
            </button>
          </nav>
        </aside>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          {activeTab === 'profile' ? (
            <form onSubmit={handleProfileSave} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Profile Photo
                </label>
                <div className="flex items-center gap-6">
                  <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-full border border-gray-200">
                    {previewUrl ? (
                      /* eslint-disable-next-line @next/next/no-img-element */
                      <img
                        src={previewUrl}
                        alt="Preview"
                        className="h-full w-full object-cover"
                        onError={() => setPreviewUrl(null)}
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center bg-gray-100 text-gray-400">
                        No Photo
                      </div>
                    )}
                  </div>
                  <label className="cursor-pointer rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 transition">
                    Change Photo
                    <input type="file" className="hidden" accept="image/*" onChange={handleAvatarChange} />
                  </label>
                </div>
                {avatarError && <p className="mt-2 text-xs text-red-600">{avatarError}</p>}
              </div>

              <div>
                <label htmlFor="displayName" className="block text-sm font-medium text-gray-700">
                  Display Name
                </label>
                <input
                  type="text"
                  id="displayName"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-gray-900 sm:text-sm p-2 border"
                  placeholder="Your Name"
                />
              </div>

              <div>
                <label htmlFor="bio" className="block text-sm font-medium text-gray-700">
                  Bio
                </label>
                <textarea
                  id="bio"
                  rows={4}
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-gray-900 sm:text-sm p-2 border"
                  placeholder="Tell us about yourself"
                />
              </div>

            <div className="flex justify-end pt-4">
                <button
                  type="submit"
                  disabled={loading}
                  className="rounded-full bg-gray-900 px-6 py-2 text-sm font-semibold text-white shadow-sm hover:bg-gray-800 disabled:opacity-50"
                >
                  {loading ? 'Saving...' : 'Save Profile'}
                </button>
              </div>
            </form>
          ) : (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium text-gray-900">Email Address</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Current email: <span className="font-semibold text-gray-900">{user.email}</span>
                </p>
                <button
                  onClick={() => setIsEmailModalOpen(true)}
                  className="mt-3 rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50"
                  type="button"
                >
                  Change Email
                </button>
              </div>

              <div className="border-t border-gray-200 pt-6">
                <h3 className="text-lg font-medium text-gray-900">Password</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Update your password associated with your account.
                </p>
                <button
                  onClick={() => setIsPasswordModalOpen(true)}
                  className="mt-3 rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50"
                  type="button"
                >
                  Change Password
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Change Email Modal */}
      <Modal
        isOpen={isEmailModalOpen}
        onClose={() => setIsEmailModalOpen(false)}
        title="Change Email"
      >
        <form onSubmit={handleEmailSave} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Old Email</label>
              <input 
                type="email"
                required
                value={oldEmail}
                onChange={e => setOldEmail(e.target.value)}
                className="w-full rounded-md border border-gray-300 p-2 text-sm outline-none focus:border-blue-500"
                placeholder="Enter current email"
              />
            </div>
             <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">New Email</label>
              <input 
                type="email"
                required
                value={newEmail}
                onChange={e => setNewEmail(e.target.value)}
                className="w-full rounded-md border border-gray-300 p-2 text-sm outline-none focus:border-blue-500"
                placeholder="Enter new email"
              />
            </div>
             <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Confirm New Email</label>
              <input 
                type="email"
                required
                value={confirmNewEmail}
                onChange={e => setConfirmNewEmail(e.target.value)}
                className="w-full rounded-md border border-gray-300 p-2 text-sm outline-none focus:border-blue-500"
                placeholder="Confirm new email"
              />
            </div>
            {emailError && <p className="text-sm text-red-600">{emailError}</p>}
            <div className="flex justify-end gap-3 mt-6">
                <button 
                  type="button"
                  onClick={() => setIsEmailModalOpen(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-md"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  disabled={loading || !newEmail || !oldEmail || !confirmNewEmail}
                  className="px-4 py-2 text-sm font-semibold text-white bg-gray-900 hover:bg-gray-800 rounded-full disabled:opacity-50"
                >
                  {loading ? 'Saving...' : 'Save'}
                </button>
            </div>
        </form>
      </Modal>

      {/* Change Password Modal */}
      <Modal
        isOpen={isPasswordModalOpen}
        onClose={() => setIsPasswordModalOpen(false)}
        title="Change Password"
      >
        <form onSubmit={handlePasswordSave} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">New Password</label>
              <div className="relative">
                <input 
                  type={showNewPassword ? 'text' : 'password'}
                  required
                  value={newPassword}
                  onChange={e => handlePasswordChangeInput(e.target.value)}
                  className="w-full rounded-md border border-gray-300 p-2 pr-10 text-sm outline-none focus:border-blue-500"
                  placeholder="New password"
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword((prev) => !prev)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 transition hover:text-gray-600"
                  aria-label={showNewPassword ? 'Hide password' : 'Show password'}
                >
                  {showNewPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
            
            {passwordErrors.length > 0 && (
                <div className="text-xs text-red-600 space-y-1">
                    <p className="font-semibold text-gray-700">Password requirements:</p>
                    <ul className="list-disc pl-4">
                        {passwordErrors.map((err, i) => (
                            <li key={i}>{err}</li>
                        ))}
                    </ul>
                </div>
            )}

             <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Confirm New Password</label>
              <div className="relative">
                <input 
                  type={showConfirmPassword ? 'text' : 'password'}
                  required
                  value={confirmNewPassword}
                  onChange={e => setConfirmNewPassword(e.target.value)}
                  className="w-full rounded-md border border-gray-300 p-2 pr-10 text-sm outline-none focus:border-blue-500"
                  placeholder="Confirm new password"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword((prev) => !prev)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 transition hover:text-gray-600"
                  aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                >
                  {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {passwordSubmitError && <p className="text-sm text-red-600">{passwordSubmitError}</p>}
            <div className="flex justify-end gap-3 mt-6">
                <button 
                  type="button"
                  onClick={() => setIsPasswordModalOpen(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-md"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  disabled={loading || !newPassword || !confirmNewPassword || passwordErrors.length > 0}
                  className="px-4 py-2 text-sm font-semibold text-white bg-gray-900 hover:bg-gray-800 rounded-full disabled:opacity-50"
                >
                  {loading ? 'Saving...' : 'Save'}
                </button>
            </div>
        </form>
      </Modal>
    </div>
  );
}
