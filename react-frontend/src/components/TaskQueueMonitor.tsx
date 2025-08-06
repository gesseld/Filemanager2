import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { getQueueStatus } from '../services/api';

interface QueueStatus {
  active: Record<string, any[]>;
  reserved: Record<string, any[]>;
  scheduled: Record<string, any[]>;
  stats: Record<string, any>;
  registered_tasks: Record<string, string[]>;
}

const TaskQueueMonitor: React.FC = () => {
  const [queueStatus, setQueueStatus] = useState<QueueStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchQueueStatus = async () => {
      try {
        const status = await getQueueStatus();
        setQueueStatus(status);
        setError(null);
      } catch (err) {
        if (axios.isAxiosError(err)) {
          setError(err.response?.data?.message || 'Failed to load queue status');
        } else {
          setError('Failed to load queue status');
        }
        console.error('Queue status error:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchQueueStatus();
    const interval = setInterval(fetchQueueStatus, 5000);
    
    return () => clearInterval(interval);
  }, []);

  if (isLoading) return <div>Loading queue status...</div>;
  if (error) return <div className="error">{error}</div>;
  if (!queueStatus) return <div>No queue data available</div>;

  return (
    <div className="queue-monitor">
      <h3>Task Queue Status</h3>
      
      <div className="queue-stats">
        <div className="stat">
          <h4>Workers</h4>
          <p>{Object.keys(queueStatus.stats || {}).length}</p>
        </div>
        <div className="stat">
          <h4>Active Tasks</h4>
          <p>{Object.values(queueStatus.active || {}).flat().length}</p>
        </div>
        <div className="stat">
          <h4>Scheduled Tasks</h4>
          <p>{Object.values(queueStatus.scheduled || {}).flat().length}</p>
        </div>
      </div>

      <div className="worker-list">
        <h4>Workers</h4>
        <ul>
          {Object.entries(queueStatus.stats || {}).map(([worker, stats]) => (
            <li key={worker}>
              <strong>{worker}</strong>
              <div>Tasks: {stats['total']}</div>
              <div>CPU: {stats['cpu']}%</div>
              <div>Memory: {stats['mem']}MB</div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default TaskQueueMonitor;