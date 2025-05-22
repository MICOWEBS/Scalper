'use client';

import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import axios from 'axios';
import { useQuery } from '@tanstack/react-query';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import toast from 'react-hot-toast';
import { API_ENDPOINTS, getAuthHeader } from '@/config/api';

interface BotStatus {
  status: 'running' | 'stopped';
}

interface Stats {
  total_profit: number;
  total_profit_usd: number;
  win_rate: number;
  average_trade_usd: number;
}

interface DailyStats {
  day: string;
  profit_usd: number;
}

interface WalletBalancesResponse {
  BNB: number;
  USDT: number;
  WBTC: number;
  prices: {
    BNB: number;
  };
}

export default function DashboardPage() {
  const [botStatus, setBotStatus] = useState<BotStatus>({ status: 'stopped' });

  const { data: stats } = useQuery<Stats>({
    queryKey: ['stats'],
    queryFn: async (): Promise<Stats> => {
      try {
        const response = await axios.get<Stats>(API_ENDPOINTS.STATS.OVERVIEW, {
          headers: getAuthHeader(),
        });
        return response.data;
      } catch (err) {
        console.error('Error fetching dashboard stats:', err);
        toast.error('Failed to load dashboard statistics');
        throw err;
      }
    },
  });

  const { data: dailyStats } = useQuery<DailyStats[]>({
    queryKey: ['dailyStats'],
    queryFn: async (): Promise<DailyStats[]> => {
      try {
        const response = await axios.get<DailyStats[]>(API_ENDPOINTS.STATS.DAILY, {
          headers: getAuthHeader(),
        });
        console.log('Daily stats response:', response.data);
        if (!Array.isArray(response.data)) {
          console.error('Daily stats is not an array:', response.data);
          return [];
        }
        return response.data;
      } catch (err) {
        console.error('Error fetching daily stats:', err);
        toast.error('Failed to load daily statistics');
        return [];
      }
    },
  });

  const { data: walletBalances } = useQuery<WalletBalancesResponse>({
    queryKey: ['walletBalances'],
    queryFn: async (): Promise<WalletBalancesResponse> => {
      try {
        const response = await axios.get<WalletBalancesResponse>(API_ENDPOINTS.WALLET.BALANCES, {
          headers: getAuthHeader(),
        });
        console.log('Wallet balances response:', response.data);
        return response.data;
      } catch (err) {
        console.error('Error fetching wallet balances:', err);
        toast.error('Failed to load wallet balances');
        return {
          BNB: 0,
          USDT: 0,
          WBTC: 0,
          prices: { BNB: 0 }
        };
      }
    },
  });

  useEffect(() => {
    const ws = new WebSocket(API_ENDPOINTS.WEBSOCKET);
    ws.onmessage = (event) => {
      const data = JSON.parse(event.data) as BotStatus;
      setBotStatus(data);
    };
    return () => ws.close();
  }, []);

  const handleStartBot = async () => {
    try {
      await axios.post(
        API_ENDPOINTS.BOT.START,
        {},
        {
          headers: getAuthHeader(),
        }
      );
      toast.success('Bot started successfully');
    } catch (err) {
      console.error('Error starting bot:', err);
      toast.error('Failed to start bot');
    }
  };

  const handleStopBot = async () => {
    try {
      await axios.post(
        API_ENDPOINTS.BOT.STOP,
        {},
        {
          headers: getAuthHeader(),
        }
      );
      toast.success('Bot stopped successfully');
    } catch (err) {
      console.error('Error stopping bot:', err);
      toast.error('Failed to stop bot');
    }
  };

  const walletData = walletBalances ? [
    { token: 'BNB', balance: walletBalances.BNB, usd_value: walletBalances.BNB * (walletBalances.prices?.BNB || 0) },
    { token: 'USDT', balance: walletBalances.USDT, usd_value: walletBalances.USDT },
    { token: 'WBTC', balance: walletBalances.WBTC, usd_value: walletBalances.WBTC * (walletBalances.prices?.WBTC || 0) }
  ] : [];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold text-gray-900">Dashboard</h1>
          <div className="flex gap-4">
            <button
              onClick={handleStartBot}
              disabled={botStatus.status === 'running'}
              className="rounded-md bg-indigo-600 px-3.5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 disabled:opacity-50"
            >
              Start Bot
            </button>
            <button
              onClick={handleStopBot}
              disabled={botStatus.status === 'stopped'}
              className="rounded-md bg-red-600 px-3.5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-red-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-600 disabled:opacity-50"
            >
              Stop Bot
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          <div className="overflow-hidden rounded-lg bg-white px-4 py-5 shadow sm:p-6">
            <dt className="truncate text-sm font-medium text-gray-500">Total Profit</dt>
            <dd className="mt-1 text-3xl font-semibold tracking-tight text-gray-900">
              ${stats?.total_profit_usd.toFixed(2) ?? '0.00'}
            </dd>
          </div>
          <div className="overflow-hidden rounded-lg bg-white px-4 py-5 shadow sm:p-6">
            <dt className="truncate text-sm font-medium text-gray-500">Win Rate</dt>
            <dd className="mt-1 text-3xl font-semibold tracking-tight text-gray-900">
              {stats?.win_rate.toFixed(2) ?? '0'}%
            </dd>
          </div>
          <div className="overflow-hidden rounded-lg bg-white px-4 py-5 shadow sm:p-6">
            <dt className="truncate text-sm font-medium text-gray-500">Average Trade</dt>
            <dd className="mt-1 text-3xl font-semibold tracking-tight text-gray-900">
              ${stats?.average_trade_usd.toFixed(2) ?? '0.00'}
            </dd>
          </div>
          <div className="overflow-hidden rounded-lg bg-white px-4 py-5 shadow sm:p-6">
            <dt className="truncate text-sm font-medium text-gray-500">Bot Status</dt>
            <dd className="mt-1 text-3xl font-semibold tracking-tight text-gray-900">
              {botStatus.status.charAt(0).toUpperCase() + botStatus.status.slice(1)}
            </dd>
          </div>
        </div>

        <div className="overflow-hidden rounded-lg bg-white shadow">
          <div className="p-6">
            <h3 className="text-base font-semibold leading-6 text-gray-900">Daily Profit</h3>
            <div className="mt-6" style={{ height: '400px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={dailyStats}
                  margin={{
                    top: 5,
                    right: 30,
                    left: 20,
                    bottom: 5,
                  }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="day" />
                  <YAxis />
                  <Tooltip />
                  <Line
                    type="monotone"
                    dataKey="profit_usd"
                    stroke="#4f46e5"
                    activeDot={{ r: 8 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        <div className="overflow-hidden rounded-lg bg-white shadow">
          <div className="p-6">
            <h3 className="text-base font-semibold leading-6 text-gray-900 mb-4">Wallet Balances</h3>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-300">
                <thead>
                  <tr>
                    <th
                      scope="col"
                      className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6"
                    >
                      Token
                    </th>
                    <th
                      scope="col"
                      className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900"
                    >
                      Balance
                    </th>
                    <th
                      scope="col"
                      className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900"
                    >
                      USD Value
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {walletData.map((balance) => (
                    <tr key={balance.token}>
                      <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm text-gray-900 sm:pl-6">
                        {balance.token}
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-900">
                        {balance.balance.toFixed(6)}
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-900">
                        ${balance.usd_value.toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
} 