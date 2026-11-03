'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@clerk/nextjs';
import { apiRequest } from '@/lib/api';
import ReportButton from './ReportButton';

export interface IncomingRequest {
  id: string;
  createdAt: string;
  requester: {
    id: string;
    displayName: string;
    handle: string;
    avatarUrl: string;
    accountType: string;
    denomination: string;
    city: string;
    region: string;
    sharedContext?: string;
  };
}

export default function FriendRequestsInbox({ onRequestHandled }: { onRequestHandled?: () => void }) {
  const { getToken } = useAuth();
  const [requests, setRequests] = useState<IncomingRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<Record<string, boolean>>({});

  const loadInbox = useCallback(async () => {
    setLoading(true);
    try {
      const token = await getToken();
      const res = await apiRequest<{ requests: IncomingRequest[] }>('/api/friends/inbox', {
        token: token ?? undefined,
      });
      setRequests(res.requests || []);
    } catch {
      // Fallback
    } finally {
      setLoading(false);
    }
  }, [getToken]);

  useEffect(() => {
    loadInbox();
  }, [loadInbox]);

  const handleAccept = async (requesterId: string) => {
    setActionLoading((prev) => ({ ...prev, [requesterId]: true }));
    try {
      const token = await getToken();
      await apiRequest('/api/friends/accept', {
        method: 'POST',
        token: token ?? undefined,
        body: JSON.stringify({ requesterId }),
      });
      setRequests((prev) => prev.filter((r) => r.requester.id !== requesterId));
      if (onRequestHandled) onRequestHandled();
    } catch {
      // Ignore
    } finally {
      setActionLoading((prev) => ({ ...prev, [requesterId]: false }));
    }
  };

  const handleDecline = async (requesterId: string) => {
    setActionLoading((prev) => ({ ...prev, [requesterId]: true }));
    try {
      const token = await getToken();
      await apiRequest('/api/friends/decline', {
        method: 'POST',
        token: token ?? undefined,
        body: JSON.stringify({ requesterId }),
      });
      setRequests((prev) => prev.filter((r) => r.requester.id !== requesterId));
      if (onRequestHandled) onRequestHandled();
    } catch {
      // Ignore
    } finally {
      setActionLoading((prev) => ({ ...prev, [requesterId]: false }));
    }
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>
        Loading friend requests...
      </div>
    );
  }

  if (requests.length === 0) {
    return (
      <div
        style={{
          textAlign: 'center',
          padding: '48px 20px',
          backgroundColor: '#ffffff',
          borderRadius: '16px',
          border: '1px solid rgba(46, 125, 50, 0.15)',
        }}
      >
        <div style={{ fontSize: '36px', marginBottom: '8px' }}>📬</div>
        <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#1e293b' }}>No pending friend requests</h3>
        <p style={{ fontSize: '13px', color: '#64748b', margin: 0 }}>
          When other believers send you a connection request, it will appear here.
        </p>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
      {requests.map((req) => (
        <div
          key={req.id}
          style={{
            backgroundColor: '#ffffff',
            border: '1px solid rgba(46, 125, 50, 0.15)',
            borderRadius: '16px',
            padding: '16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '16px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.02)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <img
              src={req.requester.avatarUrl}
              alt={req.requester.displayName}
              style={{ width: '48px', height: '48px', borderRadius: '50%', objectFit: 'cover', border: '2px solid #2e7d32' }}
            />
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <h4 style={{ fontSize: '15px', fontWeight: 700, color: '#1e293b', margin: 0 }}>
                  {req.requester.displayName}
                </h4>
                <span style={{ fontSize: '12px', color: '#64748b' }}>{req.requester.handle}</span>
              </div>
              <p style={{ fontSize: '12px', color: '#334155', margin: '2px 0 0 0' }}>
                {req.requester.sharedContext || `Believer in ${req.requester.city}`}
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <ReportButton targetType="user" targetId={req.requester.id} label="Report" />
            <button
              onClick={() => handleDecline(req.requester.id)}
              disabled={actionLoading[req.requester.id]}
              style={{
                backgroundColor: '#f1f5f9',
                color: '#475569',
                border: '1px solid #cbd5e1',
                borderRadius: '16px',
                padding: '6px 14px',
                fontSize: '12px',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Decline
            </button>
            <button
              onClick={() => handleAccept(req.requester.id)}
              disabled={actionLoading[req.requester.id]}
              style={{
                backgroundColor: '#2e7d32',
                color: '#ffffff',
                border: 'none',
                borderRadius: '16px',
                padding: '6px 16px',
                fontSize: '12px',
                fontWeight: 700,
                cursor: 'pointer',
                boxShadow: '0 2px 6px rgba(46, 125, 50, 0.2)',
              }}
            >
              Accept
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
