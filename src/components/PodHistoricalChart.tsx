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

interface PodHistoricalChartProps {
  namespace: string;
  timeRange: number; // hours
}

interface PodHistoricalMetric {
  total_cpu: number;
  total_memory: number;
  pod_count: number;
  avg_cpu_per_pod: number;
  avg_memory_per_pod: number;
  timestamp: string;
}

export default function PodHistoricalChart({ namespace, timeRange }: PodHistoricalChartProps) {
  const [data, setData] = useState<PodHistoricalMetric[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadHistoricalData();
  }, [namespace, timeRange]);

  const loadHistoricalData = async () => {
    try {
      setLoading(true);
      // Mock data for now - in production, this would query the database
      const mockData = [];
      const now = new Date();
      
      for (let i = parseInt(timeRange.toString()); i >= 0; i--) {
        const timestamp = new Date(now.getTime() - (i * 60 * 60 * 1000));
        const podCount = Math.floor(Math.random() * 10) + 3; // 3-12 pods
        const totalCpu = Math.random() * 2000 + 500; // 500-2500m
        const totalMemory = Math.random() * 4000 + 1000; // 1-5 GB
        
        mockData.push({
          total_cpu: totalCpu,
          total_memory: totalMemory,
          pod_count: podCount,
          avg_cpu_per_pod: totalCpu / podCount,
          avg_memory_per_pod: totalMemory / podCount,
          timestamp: timestamp.toISOString()
        });
      }
      
      setData(mockData);
    } catch (error) {
      console.error('Failed to load pod historical data:', error);
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
        label: 'Total CPU (millicores)',
        data: data.map(item => item.total_cpu),
        borderColor: 'rgb(59, 130, 246)',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        tension: 0.4,
        fill: true,
        yAxisID: 'y',
      },
      {
        label: 'Total Memory (MiB)',
        data: data.map(item => item.total_memory),
        borderColor: 'rgb(147, 51, 234)',
        backgroundColor: 'rgba(147, 51, 234, 0.1)',
        tension: 0.4,
        fill: true,
        yAxisID: 'y1',
      },
      {
        label: 'Pod Count',
        data: data.map(item => item.pod_count),
        borderColor: 'rgb(34, 197, 94)',
        backgroundColor: 'rgba(34, 197, 94, 0.1)',
        tension: 0.4,
        fill: false,
        yAxisID: 'y2',
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
          text: 'CPU (millicores)',
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
      y2: {
        type: 'linear' as const,
        display: false,
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
      },
    },
  };

  if (loading) {
    return (
      <div className="h-64 flex items-center justify-center">
        <div className="inline-flex items-center space-x-2 text-slate-500 dark:text-slate-400">
          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-purple-500"></div>
          <span>Loading pod historical data...</span>
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