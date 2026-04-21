import { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Database, Download, Search, Table, Table2, Layers, RefreshCw } from 'lucide-react';
import { format } from 'date-fns';

interface TableInfo {
  name: string;
  columns: { name: string; type: string }[];
  rowCount: number;
}

interface TableData {
  [key: string]: any;
}

function formatDuration(seconds: number): string {
  if (seconds < 60) return `${seconds}s`;
  if (seconds < 3600) {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return s > 0 ? `${m}m ${s}s` : `${m}m`;
  }
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

function formatCellValue(value: any, columnType: string, columnName?: string): string {
  if (value === null || value === undefined) return '—';
  
  // Handle dates
  if (columnType.includes('datetime') || columnType.includes('timestamp') || columnName === 'timestamp') {
    try {
      const d = new Date(value);
      if (!isNaN(d.getTime())) {
        return format(d, 'yyyy-MM-dd HH:mm:ss');
      }
    } catch {}
  }
  
  // Handle durations (in ms)
  if (columnName === 'duration_ms' || columnName === 'duration') {
    return formatDuration(Math.floor(value / 1000));
  }
  
  // Handle booleans
  if (typeof value === 'boolean') return value ? 'Yes' : 'No';
  
  // Handle objects/arrays (JSON)
  if (typeof value === 'object') {
    const str = JSON.stringify(value);
    return str.length > 100 ? str.substring(0, 100) + '...' : str;
  }
  
  // Handle long strings
  if (typeof value === 'string' && value.length > 100) {
    return value.substring(0, 100) + '...';
  }
  
  return String(value);
}

export default function DatabasePage() {
  const [tables, setTables] = useState<TableInfo[]>([]);
  const [selectedTable, setSelectedTable] = useState<string>('');
  const [tableData, setTableData] = useState<TableData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(0);
  const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'success' | 'error'>('idle');
  const [syncMessage, setSyncMessage] = useState<string>('');
  const ITEMS_PER_PAGE = 50;

  // Sync categories from localStorage overrides to database
  const syncCategories = async () => {
    setSyncStatus('syncing');
    setSyncMessage('Reading category overrides...');
    
    try {
      // Read overrides from localStorage
      const appOverridesRaw = localStorage.getItem('deskflow-app-category-overrides');
      const domainOverridesRaw = localStorage.getItem('deskflow-domain-category-overrides');
      
      const appOverrides: Record<string, string> = appOverridesRaw ? JSON.parse(appOverridesRaw) : {};
      const domainOverrides: Record<string, string> = domainOverridesRaw ? JSON.parse(domainOverridesRaw) : {};
      
      if (Object.keys(appOverrides).length === 0 && Object.keys(domainOverrides).length === 0) {
        setSyncStatus('idle');
        setSyncMessage('');
        alert('No category overrides found in Settings. Please configure app categories in Settings first.');
        return;
      }
      
      setSyncMessage(`Syncing ${Object.keys(appOverrides).length} app overrides and ${Object.keys(domainOverrides).length} domain overrides...`);
      
      // Call API to update database
      if (window.deskflowAPI?.updateCategoriesFromOverrides) {
        const result = await window.deskflowAPI.updateCategoriesFromOverrides(appOverrides, domainOverrides);
        
        if (result.success) {
          setSyncStatus('success');
          setSyncMessage(`Updated ${result.updatedCount} rows`);
          
          // Refresh the current table data
          if (selectedTable) {
            const data = await window.deskflowAPI.getTableData(selectedTable, 500);
            if (Array.isArray(data)) {
              setTableData(data);
            }
          }
          
          // Reset status after 3 seconds
          setTimeout(() => {
            setSyncStatus('idle');
            setSyncMessage('');
          }, 3000);
        } else {
          setSyncStatus('error');
          setSyncMessage(result.error || 'Failed to update categories');
        }
      } else {
        setSyncStatus('error');
        setSyncMessage('API not available');
      }
    } catch (err) {
      setSyncStatus('error');
      setSyncMessage('Error: ' + (err as Error).message);
    }
  };

  // Fetch available tables
  useEffect(() => {
    const fetchTables = async () => {
      if (window.deskflowAPI?.getDatabaseTables) {
        try {
          const result = await window.deskflowAPI.getDatabaseTables();
          if (result.tables && result.tables.length > 0) {
            // Fetch schema for each table
            const tableInfos: TableInfo[] = [];
            for (const tableName of result.tables) {
              const schema = await window.deskflowAPI.getTableSchema(tableName);
              const data = await window.deskflowAPI.getTableData(tableName, 1);
              const rowCount = Array.isArray(data) ? -1 : 0; // We'll get actual count from data if available
              tableInfos.push({
                name: tableName,
                columns: Array.isArray(schema) ? schema : [],
                rowCount: rowCount
              });
            }
            setTables(tableInfos);
            if (!selectedTable && tableInfos.length > 0) {
              setSelectedTable(tableInfos[0].name);
            }
          }
        } catch (err) {
          setError('Failed to load database tables');
          console.error(err);
        }
      }
      setLoading(false);
    };
    fetchTables();
  }, []);

  // Fetch data when table changes
  useEffect(() => {
    if (!selectedTable || !window.deskflowAPI?.getTableData) return;
    
    const fetchData = async () => {
      setLoading(true);
      try {
        const data = await window.deskflowAPI.getTableData(selectedTable, 500);
        if (Array.isArray(data)) {
          setTableData(data);
        } else {
          setError('Failed to load table data');
          setTableData([]);
        }
      } catch (err) {
        setError('Failed to load table data');
        console.error(err);
        setTableData([]);
      }
      setLoading(false);
    };
    fetchData();
    setCurrentPage(0);
    setSearchQuery('');
  }, [selectedTable]);

  // Get current table info
  const currentTable = tables.find(t => t.name === selectedTable);

  // Filter data based on search
  const filteredData = useMemo(() => {
    if (!searchQuery || !tableData.length) return tableData;
    const query = searchQuery.toLowerCase();
    return tableData.filter(row => {
      return Object.values(row).some(val => 
        String(val).toLowerCase().includes(query)
      );
    });
  }, [tableData, searchQuery]);

  // Paginate
  const paginatedData = useMemo(() => {
    const start = currentPage * ITEMS_PER_PAGE;
    return filteredData.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredData, currentPage]);

  const totalPages = Math.ceil(filteredData.length / ITEMS_PER_PAGE);

  // Export functions
  const exportToJSON = () => {
    const data = filteredData.map(row => {
      const formatted: Record<string, any> = {};
      for (const key of Object.keys(row)) {
        const val = row[key];
        // Format dates
        if (key.includes('timestamp') || key.includes('datetime')) {
          if (val) formatted[key] = new Date(val).toISOString();
          else formatted[key] = val;
        } else {
          formatted[key] = val;
        }
      }
      return formatted;
    });
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${selectedTable}-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportToCSV = () => {
    if (!tableData.length) return;
    const headers = Object.keys(tableData[0]);
    const escapeCsv = (val: any) => {
      const str = String(val ?? '');
      if (str.includes(',') || str.includes('"') || str.includes('\n')) {
        return `"${str.replace(/"/g, '""')}"`;
      }
      return str;
    };
    const rows = filteredData.map(row => 
      headers.map(h => escapeCsv(row[h])).join(',')
    );
    const csv = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${selectedTable}-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const getColumnType = (colName: string): string => {
    return currentTable?.columns.find(c => c.name === colName)?.type || 'TEXT';
  };

  if (loading && !tables.length) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-zinc-400 flex items-center gap-3">
          <Layers className="w-5 h-5 animate-spin" />
          Loading database...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="glass rounded-2xl p-8 text-center">
        <div className="text-red-400 mb-2">Error</div>
        <div className="text-zinc-400 text-sm">{error}</div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center">
            <Database className="w-6 h-6 text-emerald-400" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold">Database</h1>
            <p className="text-sm text-zinc-400">{tables.length} tables • SQLite</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={async () => {
              if (selectedTable && window.deskflowAPI?.getTableData) {
                setLoading(true);
                try {
                  const data = await window.deskflowAPI.getTableData(selectedTable, 500);
                  if (Array.isArray(data)) {
                    setTableData(data);
                  }
                } catch (err) {
                  console.error('Failed to refresh:', err);
                }
                setLoading(false);
              }
            }}
            className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded-xl text-sm flex items-center gap-2 transition"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
          <button
            onClick={syncCategories}
            disabled={syncStatus === 'syncing'}
            className={`px-4 py-2 rounded-xl text-sm flex items-center gap-2 transition ${
              syncStatus === 'success' 
                ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                : syncStatus === 'error'
                ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                : 'bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30'
            }`}
          >
            {syncStatus === 'syncing' ? (
              <Layers className="w-4 h-4 animate-spin" />
            ) : (
              <RefreshCw className="w-4 h-4" />
            )}
            {syncStatus === 'idle' ? 'Sync Categories' : syncMessage || 'Syncing...'}
          </button>
          <button
            onClick={exportToJSON}
            disabled={!tableData.length}
            className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 disabled:opacity-50 disabled:cursor-not-allowed text-zinc-200 rounded-xl text-sm flex items-center gap-2 transition"
          >
            <Download className="w-4 h-4" />
            JSON
          </button>
          <button
            onClick={exportToCSV}
            disabled={!tableData.length}
            className="px-4 py-2 bg-emerald-500/10 hover:bg-emerald-500/20 disabled:opacity-50 disabled:cursor-not-allowed text-emerald-400 rounded-xl text-sm flex items-center gap-2 transition"
          >
            <Download className="w-4 h-4" />
            CSV
          </button>
        </div>
      </div>

      {/* Table Selector */}
      <div className="glass rounded-2xl p-4">
        <div className="flex items-center gap-2 mb-3">
          <Table2 className="w-4 h-4 text-zinc-500" />
          <span className="text-sm text-zinc-400">Select Table</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {tables.map(table => (
            <button
              key={table.name}
              onClick={() => setSelectedTable(table.name)}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition flex items-center gap-2 ${
                selectedTable === table.name
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                  : 'bg-zinc-800/50 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 border border-transparent'
              }`}
            >
              <Table className="w-4 h-4" />
              {table.name}
            </button>
          ))}
        </div>
      </div>

      {selectedTable && (
        <>
          {/* Table Info */}
          <div className="glass rounded-2xl p-4">
            <div className="flex items-center justify-between mb-3">
              <div>
                <div className="text-sm font-medium text-white">{selectedTable}</div>
                <div className="text-xs text-zinc-500">
                  {filteredData.length.toLocaleString()} rows
                  {searchQuery && ` matching "${searchQuery}"`}
                </div>
              </div>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                <input
                  type="text"
                  placeholder="Search..."
                  value={searchQuery}
                  onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(0); }}
                  className="bg-zinc-900 border border-zinc-800 rounded-lg pl-9 pr-4 py-2 text-sm text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-emerald-500/50 w-64"
                />
              </div>
            </div>

            {/* Schema */}
            {currentTable?.columns && (
              <div className="text-xs font-mono text-zinc-500">
                <span className="text-emerald-400">CREATE TABLE</span> {selectedTable} (
                {currentTable.columns.map((col, i) => (
                  <span key={col.name}>
                    {i > 0 && <span>, </span>}
                    <span className="text-zinc-300">{col.name}</span>{' '}
                    <span className="text-amber-400">{col.type}</span>
                  </span>
                ))
                });
              </div>
            )}
          </div>

          {/* Data Table */}
          <div className="glass rounded-2xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-zinc-900/80">
                  <tr className="border-b border-zinc-800 text-left text-zinc-400">
                    {currentTable?.columns?.map(col => (
                      <th key={col.name} className="px-4 py-3 font-medium">
                        <div className="flex flex-col">
                          <span className="text-zinc-300">{col.name}</span>
                          <span className="text-xs text-zinc-600 font-normal">{col.type}</span>
                        </div>
                      </th>
                    )) || <th className="px-4 py-3">No columns</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800 font-mono">
                  {loading ? (
                    <tr>
                      <td colSpan={currentTable?.columns?.length || 1} className="px-4 py-16 text-center text-zinc-500">
                        <div className="flex items-center justify-center gap-2">
                          <Layers className="w-4 h-4 animate-spin" />
                          Loading...
                        </div>
                      </td>
                    </tr>
                  ) : paginatedData.length === 0 ? (
                    <tr>
                      <td colSpan={currentTable?.columns?.length || 1} className="px-4 py-16 text-center text-zinc-500">
                        {tableData.length === 0 ? 'No data in this table' : 'No matching results'}
                      </td>
                    </tr>
                  ) : (
                    paginatedData.map((row, idx) => (
                      <tr key={idx} className="hover:bg-zinc-900/30 transition">
                        {currentTable?.columns?.map(col => (
                          <td key={col.name} className="px-4 py-3 text-zinc-300 max-w-xs truncate">
                            {formatCellValue(row[col.name], col.type, col.name)}
                          </td>
                        ))}
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 p-4 border-t border-zinc-800">
                <button
                  onClick={() => setCurrentPage(p => Math.max(0, p - 1))}
                  disabled={currentPage === 0}
                  className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm text-zinc-200 rounded-lg transition"
                >
                  Previous
                </button>
                <span className="px-3 py-1.5 text-sm text-zinc-400">
                  Page {currentPage + 1} of {totalPages}
                </span>
                <button
                  onClick={() => setCurrentPage(p => Math.min(totalPages - 1, p + 1))}
                  disabled={currentPage >= totalPages - 1}
                  className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm text-zinc-200 rounded-lg transition"
                >
                  Next
                </button>
              </div>
            )}
          </div>
        </>
      )}
    </motion.div>
  );
}
