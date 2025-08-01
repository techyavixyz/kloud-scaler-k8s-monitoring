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

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

interface NodeHistoricalChartProps {
  nodeName: string;
  timeRange: number; // hours
}

interface NodeHistoricalMetric {
  cpu_usage: number;
  memory_usage: number;
  cpu_percentage: number;
  memory_percentage: number;
  timestamp: string;
}

export default function NodeHistoricalChart({ nodeName, timeRange }: NodeHistoricalChartProps) {
  const [data, setData] = useState<NodeHistoricalMetric[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadHistoricalData();
  }, [nodeName, timeRange]);

  const loadHistoricalData = async () => {
    try {
      setLoading(true);
      // Mock data for now - in production, this would query the database
      const mockData = [];
      const now = new Date();
      
      for (let i = parseInt(timeRange.toString()); i >= 0; i--) {
        const timestamp = new Date(now.getTime() - (i * 60 * 60 * 1000));
        mockData.push({
          cpu_usage: Math.random() * 4 + 0.5, // 0.5-4.5 cores
          memory_usage: Math.random() * 8000 + 1000, // 1-9 GB
          cpu_percentage: Math.random() * 80 + 10, // 10-90%
          memory_percentage: Math.random() * 70 + 15, // 15-85%
          timestamp: timestamp.toISOString()
        });
      }
      
      setData(mockData);
    } catch (error) {
      console.error('Failed to load node historical data:', error);
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
        label: 'CPU Usage (%)',
        data: data.map(item => item.cpu_percentage),
        borderColor: 'rgb(59, 130, 246)',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        tension: 0.4,
        fill: true,
        yAxisID: 'y',
      },
      {
        label: 'Memory Usage (%)',
        data: data.map(item => item.memory_percentage),
        borderColor: 'rgb(147, 51, 234)',
        backgroundColor: 'rgba(147, 51, 234, 0.1)',
        tension: 0.4,
        fill: true,
        yAxisID: 'y',
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
        callbacks: {
          label: function(context: any) {
            return `${context.dataset.label}: ${context.parsed.y.toFixed(1)}%`;
          }
        }
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
          callback: function(value: any) {
            return value + '%';
          }
        },
        title: {
          display: true,
          text: 'Usage Percentage',
          color: 'rgb(100, 116, 139)',
        },
        min: 0,
        max: 100,
      },
    },
  };

  if (loading) {
    return (
      <div className="h-64 flex items-center justify-center">
        <div className="inline-flex items-center space-x-2 text-slate-500 dark:text-slate-400">
          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-500"></div>
          <span>Loading node historical data...</span>
        </div>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center">
        <p className="text-slate-500 dark:text-slate-400">
          No historical data available for {nodeName}
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