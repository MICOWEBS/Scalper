'use client';

import { useState } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import axios from 'axios';
import { useQuery } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { API_ENDPOINTS, getAuthHeader } from '@/config/api';

interface Signal {
  id: number;
  timestamp: string;
  signal_type: 'LONG' | 'SHORT';
  price: number;
  confidence: number;
  status: 'ACTIVE' | 'CLOSED' | 'CANCELLED';
}

interface SignalsResponse {
  signals: Signal[];
  total: number;
}

export default function SignalsPage() {
  const [page, setPage] = useState(1);
  const [signalType, setSignalType] = useState<'ALL' | 'LONG' | 'SHORT'>('ALL');
  const pageSize = 10;

  const { data: signalsData, isLoading } = useQuery<SignalsResponse>({
    queryKey: ['signals', page, signalType],
    queryFn: async (): Promise<SignalsResponse> => {
      const response = await axios.get<SignalsResponse>(
        `${API_ENDPOINTS.SIGNALS.LIST}?page=${page}&page_size=${pageSize}&signal_type=${signalType}`,
        {
          headers: getAuthHeader(),
        }
      );
      return {
        signals: response.data.signals.map(signal => ({
          ...signal,
          timestamp: new Date(signal.timestamp).toISOString(),
        })),
        total: response.data.total,
      };
    },
  });

  const handleExport = async () => {
    try {
      const response = await axios.get<Blob>(API_ENDPOINTS.SIGNALS.EXPORT, {
        headers: getAuthHeader(),
        responseType: 'blob',
      });
      const url = window.URL.createObjectURL(response.data);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'signals.csv');
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      console.error('Error exporting signals:', err);
      toast.error('Failed to export signals');
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold text-gray-900">Signals</h1>
          <div className="flex gap-4">
            <select
              value={signalType}
              onChange={(e) => setSignalType(e.target.value as 'ALL' | 'LONG' | 'SHORT')}
              className="rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            >
              <option value="ALL">All Signals</option>
              <option value="LONG">Long Signals</option>
              <option value="SHORT">Short Signals</option>
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
                    Price
                  </th>
                  <th
                    scope="col"
                    className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900"
                  >
                    Confidence
                  </th>
                  <th
                    scope="col"
                    className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900"
                  >
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {isLoading ? (
                  <tr>
                    <td colSpan={5} className="py-4 text-center text-sm text-gray-500">
                      Loading...
                    </td>
                  </tr>
                ) : signalsData?.signals.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-4 text-center text-sm text-gray-500">
                      No signals found
                    </td>
                  </tr>
                ) : (
                  signalsData?.signals.map((signal: Signal) => (
                    <tr key={signal.id}>
                      <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm text-gray-900 sm:pl-6">
                        {new Date(signal.timestamp).toLocaleString()}
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm">
                        <span
                          className={`inline-flex rounded-full px-2 text-xs font-semibold leading-5 ${
                            signal.signal_type === 'LONG'
                              ? 'bg-green-100 text-green-800'
                              : 'bg-red-100 text-red-800'
                          }`}
                        >
                          {signal.signal_type}
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-900">
                        ${signal.price.toFixed(2)}
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-900">
                        {signal.confidence.toFixed(2)}%
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm">
                        <span
                          className={`inline-flex rounded-full px-2 text-xs font-semibold leading-5 ${
                            signal.status === 'ACTIVE'
                              ? 'bg-blue-100 text-blue-800'
                              : signal.status === 'CLOSED'
                              ? 'bg-green-100 text-green-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}
                        >
                          {signal.status}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {signalsData && signalsData.total > pageSize && (
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
                disabled={page * pageSize >= signalsData.total}
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
                    {Math.min(page * pageSize, signalsData.total)}
                  </span>{' '}
                  of <span className="font-medium">{signalsData.total}</span> results
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
                    disabled={page * pageSize >= signalsData.total}
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