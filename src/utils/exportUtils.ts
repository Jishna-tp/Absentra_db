import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export interface ExportData {
  title: string;
  data: any[];
  headers: string[];
  filename: string;
}

export interface ExportMetadata {
  [key: string]: string | number;
}

export const exportToExcel = (exportData: ExportData, metadata?: ExportMetadata) => {
  try {
    // Create a new workbook
    const wb = XLSX.utils.book_new();
    
    // Prepare data with proper formatting
    const formattedData = exportData.data.map(row => {
      const formattedRow: any = {};
      exportData.headers.forEach(header => {
        let value = row[header] || '';
        
        // Handle different data types
        if (typeof value === 'string' && value.includes('%')) {
          // Convert percentage strings to numbers
          formattedRow[header] = parseFloat(value.replace('%', '')) / 100;
        } else if (!isNaN(Date.parse(value)) && String(value).includes('/')) {
          // Handle dates
          formattedRow[header] = new Date(value);
        } else if (!isNaN(Number(value)) && value !== '') {
          // Handle numbers
          formattedRow[header] = Number(value);
        } else {
          formattedRow[header] = value;
        }
      });
      return formattedRow;
    });

    // Create main data worksheet
    const ws = XLSX.utils.json_to_sheet(formattedData, { header: exportData.headers });
    
    // Set column widths based on content
    const colWidths = exportData.headers.map(header => {
      const maxLength = Math.max(
        header.length,
        ...exportData.data.map(row => String(row[header] || '').length)
      );
      return { wch: Math.min(Math.max(maxLength + 2, 10), 50) };
    });
    ws['!cols'] = colWidths;

    // Apply formatting to headers
    const headerRange = XLSX.utils.decode_range(ws['!ref'] || 'A1');
    for (let col = headerRange.s.c; col <= headerRange.e.c; col++) {
      const cellAddress = XLSX.utils.encode_cell({ r: 0, c: col });
      if (!ws[cellAddress]) continue;
      
      ws[cellAddress].s = {
        font: { bold: true, color: { rgb: "FFFFFF" } },
        fill: { fgColor: { rgb: "4472C4" } },
        alignment: { horizontal: "center", vertical: "center" }
      };
    }

    // Format data cells
    for (let row = 1; row <= headerRange.e.r; row++) {
      for (let col = headerRange.s.c; col <= headerRange.e.c; col++) {
        const cellAddress = XLSX.utils.encode_cell({ r: row, c: col });
        if (!ws[cellAddress]) continue;
        
        const value = ws[cellAddress].v;
        
        // Apply number formatting
        if (typeof value === 'number' && value < 1 && value > 0) {
          ws[cellAddress].z = '0.00%'; // Percentage format
        } else if (typeof value === 'number' && Number.isInteger(value)) {
          ws[cellAddress].z = '0'; // Integer format
        } else if (value instanceof Date) {
          ws[cellAddress].z = 'mm/dd/yyyy'; // Date format
        }
        
        // Apply cell styling
        ws[cellAddress].s = {
          alignment: { horizontal: "left", vertical: "center" },
          border: {
            top: { style: "thin", color: { rgb: "D1D5DB" } },
            bottom: { style: "thin", color: { rgb: "D1D5DB" } },
            left: { style: "thin", color: { rgb: "D1D5DB" } },
            right: { style: "thin", color: { rgb: "D1D5DB" } }
          }
        };
      }
    }

    // Truncate sheet name to Excel's 31 character limit
    const sheetName = exportData.title.length > 31 
      ? exportData.title.substring(0, 31) 
      : exportData.title;
    
    // Add main data worksheet
    XLSX.utils.book_append_sheet(wb, ws, sheetName);

    // Add metadata worksheet if provided
    if (metadata) {
      const metadataArray = Object.entries(metadata).map(([key, value]) => ({
        Property: key,
        Value: value
      }));
      
      const metaWs = XLSX.utils.json_to_sheet(metadataArray);
      metaWs['!cols'] = [{ wch: 20 }, { wch: 30 }];
      
      // Style metadata headers
      ['A1', 'B1'].forEach(cell => {
        if (metaWs[cell]) {
          metaWs[cell].s = {
            font: { bold: true, color: { rgb: "FFFFFF" } },
            fill: { fgColor: { rgb: "6B7280" } },
            alignment: { horizontal: "center", vertical: "center" }
          };
        }
      });
      
      XLSX.utils.book_append_sheet(wb, metaWs, 'Metadata');
    }
    
    // Generate filename with timestamp
    const timestamp = new Date().toISOString().split('T')[0];
    const filename = `${exportData.filename}_${timestamp}.xlsx`;
    
    // Write file
    XLSX.writeFile(wb, filename);
    
    return { success: true, filename };
  } catch (error) {
    console.error('Excel export error:', error);
    return { success: false, error: 'Failed to export Excel file' };
  }
};

export const exportToPDF = (exportData: ExportData, metadata?: ExportMetadata) => {
  try {
    // Create new PDF document
    const doc = new jsPDF('landscape'); // Use landscape for better table display
    
    // Add title
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.text(exportData.title, 14, 20);
    
    // Add generation date
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Generated on: ${new Date().toLocaleString()}`, 14, 30);
    
    let yPosition = 40;
    
    // Add metadata if provided
    if (metadata) {
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text('Report Information:', 14, yPosition);
      yPosition += 10;
      
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      
      Object.entries(metadata).forEach(([key, value]) => {
        doc.text(`${key}: ${value}`, 14, yPosition);
        yPosition += 6;
      });
      
      yPosition += 10;
    }
    
    // Prepare table data with proper formatting
    const tableData = exportData.data.map(row => 
      exportData.headers.map(header => {
        const value = row[header];
        if (value === null || value === undefined) return '';
        if (typeof value === 'number') {
          return value.toLocaleString();
        }
        return String(value);
      })
    );
    
    // Add table with enhanced styling
    autoTable(doc, {
      head: [exportData.headers],
      body: tableData,
      startY: yPosition,
      styles: {
        fontSize: 8,
        cellPadding: 4,
        overflow: 'linebreak',
        halign: 'left',
        valign: 'middle',
      },
      headStyles: {
        fillColor: [68, 114, 196], // Blue header
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        fontSize: 9,
        halign: 'center',
      },
      alternateRowStyles: {
        fillColor: [248, 249, 250], // Light gray alternating rows
      },
      columnStyles: {
        // Auto-adjust column widths based on content
      },
      margin: { top: yPosition, left: 14, right: 14 },
      tableWidth: 'auto',
      theme: 'striped',
      didDrawPage: (data) => {
        // Add page numbers
        const pageCount = doc.getNumberOfPages();
        const pageSize = doc.internal.pageSize;
        const pageHeight = pageSize.height || pageSize.getHeight();
        
        doc.setFontSize(8);
        doc.setFont('helvetica', 'normal');
        doc.text(
          `Page ${data.pageNumber} of ${pageCount}`,
          pageSize.width - 30,
          pageHeight - 10
        );
        
        // Add footer with export info
        doc.text(
          `Exported from Absentra - ${new Date().toLocaleDateString()}`,
          14,
          pageHeight - 10
        );
      },
      didParseCell: (data) => {
        // Apply special formatting for specific data types
        const cellValue = data.cell.raw;
        
        // Highlight status columns
        if (data.column.dataKey !== undefined) {
          const header = exportData.headers[data.column.index];
          if (header === 'Status') {
            if (cellValue === 'Approved') {
              data.cell.styles.textColor = [34, 197, 94]; // Green
              data.cell.styles.fontStyle = 'bold';
            } else if (cellValue === 'Rejected') {
              data.cell.styles.textColor = [239, 68, 68]; // Red
              data.cell.styles.fontStyle = 'bold';
            } else if (cellValue === 'Pending') {
              data.cell.styles.textColor = [245, 158, 11]; // Orange
              data.cell.styles.fontStyle = 'bold';
            }
          }
        }
      }
    });
    
    // Generate filename with timestamp
    const timestamp = new Date().toISOString().split('T')[0];
    const filename = `${exportData.filename}_${timestamp}.pdf`;
    
    // Save the PDF
    doc.save(filename);
    
    return { success: true, filename };
  } catch (error) {
    console.error('PDF export error:', error);
    return { success: false, error: 'Failed to export PDF file' };
  }
};

export const prepareReportsData = (
  reportType: string,
  leaveRequests: any[],
  employees: any[],
  departments: any[]
) => {
  switch (reportType) {
    case 'overview':
      return {
        title: 'Leave Management Overview Report',
        filename: 'leave_overview_report',
        headers: ['Employee Name', 'Employee ID', 'Department', 'Leave Type', 'From Date', 'To Date', 'Days', 'Status', 'Applied Date'],
        data: leaveRequests.map(request => {
          const employee = employees.find(emp => emp.id === request.employee_id);
          const department = departments.find(dept => dept.id === employee?.department_id);
          return {
            'Employee Name': employee?.name || 'Unknown',
            'Employee ID': employee?.employee_id || 'Unknown',
            'Department': department?.name || 'Unknown',
            'Leave Type': request.leave_type.charAt(0).toUpperCase() + request.leave_type.slice(1),
            'From Date': new Date(request.from_date).toLocaleDateString(),
            'To Date': new Date(request.to_date).toLocaleDateString(),
            'Days': request.days_count,
            'Status': request.status.charAt(0).toUpperCase() + request.status.slice(1),
            'Applied Date': new Date(request.created_at).toLocaleDateString()
          };
        })
      };
      
    case 'department':
      const departmentStats = departments.map(dept => {
        const deptEmployees = employees.filter(emp => emp.department_id === dept.id);
        const deptRequests = leaveRequests.filter(req => 
          deptEmployees.some(emp => emp.id === req.employee_id)
        );
        
        return {
          'Department': dept.name,
          'Total Employees': deptEmployees.length,
          'Total Requests': deptRequests.length,
          'Approved': deptRequests.filter(req => req.status === 'approved').length,
          'Pending': deptRequests.filter(req => req.status === 'pending').length,
          'Rejected': deptRequests.filter(req => req.status === 'rejected').length,
          'Total Days Approved': deptRequests
            .filter(req => req.status === 'approved')
            .reduce((sum, req) => sum + req.days_count, 0),
          'Avg Days per Employee': deptEmployees.length > 0 
            ? (deptRequests.filter(req => req.status === 'approved')
                .reduce((sum, req) => sum + req.days_count, 0) / deptEmployees.length).toFixed(1)
            : '0'
        };
      });
      
      return {
        title: 'Department-wise Leave Report',
        filename: 'department_leave_report',
        headers: ['Department', 'Total Employees', 'Total Requests', 'Approved', 'Pending', 'Rejected', 'Total Days Approved', 'Avg Days per Employee'],
        data: departmentStats
      };
      
    case 'employee':
      const employeeStats = employees.map(emp => {
        const empRequests = leaveRequests.filter(req => req.employee_id === emp.id);
        const department = departments.find(dept => dept.id === emp.department_id);
        
        return {
          'Employee Name': emp.name,
          'Employee ID': emp.employee_id,
          'Department': department?.name || 'Unknown',
          'Position': emp.position,
          'Total Requests': empRequests.length,
          'Approved': empRequests.filter(req => req.status === 'approved').length,
          'Pending': empRequests.filter(req => req.status === 'pending').length,
          'Rejected': empRequests.filter(req => req.status === 'rejected').length,
          'Total Days Used': empRequests
            .filter(req => req.status === 'approved')
            .reduce((sum, req) => sum + req.days_count, 0),
          'Joining Date': new Date(emp.joining_date).toLocaleDateString(),
          'Status': emp.status.charAt(0).toUpperCase() + emp.status.slice(1)
        };
      });
      
      return {
        title: 'Employee-wise Leave Report',
        filename: 'employee_leave_report',
        headers: ['Employee Name', 'Employee ID', 'Department', 'Position', 'Total Requests', 'Approved', 'Pending', 'Rejected', 'Total Days Used', 'Joining Date', 'Status'],
        data: employeeStats
      };
      
    case 'leave-type':
      const leaveTypeStats = ['casual', 'sick', 'paid', 'personal', 'maternity', 'paternity'].map(type => {
        const typeRequests = leaveRequests.filter(req => req.leave_type === type);
        
        return {
          'Leave Type': type.charAt(0).toUpperCase() + type.slice(1),
          'Total Requests': typeRequests.length,
          'Approved': typeRequests.filter(req => req.status === 'approved').length,
          'Pending': typeRequests.filter(req => req.status === 'pending').length,
          'Rejected': typeRequests.filter(req => req.status === 'rejected').length,
          'Total Days': typeRequests
            .filter(req => req.status === 'approved')
            .reduce((sum, req) => sum + req.days_count, 0),
          'Avg Days per Request': typeRequests.length > 0 
            ? (typeRequests.reduce((sum, req) => sum + req.days_count, 0) / typeRequests.length).toFixed(1)
            : '0',
          'Approval Rate': typeRequests.length > 0 
            ? ((typeRequests.filter(req => req.status === 'approved').length / typeRequests.length) * 100).toFixed(1) + '%'
            : '0%'
        };
      }).filter(stat => stat['Total Requests'] > 0);
      
      return {
        title: 'Leave Type Analysis Report',
        filename: 'leave_type_report',
        headers: ['Leave Type', 'Total Requests', 'Approved', 'Pending', 'Rejected', 'Total Days', 'Avg Days per Request', 'Approval Rate'],
        data: leaveTypeStats
      };
      
    default:
      return prepareReportsData('overview', leaveRequests, employees, departments);
  }
};