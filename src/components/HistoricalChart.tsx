import React, { useState, useEffect } from 'react';
import { Line } from 'react-chartjs-2';
import { 
  Chart as ChartJS, 
  CategoryScale, 
  LinearScale, 
  PointElement, 
  LineElement, 
  Title, 
  Tooltip, 
  Legend 
} from 'chart.js';
import { fetchMetricsHistory } from '../services/api';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

interface HistoricalChartProps {
  namespace: string;
  timeRange: number; // hours
}

interface HistoricalMetric {
  cpu_usage: number;
  memory_usage: number;
  pod_count: number;
  timestamp: string;
}

export default function HistoricalChart({ namespace, timeRange }: HistoricalChartProps) {
  const [data, setData] = useState<HistoricalMetric[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadHistoricalData();
  }, [namespace, timeRange]);

  const loadHistoricalData = async () => {
    try {
      setLoading(true);
      const metrics = await fetchMetricsHistory(namespace, timeRange);
      setData(metrics);
    } catch (error) {
      console.error('Failed to load historical data:', error);
      setData([]);
    } finally {
      setLoading(false);
    }
  };

  const chartData = {
    labels: data.map(item => 
      new Date(item.timestamp).toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit' 
      })
    ),
    datasets: [
      {
        label: 'CPU Usage (cores)',
        data: data.map(item => item.cpu_usage),
        borderColor: 'rgb(59, 130, 246)',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        tension: 0.4,
        fill: true,
        yAxisID: 'y',
      },
      {
        label: 'Memory Usage (MiB)',
        data: data.map(item => item.memory_usage),
        borderColor: 'rgb(147, 51, 234)',
        backgroundColor: 'rgba(147, 51, 234, 0.1)',
        tension: 0.4,
        fill: true,
        yAxisID: 'y1',
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: 'index' as const,
      intersect: false,
    },
    plugins: {
      legend: {
        position: 'top' as const,
        labels: {
          color: 'rgb(100, 116, 139)',
          usePointStyle: true,
          font: {
            family: 'Inter, system-ui, sans-serif',
          },
        },
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleColor: 'white',
        bodyColor: 'white',
        borderColor: 'rgba(59, 130, 246, 0.5)',
        borderWidth: 1,
      },
    },
    scales: {
      x: {
        grid: {
          color: 'rgba(100, 116, 139, 0.1)',
        },
        ticks: {
          color: 'rgb(100, 116, 139)',
          maxTicksLimit: 8,
          font: {
            family: 'Inter, system-ui, sans-serif',
          },
        },
      },
      y: {
        type: 'linear' as const,
        display: true,
        position: 'left' as const,
        grid: {
          color: 'rgba(100, 116, 139, 0.1)',
        },
        ticks: {
          color: 'rgb(100, 116, 139)',
          font: {
            family: 'Inter, system-ui, sans-serif',
          },
        },
        title: {
          display: true,
          text: 'CPU (cores)',
          color: 'rgb(59, 130, 246)',
        },
      },
      y1: {
        type: 'linear' as const,
        display: true,
        position: 'right' as const,
        grid: {
          drawOnChartArea: false,
        },
        ticks: {
          color: 'rgb(100, 116, 139)',
          font: {
            family: 'Inter, system-ui, sans-serif',
          },
        },
        title: {
          display: true,
          text: 'Memory (MiB)',
          color: 'rgb(147, 51, 234)',
        },
      },
    },
  };

  if (loading) {
    return (
      <div className="h-64 flex items-center justify-center">
        <div className="inline-flex items-center space-x-2 text-slate-500 dark:text-slate-400">
          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-500"></div>
          <span>Loading historical data...</span>
        </div>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center">
        <p className="text-slate-500 dark:text-slate-400">
          No historical data available for {namespace}
        </p>
      </div>
    );
  }

  return (
    <div className="h-64">
      <Line data={chartData} options={options} />
    </div>
  );
}