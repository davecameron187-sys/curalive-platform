import { Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Tooltip,
  Legend,
} from "chart.js";

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend);

interface Props {
  options: { label: string; votes: number }[];
  totalVotes: number;
}

const COLORS = [
  "rgba(59, 130, 246, 0.8)",
  "rgba(16, 185, 129, 0.8)",
  "rgba(245, 158, 11, 0.8)",
  "rgba(239, 68, 68, 0.8)",
  "rgba(139, 92, 246, 0.8)",
];

export default function PollResults({ options, totalVotes }: Props) {
  const data = {
    labels: options.map(o => o.label),
    datasets: [{
      data: options.map(o => o.votes),
      backgroundColor: options.map((_, i) => COLORS[i % COLORS.length]),
      borderRadius: 4,
    }]
  };

  const chartOptions = {
    indexAxis: 'y' as const,
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          label: (ctx: any) => {
            const val = ctx.raw;
            const pct = totalVotes > 0 ? Math.round((val / totalVotes) * 100) : 0;
            return ` ${val} votes (${pct}%)`;
          }
        }
      }
    },
    scales: {
      x: {
        beginAtZero: true,
        grid: { display: false },
        ticks: { stepSize: 1, color: "rgba(255,255,255,0.5)" }
      },
      y: {
        grid: { display: false },
        ticks: { color: "rgba(255,255,255,0.7)" }
      }
    }
  };

  return (
    <div className="h-48 w-full mt-4">
      <Bar data={data} options={chartOptions} />
    </div>
  );
}
