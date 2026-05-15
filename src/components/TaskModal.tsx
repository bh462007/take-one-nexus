import React, { useState } from 'react';
import { getAvatarUrl } from '@/lib/avatars';

interface User {
  id: number;
  name: string;
  avatar_url?: string;
  gender?: string;
}

interface TaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  conversationId: number;
  members: User[];
  onCreate: (taskData: any) => Promise<void>;
  myRole: string;
  isGroup: boolean;
  globalRole: string;
}

export default function TaskModal({ 
  isOpen, 
  onClose, 
  conversationId, 
  members, 
  onCreate,
  myRole,
  isGroup,
  globalRole
}: TaskModalProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState('Medium');
  const [assigneeId, setAssigneeId] = useState<number | ''>('');
  const [dueDate, setDueDate] = useState('');
  const [rewardCredits, setRewardCredits] = useState<number>(0);
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    setLoading(true);
    try {
      await onCreate({
        conversationId,
        title: title.trim(),
        description: description.trim(),
        priority,
        assigneeId: assigneeId === '' ? null : assigneeId,
        dueDate: dueDate || null,
        rewardCredits
      });
      setTitle('');
      setDescription('');
      setPriority('Medium');
      setAssigneeId('');
      setDueDate('');
      setRewardCredits(0);
      onClose();
    } catch (err) {
      console.error('Failed to create task:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content bento-card" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Assign Mission</h3>
          <button onClick={onClose} className="close-btn">&times;</button>
        </div>
        
        <form onSubmit={handleSubmit} className="modal-form">
          <div className="form-group">
            <label>Objective</label>
            <input 
              type="text" 
              placeholder="e.g. Finish script draft" 
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              autoFocus
            />
          </div>

          <div className="form-group">
            <label>Field Briefing</label>
            <textarea 
              placeholder="Detailed instructions for the operative..." 
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Priority</label>
              <select value={priority} onChange={(e) => setPriority(e.target.value)}>
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
                <option value="Critical">Critical</option>
              </select>
            </div>

            <div className="form-group">
              <label>Deadline</label>
              <input 
                type="date" 
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
              />
            </div>
          </div>

          <div className="form-group">
            <label>Assigned To</label>
            <div className="assignee-selector">
              <select value={assigneeId} onChange={(e) => setAssigneeId(e.target.value === '' ? '' : Number(e.target.value))}>
                <option value="">Unassigned</option>
                {members.map(member => (
                  <option key={member.id} value={member.id}>{member.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="form-group">
            <label>Mission Reward (Credits)</label>
            <input 
              type="number" 
              min="0"
              max="500"
              value={rewardCredits}
              onChange={(e) => setRewardCredits(Number(e.target.value))}
              placeholder="0"
            />
            <small style={{ opacity: 0.5, fontSize: '0.7rem', marginTop: '4px', display: 'block' }}>
              Credits awarded after mission completion and approval.
            </small>
          </div>

          <div className="modal-actions">
            <button type="button" onClick={onClose} className="cancel-btn">Abort</button>
            <button type="submit" className="confirm-btn" disabled={loading || !title.trim()}>
              {loading ? 'Transmitting...' : 'Assign Mission'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
