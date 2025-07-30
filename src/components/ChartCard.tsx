import React, { useEffect, useRef } from 'react';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js';
import { Bar } from 'react-chartjs-2';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

interface ChartCardProps {
  title: string;
  data: Array<{
    namespace: string;
    cpuRaw: number;
    memoryRaw: number;
  }>;
  type: 'cpu' | 'memory';
}

export default function ChartCard({ title, data, type }: ChartCardProps) {
  const chartData = {
    labels: data.map(item => item.namespace),
    datasets: [
      {
        label: type === 'cpu' ? 'CPU (cores)' : 'Memory (MiB)',
        data: data.map(item => type === 'cpu' ? item.cpuRaw : item.memoryRaw),
        backgroundColor: type === 'cpu' 
          ? 'rgba(59, 130, 246, 0.6)' 
          : 'rgba(147, 51, 234, 0.6)',
        borderColor: type === 'cpu' 
          ? 'rgba(59, 130, 246, 1)' 
          : 'rgba(147, 51, 234, 1)',
        borderWidth: 2,
        borderRadius: 8,
        borderSkipped: false,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
        labels: {
          color: 'rgb(100, 116, 139)',
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
          display: false,
        },
        ticks: {
          color: 'rgb(100, 116, 139)',
          font: {
            family: 'Inter, system-ui, sans-serif',
          },
        },
      },
      y: {
        grid: {
          color: 'rgba(100, 116, 139, 0.1)',
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

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 p-6">
      <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
        {title}
      </h3>
      <div className="h-64">
        <Bar data={chartData} options={options} />
      </div>
    </div>
  );
}