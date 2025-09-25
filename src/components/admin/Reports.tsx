import React, { useState, useMemo } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useData } from '../../contexts/DataContext';
import { exportToExcel, exportToPDF, prepareReportsData } from '../../utils/exportUtils';
import { BarChart3, Download, Filter, Calendar, Users, TrendingUp, PieChart, ArrowUpDown, Search, X } from 'lucide-react';

interface SortConfig {
  key: string;
  direction: 'asc' | 'desc';
}

interface FilterConfig {
  column: string;
  value: string;
}

const Reports: React.FC = () => {
  const { user } = useAuth();
  const { leaveRequests, employees, departments } = useData();
  const [selectedReport, setSelectedReport] = useState('overview');
  const [dateRange, setDateRange] = useState({
    from: new Date().getFullYear() + '-01-01',
    to: new Date().getFullYear() + '-12-31'
  });
  const [sortConfig, setSortConfig] = useState<SortConfig | null>(null);
  const [filters, setFilters] = useState<FilterConfig[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Filter data by date range
  const filterByDateRange = (data: any[]) => {
    if (!dateRange.from || !dateRange.to) return data;
    
    const fromDate = new Date(dateRange.from);
    const toDate = new Date(dateRange.to);
    toDate.setHours(23, 59, 59, 999); // Include the entire end date
    
    return data.filter(item => {
      // Try different date fields based on report type
      let itemDate: Date | null = null;
      
      if (item['Applied Date']) {
        itemDate = new Date(item['Applied Date']);
      } else if (item['From Date']) {
        itemDate = new Date(item['From Date']);
      } else if (item['Joining Date']) {
        itemDate = new Date(item['Joining Date']);
      }
      
      if (!itemDate || isNaN(itemDate.getTime())) return true; // Include if no valid date
      
      return itemDate >= fromDate && itemDate <= toDate;
    });
  };

  // Calculate statistics
  const filteredLeaveRequests = useMemo(() => {
    if (!dateRange.from || !dateRange.to) return leaveRequests;
    
    const fromDate = new Date(dateRange.from);
    const toDate = new Date(dateRange.to);
    toDate.setHours(23, 59, 59, 999);
    
    return leaveRequests.filter(req => {
      const requestDate = new Date(req.created_at);
      return requestDate >= fromDate && requestDate <= toDate;
    });
  }, [leaveRequests, dateRange]);

  const totalRequests = filteredLeaveRequests.length;
  const approvedRequests = filteredLeaveRequests.filter(req => req.status === 'approved').length;
  const pendingRequests = filteredLeaveRequests.filter(req => req.status === 'pending').length;
  const rejectedRequests = filteredLeaveRequests.filter(req => req.status === 'rejected').length;

  // Leave type statistics
  const leaveTypeStats = filteredLeaveRequests.reduce((acc, req) => {
    acc[req.leave_type] = (acc[req.leave_type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  // Department statistics
  const departmentStats = departments.map(dept => {
    const deptEmployees = employees.filter(emp => emp.department_id === dept.id);
    const deptRequests = filteredLeaveRequests.filter(req => 
      deptEmployees.some(emp => emp.id === req.employee_id)
    );
    
    return {
      name: dept.name,
      employees: deptEmployees.length,
      requests: deptRequests.length,
      approved: deptRequests.filter(req => req.status === 'approved').length,
      pending: deptRequests.filter(req => req.status === 'pending').length,
      totalDays: deptRequests.filter(req => req.status === 'approved')
        .reduce((sum, req) => sum + req.days_count, 0)
    };
  });

  // Get report data based on selected report type
  const getReportData = useMemo(() => {
    const reportData = prepareReportsData(selectedReport, filteredLeaveRequests, employees, departments);
    const dateFilteredData = filterByDateRange(reportData.data);
    return dateFilteredData;
  }, [selectedReport, filteredLeaveRequests, employees, departments, dateRange]);

  // Get report headers
  const getReportHeaders = useMemo(() => {
    const reportData = prepareReportsData(selectedReport, filteredLeaveRequests, employees, departments);
    return reportData.headers;
  }, [selectedReport, filteredLeaveRequests, employees, departments]);

  // Apply filters and search
  const filteredData = useMemo(() => {
    let data = [...getReportData];

    // Apply search
    if (searchTerm) {
      data = data.filter(row =>
        Object.values(row).some(value =>
          String(value).toLowerCase().includes(searchTerm.toLowerCase())
        )
      );
    }

    // Apply column filters
    filters.forEach(filter => {
      if (filter.value) {
        data = data.filter(row =>
          String(row[filter.column]).toLowerCase().includes(filter.value.toLowerCase())
        );
      }
    });

    return data;
  }, [getReportData, searchTerm, filters]);

  // Apply sorting
  const sortedData = useMemo(() => {
    if (!sortConfig) return filteredData;

    return [...filteredData].sort((a, b) => {
      const aValue = a[sortConfig.key];
      const bValue = b[sortConfig.key];

      // Handle numeric values
      if (!isNaN(Number(aValue)) && !isNaN(Number(bValue))) {
        return sortConfig.direction === 'asc' 
          ? Number(aValue) - Number(bValue)
          : Number(bValue) - Number(aValue);
      }

      // Handle string values
      const aStr = String(aValue).toLowerCase();
      const bStr = String(bValue).toLowerCase();
      
      if (aStr < bStr) return sortConfig.direction === 'asc' ? -1 : 1;
      if (aStr > bStr) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });
  }, [filteredData, sortConfig]);

  // Pagination
  const paginatedData = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return sortedData.slice(startIndex, startIndex + itemsPerPage);
  }, [sortedData, currentPage, itemsPerPage]);

  const totalPages = Math.ceil(sortedData.length / itemsPerPage);

  const handleSort = (key: string) => {
    setSortConfig(current => {
      if (current?.key === key) {
        return current.direction === 'asc' 
          ? { key, direction: 'desc' }
          : null;
      }
      return { key, direction: 'asc' };
    });
  };

  const handleFilter = (column: string, value: string) => {
    setFilters(current => {
      const existing = current.find(f => f.column === column);
      if (existing) {
        if (value === '') {
          return current.filter(f => f.column !== column);
        }
        return current.map(f => f.column === column ? { ...f, value } : f);
      }
      return value ? [...current, { column, value }] : current;
    });
    setCurrentPage(1);
  };

  const clearAllFilters = () => {
    setFilters([]);
    setSearchTerm('');
    setSortConfig(null);
    setDateRange({
      from: new Date().getFullYear() + '-01-01',
      to: new Date().getFullYear() + '-12-31'
    });
    setCurrentPage(1);
  };

  const handleExport = (format: 'excel' | 'pdf') => {
    try {
      // Use all filtered data for export (not just current page)
      const exportData = {
        ...prepareReportsData(selectedReport, filteredLeaveRequests, employees, departments),
        data: sortedData // Use filtered and sorted data
      };
      
      // Add metadata to export
      const metadata = {
        'Generated On': new Date().toLocaleString(),
        'Report Type': selectedReport.charAt(0).toUpperCase() + selectedReport.slice(1),
        'Date Range': `${dateRange.from} to ${dateRange.to}`,
        'Total Records': sortedData.length,
        'Filters Applied': filters.length > 0 ? filters.map(f => `${f.column}: ${f.value}`).join(', ') : 'None',
        'Search Term': searchTerm || 'None'
      };

      let result;
      if (format === 'excel') {
        result = exportToExcel(exportData, metadata);
      } else {
        result = exportToPDF(exportData, metadata);
      }
      
      if (result.success) {
        setTimeout(() => {
          const event = new CustomEvent('showToast', {
            detail: {
              type: 'success',
              title: 'Export Successful',
              message: `${selectedReport.charAt(0).toUpperCase() + selectedReport.slice(1)} report exported as ${format.toUpperCase()} successfully. ${sortedData.length} records exported.`
            }
          });
          window.dispatchEvent(event);
        }, 100);
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      setTimeout(() => {
        const event = new CustomEvent('showToast', {
          detail: {
            type: 'error',
            title: 'Export Failed',
            message: `Failed to export report: ${error instanceof Error ? error.message : 'Unknown error'}`
          }
        });
        window.dispatchEvent(event);
      }, 100);
    }
  };

  const getSortIcon = (column: string) => {
    if (sortConfig?.key !== column) {
      return <ArrowUpDown className="w-4 h-4 text-gray-400" />;
    }
    return (
      <ArrowUpDown className={`w-4 h-4 ${
        sortConfig.direction === 'asc' ? 'text-blue-600 rotate-180' : 'text-blue-600'
      }`} />
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <BarChart3 className="w-8 h-8 text-indigo-600" />
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Reports & Analytics</h1>
            <p className="text-gray-600">Generate insights and reports for leave management</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => handleExport('excel')}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
          >
            <Download className="w-4 h-4" />
            Export Excel
          </button>
          <button
            onClick={() => handleExport('pdf')}
            className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
          >
            <Download className="w-4 h-4" />
            Export PDF
          </button>
        </div>
      </div>

      {/* Filters and Controls */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex flex-col gap-4">
          {/* Top Row - Report Type and Date Range */}
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-gray-500" />
              <span className="font-medium text-gray-700">Filters:</span>
            </div>
            
            <div className="flex flex-wrap gap-4">
              <div>
                <label className="block text-sm text-gray-600 mb-1">Report Type</label>
                <select
                  value={selectedReport}
                  onChange={(e) => {
                    setSelectedReport(e.target.value);
                    setCurrentPage(1);
                    clearAllFilters();
                  }}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                >
                  <option value="overview">Overview</option>
                  <option value="department">By Department</option>
                  <option value="employee">By Employee</option>
                  <option value="leave-type">By Leave Type</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm text-gray-600 mb-1">From Date</label>
                <input
                  type="date"
                  value={dateRange.from}
                  onChange={(e) => {
                    setDateRange({ ...dateRange, from: e.target.value });
                    setCurrentPage(1);
                  }}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
              
              <div>
                <label className="block text-sm text-gray-600 mb-1">To Date</label>
                <input
                  type="date"
                  value={dateRange.to}
                  onChange={(e) => {
                    setDateRange({ ...dateRange, to: e.target.value });
                    setCurrentPage(1);
                  }}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  min={dateRange.from}
                />
              </div>
            </div>
          </div>

          {/* Search and Additional Filters */}
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search across all columns..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
                className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
            
            <div className="flex gap-2">
              <select 
                value={itemsPerPage}
                onChange={(e) => {
                  setItemsPerPage(Number(e.target.value));
                  setCurrentPage(1);
                }}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value={10}>10 per page</option>
                <option value={25}>25 per page</option>
                <option value={50}>50 per page</option>
                <option value={100}>100 per page</option>
              </select>
              
              {(filters.length > 0 || searchTerm || sortConfig) && (
                <button
                  onClick={clearAllFilters}
                  className="flex items-center gap-1 px-3 py-2 text-gray-600 hover:text-gray-800 text-sm font-medium border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  <X className="w-4 h-4" />
                  Clear All
                </button>
              )}
            </div>
          </div>

          {/* Active Filters Display */}
          {(filters.length > 0 || searchTerm) && (
            <div className="flex flex-wrap gap-2">
              {(dateRange.from !== new Date().getFullYear() + '-01-01' || dateRange.to !== new Date().getFullYear() + '-12-31') && (
                <span className="inline-flex items-center gap-1 px-2 py-1 bg-purple-100 text-purple-800 text-sm rounded">
                  Date Range: {new Date(dateRange.from).toLocaleDateString()} - {new Date(dateRange.to).toLocaleDateString()}
                  <button onClick={() => {
                    setDateRange({
                      from: new Date().getFullYear() + '-01-01',
                      to: new Date().getFullYear() + '-12-31'
                    });
                    setCurrentPage(1);
                  }}>
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}
              {searchTerm && (
                <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-800 text-sm rounded">
                  Search: "{searchTerm}"
                  <button onClick={() => setSearchTerm('')}>
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}
              {filters.map((filter, index) => (
                <span key={index} className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-800 text-sm rounded">
                  {filter.column}: "{filter.value}"
                  <button onClick={() => handleFilter(filter.column, '')}>
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Data Grid Section */}
        <div className="mt-6 pt-6 border-t border-gray-200">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">
              {selectedReport.charAt(0).toUpperCase() + selectedReport.slice(1)} Report Data
            </h3>
            <div className="text-sm text-gray-600">
              Showing {paginatedData.length} of {sortedData.length} records
              {sortedData.length !== getReportData.length && (
                <span className="text-blue-600"> (filtered from {getReportData.length})</span>
              )}
            </div>
          </div>
        

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 text-xs">
              <tr>
                {getReportHeaders.map((header) => (
                  <th key={header} className="text-left py-3 px-4 font-medium text-gray-600 text-xs">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleSort(header)}
                        className="flex items-center gap-1 hover:text-gray-900 transition-colors"
                      >
                        {header}
                        {getSortIcon(header)}
                      </button>
                    </div>
                    {/* Column Filter */}
                    <div className="mt-1">
                      <input
                        type="text"
                        placeholder="Filter..."
                        value={filters.find(f => f.column === header)?.value || ''}
                        onChange={(e) => handleFilter(header, e.target.value)}
                        className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                        onClick={(e) => e.stopPropagation()}
                      />
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {paginatedData.length === 0 ? (
                <tr>
                  <td colSpan={getReportHeaders.length} className="text-center py-8 text-gray-500">
                    <div className="flex flex-col items-center gap-2">
                      <Search className="w-8 h-8 text-gray-400" />
                      <p>No data found matching your criteria</p>
                      <button
                        onClick={clearAllFilters}
                        className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                      >
                        Clear filters to see all data
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedData.map((row, index) => (
                  <tr key={index} className="border-b border-gray-100 hover:bg-gray-50">
                    {getReportHeaders.map((header) => (
                      <td key={header} className="py-3 px-4 text-gray-900">
                        {row[header]}
                      </td>
                    ))}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 mt-4 border-t border-gray-200">
            <div className="text-sm text-gray-600">
              Page {currentPage} of {totalPages}
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              
              {/* Page Numbers */}
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                const pageNum = Math.max(1, Math.min(totalPages - 4, currentPage - 2)) + i;
                return (
                  <button
                    key={pageNum}
                    onClick={() => setCurrentPage(pageNum)}
                    className={`px-3 py-1 text-sm border rounded ${
                      currentPage === pageNum
                        ? 'bg-indigo-600 text-white border-indigo-600'
                        : 'border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    {pageNum}
                  </button>
                );
              })}
              
              <button
                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
                className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Leave Type Distribution */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <PieChart className="w-5 h-5 text-gray-600" />
            Leave Type Distribution
          </h3>
          <div className="flex items-center justify-center">
            {totalRequests > 0 ? (
              <div className="relative w-48 h-48">
                {/* CSS-based pie chart */}
                <div className="w-full h-full rounded-full relative overflow-hidden">
                  {/* Background circle */}
                  <div className="absolute inset-0 rounded-full bg-gray-200"></div>
                  
                  {(() => {
                    const leaveTypes = Object.entries(leaveTypeStats);
                    const colors = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];
                    let currentAngle = 0;
                    
                    return leaveTypes.map(([type, count], index) => {
                      const percentage = count / totalRequests;
                      const angle = percentage * 360;
                      const segment = (
                        <div
                          key={type}
                          className="absolute inset-0 rounded-full"
                          style={{
                            background: `conic-gradient(transparent 0deg ${currentAngle}deg, ${colors[index % colors.length]} ${currentAngle}deg ${currentAngle + angle}deg, transparent ${currentAngle + angle}deg)`
                          }}
                        ></div>
                      );
                      currentAngle += angle;
                      return segment;
                    });
                  })()}
                  
                  {/* Center circle for donut effect */}
                  <div className="absolute inset-8 rounded-full bg-white flex items-center justify-center">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-gray-900">{totalRequests}</div>
                      <div className="text-xs text-gray-600">Total</div>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="w-48 h-48 rounded-full bg-gray-200 flex items-center justify-center">
                <div className="text-center text-gray-500">
                  <div className="text-lg font-medium">No Data</div>
                  <div className="text-sm">No requests found</div>
                </div>
              </div>
            )}
          </div>
          
          {/* Legend */}
          <div className="mt-6 space-y-2">
            {Object.entries(leaveTypeStats).map(([type, count], index) => {
              const colors = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];
              const percentage = totalRequests > 0 ? ((count / totalRequests) * 100).toFixed(1) : '0';
              
              return (
                <div key={type} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div 
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: colors[index % colors.length] }}
                    ></div>
                    <span className="text-sm text-gray-700 capitalize">{type}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-gray-900">{count}</span>
                    <span className="text-xs text-gray-500">({percentage}%)</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Approval Status */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <PieChart className="w-5 h-5 text-gray-600" />
            Request Status
          </h3>
          <div className="flex items-center justify-center">
            {totalRequests > 0 ? (
              <div className="relative w-48 h-48">
                {/* Simple CSS-based pie chart */}
                <div className="w-full h-full rounded-full relative overflow-hidden">
                  {/* Background circle */}
                  <div className="absolute inset-0 rounded-full bg-gray-200"></div>
                  
                  {/* Approved segment */}
                  {approvedRequests > 0 && (
                    <div
                      className="absolute inset-0 rounded-full"
                      style={{
                        background: `conic-gradient(#10b981 0deg ${(approvedRequests / totalRequests) * 360}deg, transparent ${(approvedRequests / totalRequests) * 360}deg)`
                      }}
                    ></div>
                  )}
                  
                  {/* Pending segment */}
                  {pendingRequests > 0 && (
                    <div
                      className="absolute inset-0 rounded-full"
                      style={{
                        background: `conic-gradient(transparent 0deg ${(approvedRequests / totalRequests) * 360}deg, #f59e0b ${(approvedRequests / totalRequests) * 360}deg ${((approvedRequests + pendingRequests) / totalRequests) * 360}deg, transparent ${((approvedRequests + pendingRequests) / totalRequests) * 360}deg)`
                      }}
                    ></div>
                  )}
                  
                  {/* Rejected segment */}
                  {rejectedRequests > 0 && (
                    <div
                      className="absolute inset-0 rounded-full"
                      style={{
                        background: `conic-gradient(transparent 0deg ${((approvedRequests + pendingRequests) / totalRequests) * 360}deg, #ef4444 ${((approvedRequests + pendingRequests) / totalRequests) * 360}deg 360deg)`
                      }}
                    ></div>
                  )}
                  
                  {/* Center circle for donut effect */}
                  <div className="absolute inset-8 rounded-full bg-white flex items-center justify-center">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-gray-900">{totalRequests}</div>
                      <div className="text-xs text-gray-600">Total</div>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="w-48 h-48 rounded-full bg-gray-200 flex items-center justify-center">
                <div className="text-center text-gray-500">
                  <div className="text-lg font-medium">No Data</div>
                  <div className="text-sm">No requests found</div>
                </div>
              </div>
            )}
          </div>
          
          {/* Legend */}
          <div className="mt-6 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <span className="text-sm text-gray-700">Approved</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-gray-900">{approvedRequests}</span>
                <span className="text-xs text-gray-500">
                  ({totalRequests > 0 ? ((approvedRequests / totalRequests) * 100).toFixed(1) : '0'}%)
                </span>
              </div>
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
                <span className="text-sm text-gray-700">Pending</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-gray-900">{pendingRequests}</span>
                <span className="text-xs text-gray-500">
                  ({totalRequests > 0 ? ((pendingRequests / totalRequests) * 100).toFixed(1) : '0'}%)
                </span>
              </div>
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                <span className="text-sm text-gray-700">Rejected</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-gray-900">{rejectedRequests}</span>
                <span className="text-xs text-gray-500">
                  ({totalRequests > 0 ? ((rejectedRequests / totalRequests) * 100).toFixed(1) : '0'}%)
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Reports;