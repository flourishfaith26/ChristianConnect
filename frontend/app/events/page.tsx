'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@clerk/nextjs';
import { apiRequest } from '@/lib/api';
import BackButton from '@/components/BackButton';

interface Event {
  id: string;
  title: string;
  description: string | null;
  type: string;
  locationCity: string;
  locationRegion: string;
  address: string | null;
  eventDate: string;
  organization: string | null;
  goingCount: number;
  myRsvp: 'going' | 'maybe' | 'declined' | null;
  createdBy: {
    id: string;
    displayName: string;
    avatarUrl: string | null;
  };
}

export default function EventsPage() {
  const { getToken } = useAuth();
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [cityFilter, setCityFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');

  // Create Modal
  const [showCreate, setShowCreate] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState('service');
  const [locationCity, setLocationCity] = useState('');
  const [locationRegion, setLocationRegion] = useState('');
  const [address, setAddress] = useState('');
  const [eventDate, setEventDate] = useState('');
  const [organization, setOrganization] = useState('');
  const [saving, setSaving] = useState(false);

  const loadEvents = useCallback(async () => {
    try {
      const token = await getToken();
      const params = new URLSearchParams();
      if (search) params.set('search', search);
      if (cityFilter) params.set('city', cityFilter);
      if (typeFilter) params.set('type', typeFilter);

      const res = await apiRequest<Event[]>(`/api/events?${params}`, {
        token: token ?? undefined,
      });
      setEvents(res);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, [getToken, search, cityFilter, typeFilter]);

  useEffect(() => { loadEvents(); }, [loadEvents]);

  const handleRsvp = async (eventId: string, status: 'going' | 'maybe' | 'declined') => {
    try {
      const token = await getToken();
      await apiRequest(`/api/events/${eventId}/rsvp`, {
        method: 'POST',
        token: token ?? undefined,
        body: JSON.stringify({ status }),
      });

      setEvents(prev => prev.map(e => {
        if (e.id === eventId) {
          const wasGoing = e.myRsvp === 'going';
          const isGoing = status === 'going';
          const newCount = e.goingCount + (isGoing && !wasGoing ? 1 : !isGoing && wasGoing ? -1 : 0);
          return { ...e, myRsvp: status, goingCount: Math.max(0, newCount) };
        }
        return e;
      }));
    } catch {
      alert('Could not update RSVP');
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !locationCity.trim() || !locationRegion.trim() || !eventDate) return;

    setSaving(true);
    try {
      const token = await getToken();
      const newEv = await apiRequest<Event>('/api/events', {
        method: 'POST',
        token: token ?? undefined,
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim() || undefined,
          type,
          locationCity: locationCity.trim(),
          locationRegion: locationRegion.trim(),
          address: address.trim() || undefined,
          eventDate,
          organization: organization.trim() || undefined,
        }),
      });

      setEvents(prev => [{ ...newEv, goingCount: 1, myRsvp: 'going' }, ...prev]);
      setShowCreate(false);
      setTitle('');
      setDescription('');
      setLocationCity('');
      setLocationRegion('');
      setAddress('');
      setEventDate('');
      setOrganization('');
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Could not create event');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="page-container-wide">
      <div style={{ maxWidth: '960px', margin: '0 auto' }}>
        <BackButton />

        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px', marginBottom: '32px' }}>
          <div>
            <h1 style={{ fontSize: '28px', fontFamily: 'var(--font-serif)', fontWeight: 700, marginBottom: '4px' }}>
              🗓️ Events & Church Calendar
            </h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>
              Discover local church services, conferences, retreats, and small group gatherings.
            </p>
          </div>

          <button type="button" onClick={() => setShowCreate(true)} className="btn btn-primary">
            + Host Event
          </button>
        </div>

        {/* Search & Filters */}
        <div style={{ display: 'flex', gap: '12px', marginBottom: '24px', flexWrap: 'wrap' }}>
          <input
            type="text"
            className="form-input"
            placeholder="Search events, churches..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ flex: 2, minWidth: '200px' }}
          />

          <input
            type="text"
            className="form-input"
            placeholder="Filter by City..."
            value={cityFilter}
            onChange={e => setCityFilter(e.target.value)}
            style={{ flex: 1, minWidth: '140px' }}
          />

          <select
            className="form-input"
            value={typeFilter}
            onChange={e => setTypeFilter(e.target.value)}
            style={{ width: '160px' }}
          >
            <option value="">All Event Types</option>
            <option value="service">Church Service</option>
            <option value="conference">Conference</option>
            <option value="retreat">Retreat</option>
            <option value="small_group">Small Group</option>
            <option value="social">Social Gathering</option>
          </select>
        </div>

        {loading && (
          <div style={{ textAlign: 'center', padding: '48px', color: 'var(--text-muted)' }}>
            Loading events...
          </div>
        )}

        {/* Empty state */}
        {!loading && events.length === 0 && (
          <div className="card" style={{ textAlign: 'center', padding: '48px' }}>
            <div style={{ fontSize: '40px', marginBottom: '12px' }}>⛪</div>
            <h3 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '8px' }}>No events found</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginBottom: '20px' }}>
              Be the first to post a church service, conference, or retreat for your area!
            </p>
            <button type="button" onClick={() => setShowCreate(true)} className="btn btn-primary">
              Post an Event →
            </button>
          </div>
        )}

        {/* Events Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(420px, 1fr))', gap: '20px' }}>
          {events.map(ev => (
            <div key={ev.id} className="card animate-fade-in" style={{ padding: '24px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                  <span style={{
                    fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em',
                    color: 'var(--brand-primary)', background: 'rgba(46,125,50,0.1)', padding: '3px 10px', borderRadius: '99px',
                  }}>
                    {ev.type}
                  </span>
                  <span style={{ fontSize: '12px', color: 'var(--brand-gold)', fontWeight: 600 }}>
                    👥 {ev.goingCount} Going
                  </span>
                </div>

                <h3 style={{ fontSize: '20px', fontWeight: 700, marginBottom: '6px', color: 'var(--text-primary)' }}>
                  {ev.title}
                </h3>

                <p style={{ fontSize: '13px', color: 'var(--brand-primary)', fontWeight: 600, marginBottom: '10px' }}>
                  📍 {ev.locationCity}, {ev.locationRegion} {ev.address ? `(${ev.address})` : ''}
                </p>

                <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '14px' }}>
                  🗓️ {new Date(ev.eventDate).toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                </p>

                {ev.organization && (
                  <p style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: 600, marginBottom: '12px' }}>
                    Hosted by: {ev.organization}
                  </p>
                )}

                {ev.description && (
                  <p style={{ fontSize: '14px', color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: '20px' }}>
                    {ev.description}
                  </p>
                )}
              </div>

              {/* RSVP Action Bar */}
              <div style={{ display: 'flex', gap: '8px', borderTop: '1px solid var(--border-subtle)', paddingTop: '16px' }}>
                <button
                  type="button"
                  className={`btn btn-sm ${ev.myRsvp === 'going' ? 'btn-primary' : 'btn-outline'}`}
                  style={{ flex: 1 }}
                  onClick={() => handleRsvp(ev.id, 'going')}
                >
                  {ev.myRsvp === 'going' ? '✅ Going' : 'Going'}
                </button>
                <button
                  type="button"
                  className={`btn btn-sm ${ev.myRsvp === 'maybe' ? 'btn-gold' : 'btn-ghost'}`}
                  style={{ flex: 1 }}
                  onClick={() => handleRsvp(ev.id, 'maybe')}
                >
                  {ev.myRsvp === 'maybe' ? '🤔 Maybe' : 'Maybe'}
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Create Event Modal */}
        {showCreate && (
          <div style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 1000,
            display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px',
          }}>
            <div className="card animate-fade-in" style={{ maxWidth: '600px', width: '100%', padding: '32px', maxHeight: '90vh', overflow: 'auto' }}>
              <h2 style={{ fontSize: '22px', fontWeight: 700, marginBottom: '16px' }}>
                🗓️ Host a Church or Group Event
              </h2>

              <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div className="form-group">
                  <label htmlFor="ev-title" className="form-label">Event Title *</label>
                  <input
                    id="ev-title"
                    type="text"
                    className="form-input"
                    placeholder="e.g. Sunday Worship Service & Fellowship"
                    value={title}
                    onChange={e => setTitle(e.target.value)}
                    required
                  />
                </div>

                <div style={{ display: 'flex', gap: '12px' }}>
                  <div className="form-group" style={{ flex: 1 }}>
                    <label htmlFor="ev-type" className="form-label">Event Type</label>
                    <select
                      id="ev-type"
                      className="form-input"
                      value={type}
                      onChange={e => setType(e.target.value)}
                    >
                      <option value="service">Church Service</option>
                      <option value="conference">Conference</option>
                      <option value="retreat">Retreat</option>
                      <option value="small_group">Small Group</option>
                      <option value="social">Social Gathering</option>
                    </select>
                  </div>

                  <div className="form-group" style={{ flex: 1 }}>
                    <label htmlFor="ev-date" className="form-label">Date & Time *</label>
                    <input
                      id="ev-date"
                      type="datetime-local"
                      className="form-input"
                      value={eventDate}
                      onChange={e => setEventDate(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '12px' }}>
                  <div className="form-group" style={{ flex: 1 }}>
                    <label htmlFor="ev-city" className="form-label">City *</label>
                    <input
                      id="ev-city"
                      type="text"
                      className="form-input"
                      placeholder="e.g. Lagos"
                      value={locationCity}
                      onChange={e => setLocationCity(e.target.value)}
                      required
                    />
                  </div>

                  <div className="form-group" style={{ flex: 1 }}>
                    <label htmlFor="ev-region" className="form-label">State / Region *</label>
                    <input
                      id="ev-region"
                      type="text"
                      className="form-input"
                      placeholder="e.g. Lagos State"
                      value={locationRegion}
                      onChange={e => setLocationRegion(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label htmlFor="ev-address" className="form-label">Address / Venue</label>
                  <input
                    id="ev-address"
                    type="text"
                    className="form-input"
                    placeholder="e.g. Grace Chapel Main Auditorium, 12 Faith St."
                    value={address}
                    onChange={e => setAddress(e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="ev-org" className="form-label">Church / Organization Name</label>
                  <input
                    id="ev-org"
                    type="text"
                    className="form-input"
                    placeholder="e.g. Grace Community Church"
                    value={organization}
                    onChange={e => setOrganization(e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="ev-desc" className="form-label">Description</label>
                  <textarea
                    id="ev-desc"
                    className="form-input"
                    rows={3}
                    placeholder="Event details, schedule, or notes for attendees..."
                    value={description}
                    onChange={e => setDescription(e.target.value)}
                  />
                </div>

                <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '12px' }}>
                  <button type="button" className="btn btn-ghost" onClick={() => setShowCreate(false)}>
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary" disabled={saving}>
                    {saving ? 'Creating Event...' : 'Create & Publish Event'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
