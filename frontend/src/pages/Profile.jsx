import { useState, useRef } from 'react';
import { FiUser, FiLock, FiCamera } from 'react-icons/fi';
import { useAuth } from '../context/AuthContext';
import { userService } from '../services/userService';
import { useToast } from '../context/ToastContext';

const Profile = () => {
  const { user, updateUser } = useAuth();
  const toast = useToast();
  const fileInputRef = useRef(null);

  // Profile Form State
  const [profileForm, setProfileForm] = useState({
    name: user?.name || '',
    phone: user?.phone || '',
    flatNumber: user?.flatNumber || '',
  });
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(user?.avatar?.url || '');
  const [savingProfile, setSavingProfile] = useState(false);

  // Password Form State
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [savingPassword, setSavingPassword] = useState(false);

  const handleProfileChange = (e) => {
    setProfileForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handlePasswordChange = (e) => {
    setPasswordForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleFileClick = () => fileInputRef.current?.click();

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        toast.error('Please select an image file');
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Image size should be less than 5MB');
        return;
      }
      setAvatarFile(file);
      setAvatarPreview(URL.createObjectURL(file));
    }
  };

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setSavingProfile(true);
    try {
      const formData = new FormData();
      formData.append('name', profileForm.name);
      formData.append('phone', profileForm.phone);
      formData.append('flatNumber', profileForm.flatNumber);
      if (avatarFile) {
        formData.append('avatar', avatarFile);
      }

      const { data } = await userService.updateProfile(formData);
      updateUser(data.user);
      toast.success('Profile updated successfully');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update profile');
    } finally {
      setSavingProfile(false);
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast.error('New passwords do not match');
      return;
    }
    setSavingPassword(true);
    try {
      await userService.updatePassword({
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword,
      });
      toast.success('Password updated successfully');
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update password');
    } finally {
      setSavingPassword(false);
    }
  };

  return (
    <div style={{ maxWidth: 800 }}>
      <div style={{ marginBottom: 'var(--space-6)' }}>
        <h1>My Profile</h1>
        <p className="text-secondary">Manage your personal information and security settings</p>
      </div>

      <div className="row gap-5" style={{ flexWrap: 'wrap', alignItems: 'flex-start' }}>
        {/* Profile Info Form */}
        <div className="card" style={{ flex: '1 1 400px' }}>
          <h3 className="row gap-2" style={{ marginBottom: 'var(--space-5)' }}>
            <FiUser size={18} /> Basic Information
          </h3>

          <form onSubmit={handleProfileSubmit} className="stack gap-4">
            <div className="row gap-4" style={{ alignItems: 'center' }}>
              <div
                className="avatar-upload"
                onClick={handleFileClick}
                style={{
                  width: 80,
                  height: 80,
                  borderRadius: '50%',
                  background: avatarPreview ? `url(${avatarPreview}) center/cover` : 'var(--accent)',
                  color: 'var(--accent-contrast)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '1.5rem',
                  fontWeight: 700,
                  position: 'relative',
                  cursor: 'pointer',
                  flexShrink: 0,
                }}
              >
                {!avatarPreview && user?.name[0].toUpperCase()}
                <div
                  className="avatar-overlay"
                  style={{
                    position: 'absolute',
                    inset: 0,
                    background: 'rgba(0,0,0,0.5)',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#fff',
                    opacity: 0,
                    transition: 'opacity var(--duration-fast)',
                  }}
                >
                  <FiCamera size={20} />
                </div>
              </div>
              <div>
                <button type="button" className="btn btn-sm btn-ghost" onClick={handleFileClick}>
                  Change Avatar
                </button>
                <p className="text-muted" style={{ fontSize: '0.75rem', marginTop: 4 }}>
                  JPG, PNG or GIF. Max 5MB.
                </p>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept="image/*"
                  style={{ display: 'none' }}
                />
              </div>
            </div>

            <div className="field">
              <label htmlFor="name">Full Name</label>
              <input
                id="name"
                name="name"
                type="text"
                className="input"
                value={profileForm.name}
                onChange={handleProfileChange}
                required
              />
            </div>

            <div className="row gap-3" style={{ flexWrap: 'wrap' }}>
              <div className="field" style={{ flex: '1 1 150px' }}>
                <label htmlFor="flatNumber">Flat Number</label>
                <input
                  id="flatNumber"
                  name="flatNumber"
                  type="text"
                  className="input"
                  value={profileForm.flatNumber}
                  onChange={handleProfileChange}
                  required
                />
              </div>
              <div className="field" style={{ flex: '1 1 200px' }}>
                <label htmlFor="phone">Phone Number</label>
                <input
                  id="phone"
                  name="phone"
                  type="tel"
                  className="input"
                  value={profileForm.phone}
                  onChange={handleProfileChange}
                />
              </div>
            </div>

            <div className="field">
              <label>Email Address</label>
              <input type="email" className="input" value={user?.email || ''} disabled />
              <p className="text-muted" style={{ fontSize: '0.75rem', marginTop: 4 }}>
                Email address cannot be changed.
              </p>
            </div>

            <div style={{ marginTop: 'var(--space-2)' }}>
              <button type="submit" className="btn btn-primary" disabled={savingProfile}>
                {savingProfile ? 'Saving…' : 'Save Changes'}
              </button>
            </div>
          </form>
        </div>

        {/* Security / Password Form */}
        <div className="card" style={{ flex: '1 1 300px' }}>
          <h3 className="row gap-2" style={{ marginBottom: 'var(--space-5)' }}>
            <FiLock size={18} /> Security
          </h3>

          <form onSubmit={handlePasswordSubmit} className="stack gap-4">
            <div className="field">
              <label htmlFor="currentPassword">Current Password</label>
              <input
                id="currentPassword"
                name="currentPassword"
                type="password"
                className="input"
                value={passwordForm.currentPassword}
                onChange={handlePasswordChange}
                required
              />
            </div>
            <div className="field">
              <label htmlFor="newPassword">New Password</label>
              <input
                id="newPassword"
                name="newPassword"
                type="password"
                className="input"
                value={passwordForm.newPassword}
                onChange={handlePasswordChange}
                required
                minLength={8}
              />
            </div>
            <div className="field">
              <label htmlFor="confirmPassword">Confirm New Password</label>
              <input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                className="input"
                value={passwordForm.confirmPassword}
                onChange={handlePasswordChange}
                required
                minLength={8}
              />
            </div>
            <div style={{ marginTop: 'var(--space-2)' }}>
              <button type="submit" className="btn btn-primary" disabled={savingPassword}>
                {savingPassword ? 'Updating…' : 'Update Password'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Profile;
