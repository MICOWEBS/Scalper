'use client';

import { useState } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import axios from 'axios';
import { useQuery } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { API_ENDPOINTS, getAuthHeader } from '@/config/api';

interface Trade {
  id: number;
  timestamp: string;
  trade_type: 'LONG' | 'SHORT';
  entry_price: number;
  exit_price: number;
  profit_usd: number;
  profit_percentage: number;
}

export default function TradesPage() {
  const [page, setPage] = useState(1);
  const [tradeType, setTradeType] = useState<'ALL' | 'LONG' | 'SHORT'>('ALL');
  const pageSize = 10;

  const { data: trades, isLoading } = useQuery<{ trades: Trade[]; total: number }>({
    queryKey: ['trades', page, tradeType],
    queryFn: async (): Promise<{ trades: Trade[]; total: number }> => {
      const response = await axios.get<{ trades: Trade[]; total: number }>(
        `${API_ENDPOINTS.TRADES.LIST}?page=${page}&page_size=${pageSize}&trade_type=${tradeType}`,
        {
          headers: getAuthHeader(),
        }
      );
      return response.data;
    },
  });

  const handleExport = async () => {
    try {
      const response = await axios.get<Blob>(API_ENDPOINTS.TRADES.EXPORT, {
        headers: getAuthHeader(),
        responseType: 'blob',
      });
      const url = window.URL.createObjectURL(response.data);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'trades.csv');
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      toast.error('Failed to export trades');
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold text-gray-900">Trades</h1>
          <div className="flex gap-4">
            <select
              value={tradeType}
              onChange={(e) => setTradeType(e.target.value as 'ALL' | 'LONG' | 'SHORT')}
              className="rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            >
              <option value="ALL">All Trades</option>
              <option value="LONG">Long Trades</option>
              <option value="SHORT">Short Trades</option>
            </select>
            <button
              onClick={handleExport}
              className="rounded-md bg-indigo-600 px-3.5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
            >
              Export CSV
            </button>
          </div>
        </div>

        <div className="overflow-hidden rounded-lg bg-white shadow">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-300">
              <thead>
                <tr>
                  <th
                    scope="col"
                    className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6"
                  >
                    Time
                  </th>
                  <th
                    scope="col"
                    className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900"
                  >
                    Type
                  </th>
                  <th
                    scope="col"
                    className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900"
                  >
                    Entry Price
                  </th>
                  <th
                    scope="col"
                    className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900"
                  >
                    Exit Price
                  </th>
                  <th
                    scope="col"
                    className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900"
                  >
                    Profit (USD)
                  </th>
                  <th
                    scope="col"
                    className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900"
                  >
                    Profit (%)
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {isLoading ? (
                  <tr>
                    <td colSpan={6} className="py-4 text-center text-sm text-gray-500">
                      Loading...
                    </td>
                  </tr>
                ) : trades?.trades.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-4 text-center text-sm text-gray-500">
                      No trades found
                    </td>
                  </tr>
                ) : (
                  trades?.trades.map((trade: Trade) => (
                    <tr key={trade.id}>
                      <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm text-gray-900 sm:pl-6">
                        {new Date(trade.timestamp).toLocaleString()}
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm">
                        <span
                          className={`inline-flex rounded-full px-2 text-xs font-semibold leading-5 ${
                            trade.trade_type === 'LONG'
                              ? 'bg-green-100 text-green-800'
                              : 'bg-red-100 text-red-800'
                          }`}
                        >
                          {trade.trade_type}
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-900">
                        ${trade.entry_price.toFixed(2)}
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-900">
                        ${trade.exit_price.toFixed(2)}
                      </td>
                      <td
                        className={`whitespace-nowrap px-3 py-4 text-sm ${
                          trade.profit_usd >= 0 ? 'text-green-600' : 'text-red-600'
                        }`}
                      >
                        ${trade.profit_usd.toFixed(2)}
                      </td>
                      <td
                        className={`whitespace-nowrap px-3 py-4 text-sm ${
                          trade.profit_percentage >= 0 ? 'text-green-600' : 'text-red-600'
                        }`}
                      >
                        {trade.profit_percentage.toFixed(2)}%
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {trades && trades.total > pageSize && (
          <div className="flex items-center justify-between border-t border-gray-200 bg-white px-4 py-3 sm:px-6">
            <div className="flex flex-1 justify-between sm:hidden">
              <button
                onClick={() => setPage(page - 1)}
                disabled={page === 1}
                className="relative inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
              >
                Previous
              </button>
              <button
                onClick={() => setPage(page + 1)}
                disabled={page * pageSize >= trades.total}
                className="relative ml-3 inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
              >
                Next
              </button>
            </div>
            <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-gray-700">
                  Showing <span className="font-medium">{(page - 1) * pageSize + 1}</span> to{' '}
                  <span className="font-medium">
                    {Math.min(page * pageSize, trades.total)}
                  </span>{' '}
                  of <span className="font-medium">{trades.total}</span> results
                </p>
              </div>
              <div>
                <nav
                  className="isolate inline-flex -space-x-px rounded-md shadow-sm"
                  aria-label="Pagination"
                >
                  <button
                    onClick={() => setPage(page - 1)}
                    disabled={page === 1}
                    className="relative inline-flex items-center rounded-l-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0 disabled:opacity-50"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => setPage(page + 1)}
                    disabled={page * pageSize >= trades.total}
                    className="relative inline-flex items-center rounded-r-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0 disabled:opacity-50"
                  >
                    Next
                  </button>
                </nav>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
} 