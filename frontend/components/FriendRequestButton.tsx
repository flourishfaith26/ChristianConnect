'use client';

import { useState } from 'react';
import { useAuth } from '@clerk/nextjs';
import { apiRequest } from '@/lib/api';

interface FriendRequestButtonProps {
  targetUserId: string;
  initialStatus?: string; // "none" | "pending_sent" | "pending_received" | "accepted" | "blocked"
  onStatusChange?: (newStatus: string) => void;
  size?: 'sm' | 'md';
  className?: string;
}

export default function FriendRequestButton({
  targetUserId,
  initialStatus = 'none',
  onStatusChange,
  size = 'md',
  className = '',
}: FriendRequestButtonProps) {
  const { getToken } = useAuth();
  const [status, setStatus] = useState<string>(initialStatus);
  const [loading, setLoading] = useState<boolean>(false);
  const [showCancelDropdown, setShowCancelDropdown] = useState<boolean>(false);

  const updateStatus = (newStatus: string) => {
    setStatus(newStatus);
    if (onStatusChange) onStatusChange(newStatus);
  };

  // Send Friend Request
  const handleSendRequest = async () => {
    setLoading(true);
    try {
      const token = await getToken();
      const res = await apiRequest<{ success: boolean; status: string }>('/api/friends/request', {
        method: 'POST',
        token: token ?? undefined,
        body: JSON.stringify({ recipientId: targetUserId }),
      });
      if (res.success) updateStatus('pending_sent');
    } catch {
      // Revert if error
    } finally {
      setLoading(false);
    }
  };

  // Cancel Pending Sent Request
  const handleCancelRequest = async () => {
    setLoading(true);
    setShowCancelDropdown(false);
    try {
      const token = await getToken();
      await apiRequest('/api/friends/cancel', {
        method: 'POST',
        token: token ?? undefined,
        body: JSON.stringify({ recipientId: targetUserId }),
      });
      updateStatus('none');
    } catch {
      // Ignore
    } finally {
      setLoading(false);
    }
  };

  // Accept Friend Request
  const handleAcceptRequest = async () => {
    setLoading(true);
    try {
      const token = await getToken();
      const res = await apiRequest<{ success: boolean; status: string }>('/api/friends/accept', {
        method: 'POST',
        token: token ?? undefined,
        body: JSON.stringify({ requesterId: targetUserId }),
      });
      if (res.success) updateStatus('accepted');
    } catch {
      // Ignore
    } finally {
      setLoading(false);
    }
  };

  // Remove Accepted Friend
  const handleRemoveFriend = async () => {
    setLoading(true);
    try {
      const token = await getToken();
      await apiRequest('/api/friends/remove', {
        method: 'POST',
        token: token ?? undefined,
        body: JSON.stringify({ friendId: targetUserId }),
      });
      updateStatus('none');
    } catch {
      // Ignore
    } finally {
      setLoading(false);
    }
  };

  const isSmall = size === 'sm';
  const padding = isSmall ? '4px 10px' : '6px 14px';
  const fontSize = isSmall ? '11px' : '12px';

  if (status === 'blocked') {
    return (
      <span
        style={{
          fontSize,
          padding,
          borderRadius: '16px',
          backgroundColor: '#f1f5f9',
          color: '#94a3b8',
          fontWeight: 600,
        }}
        className={className}
      >
        Blocked
      </span>
    );
  }

  if (status === 'accepted') {
    return (
      <div style={{ position: 'relative' }} className={className}>
        <button
          onClick={handleRemoveFriend}
          disabled={loading}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '4px',
            backgroundColor: '#e8f5e9',
            color: '#2e7d32',
            border: '1px solid rgba(46, 125, 50, 0.3)',
            borderRadius: '16px',
            padding,
            fontSize,
            fontWeight: 700,
            cursor: 'pointer',
          }}
        >
          <span>✓ Friends</span>
        </button>
      </div>
    );
  }

  if (status === 'pending_received') {
    return (
      <button
        onClick={handleAcceptRequest}
        disabled={loading}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '4px',
          backgroundColor: '#2e7d32',
          color: '#ffffff',
          border: 'none',
          borderRadius: '16px',
          padding,
          fontSize,
          fontWeight: 700,
          cursor: 'pointer',
          boxShadow: '0 2px 6px rgba(46, 125, 50, 0.2)',
        }}
        className={className}
      >
        <span>Accept Request</span>
      </button>
    );
  }

  if (status === 'pending_sent') {
    return (
      <div style={{ position: 'relative', display: 'inline-block' }} className={className}>
        <button
          onClick={() => setShowCancelDropdown(!showCancelDropdown)}
          disabled={loading}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '4px',
            backgroundColor: '#f1f5f9',
            color: '#64748b',
            border: '1px solid #cbd5e1',
            borderRadius: '16px',
            padding,
            fontSize,
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          <span>⌛ Request Sent</span>
          <span style={{ fontSize: '9px' }}>▼</span>
        </button>

        {showCancelDropdown && (
          <div
            style={{
              position: 'absolute',
              top: '32px',
              right: 0,
              backgroundColor: '#ffffff',
              border: '1px solid #cbd5e1',
              borderRadius: '8px',
              boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
              zIndex: 50,
              overflow: 'hidden',
            }}
          >
            <button
              onClick={handleCancelRequest}
              style={{
                display: 'block',
                width: '100%',
                padding: '6px 12px',
                fontSize: '11px',
                color: '#e11d48',
                backgroundColor: '#ffffff',
                border: 'none',
                cursor: 'pointer',
                textAlign: 'left',
                whiteSpace: 'nowrap',
              }}
            >
              Cancel Request
            </button>
          </div>
        )}
      </div>
    );
  }

  // Default: "none" -> "+ Add Friend"
  return (
    <button
      onClick={handleSendRequest}
      disabled={loading}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '4px',
        backgroundColor: '#ffffff',
        color: '#2e7d32',
        border: '1px solid #2e7d32',
        borderRadius: '16px',
        padding,
        fontSize,
        fontWeight: 700,
        cursor: 'pointer',
        transition: 'all 0.15s ease',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.backgroundColor = '#2e7d32';
        e.currentTarget.style.color = '#ffffff';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.backgroundColor = '#ffffff';
        e.currentTarget.style.color = '#2e7d32';
      }}
      className={className}
    >
      <span>+ Add Friend</span>
    </button>
  );
}
