import React, { useState, useEffect } from 'react';
import { ProcessingStatus } from '../types/content-extraction';
import { getProcessingStatus } from '../services/api';

const AIProcessingDashboard: React.FC = () => {
  const [processingTasks, setProcessingTasks] = useState<ProcessingStatus[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProcessingStatus = async () => {
      try {
        const status = await getProcessingStatus();
        setProcessingTasks(status);
      } catch (err) {
        setError('Failed to load processing status');
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProcessingStatus();
    const interval = setInterval(fetchProcessingStatus, 5000); // Refresh every 5 seconds
    
    return () => clearInterval(interval);
  }, []);

  if (isLoading) return <div>Loading processing status...</div>;
  if (error) return <div className="error">{error}</div>;

  return (
    <div className="ai-processing-dashboard">
      <h2>AI Processing Dashboard</h2>
      
      <div className="metrics">
        <div className="metric">
          <h3>Active Tasks</h3>
          <p>{processingTasks.length}</p>
        </div>
        <div className="metric">
          <h3>Completed Today</h3>
          <p>N/A</p> {/* Would come from backend metrics */}
        </div>
        <div className="metric">
          <h3>Avg Processing Time</h3>
          <p>N/A</p> {/* Would come from backend metrics */}
        </div>
      </div>

      <div className="task-list">
        <h3>Current Tasks</h3>
        <table>
          <thead>
            <tr>
              <th>File</th>
              <th>Type</th>
              <th>Status</th>
              <th>Progress</th>
            </tr>
          </thead>
          <tbody>
            {processingTasks.map(task => (
              <tr key={task.file_id}>
                <td>{task.file_name}</td>
                <td>{task.status.includes('summary') ? 'Summary' : 'Tagging'}</td>
                <td>{task.status}</td>
                <td>
                  {task.progress !== undefined ? (
                    <progress value={task.progress} max="100" />
                  ) : (
                    'N/A'
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AIProcessingDashboard;