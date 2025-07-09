import { useEffect, useState } from 'react';
import { getLogs } from '../api';

export default function ActivityLog() {
  const [logs, setLogs] = useState([]);

  useEffect(() => {
    const fetchLogs = async () => {
      const res = await getLogs();
      setLogs(res);
    };
    fetchLogs();
  }, []);

  return (
    <div className="activity-log">
      <h4>Recent Activity</h4>
      <ul>
        {logs.map((log, index) => (
          <li key={index}>{log.message} at {new Date(log.timestamp).toLocaleTimeString()}</li>
        ))}
      </ul>
    </div>
  );
}
