import React, { useState, useEffect } from 'react';
import { Bar } from 'react-chartjs-2';
import { getModelPerformance } from '../services/api';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

// Register chart components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

interface ModelPerformance {
  summary_models: Record<string, { avg_time: number; success_rate: number }>;
  tagging_models: Record<string, { avg_time: number; success_rate: number }>;
}

const ModelPerformanceChart: React.FC = () => {
  const [performance, setPerformance] = useState<ModelPerformance | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPerformance = async () => {
      try {
        const data = await getModelPerformance();
        setPerformance(data);
        setError(null);
      } catch (err) {
        setError('Failed to load model performance data');
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchPerformance();
    const interval = setInterval(fetchPerformance, 30000); // Refresh every 30 seconds
    
    return () => clearInterval(interval);
  }, []);

  if (isLoading) return <div>Loading model performance...</div>;
  if (error) return <div className="error">{error}</div>;
  if (!performance) return <div>No performance data available</div>;

  const summaryLabels = Object.keys(performance.summary_models);
  const taggingLabels = Object.keys(performance.tagging_models);

  const summaryData = {
    labels: summaryLabels,
    datasets: [
      {
        label: 'Average Time (s)',
        data: summaryLabels.map(model => performance.summary_models[model].avg_time),
        backgroundColor: 'rgba(54, 162, 235, 0.5)',
      },
      {
        label: 'Success Rate (%)',
        data: summaryLabels.map(model => performance.summary_models[model].success_rate),
        backgroundColor: 'rgba(75, 192, 192, 0.5)',
      }
    ]
  };

  const taggingData = {
    labels: taggingLabels,
    datasets: [
      {
        label: 'Average Time (s)',
        data: taggingLabels.map(model => performance.tagging_models[model].avg_time),
        backgroundColor: 'rgba(255, 99, 132, 0.5)',
      },
      {
        label: 'Success Rate (%)',
        data: taggingLabels.map(model => performance.tagging_models[model].success_rate),
        backgroundColor: 'rgba(153, 102, 255, 0.5)',
      }
    ]
  };

  const options = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: true,
        text: 'Model Performance Metrics',
      },
    },
    scales: {
      y: {
        beginAtZero: true,
      },
    },
  };

  return (
    <div className="model-performance">
      <div className="chart-container">
        <h3>Summary Models</h3>
        <Bar options={options} data={summaryData} />
      </div>
      <div className="chart-container">
        <h3>Tagging Models</h3>
        <Bar options={options} data={taggingData} />
      </div>
    </div>
  );
};

export default ModelPerformanceChart;