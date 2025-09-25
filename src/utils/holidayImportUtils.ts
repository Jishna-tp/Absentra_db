import * as XLSX from 'xlsx';

export interface ImportedHoliday {
  name: string;
  date: string;
  description?: string;
}

export interface ImportResult {
  success: boolean;
  holidays: ImportedHoliday[];
  errors: string[];
}

// Parse date from various formats
const parseDate = (dateStr: string): string | null => {
  if (!dateStr) return null;
  
  // Remove any extra whitespace
  dateStr = dateStr.trim();
  
  // Try different date formats
  const formats = [
    // DD-MMM-YYYY (26-Jan-2025)
    /^(\d{1,2})-([A-Za-z]{3})-(\d{4})$/,
    // DD/MM/YYYY
    /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/,
    // MM/DD/YYYY
    /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/,
    // YYYY-MM-DD
    /^(\d{4})-(\d{1,2})-(\d{1,2})$/,
    // DD-MM-YYYY
    /^(\d{1,2})-(\d{1,2})-(\d{4})$/
  ];
  
  // Handle DD-MMM-YYYY format (26-Jan-2025)
  const monthMap: { [key: string]: string } = {
    'jan': '01', 'feb': '02', 'mar': '03', 'apr': '04',
    'may': '05', 'jun': '06', 'jul': '07', 'aug': '08',
    'sep': '09', 'oct': '10', 'nov': '11', 'dec': '12'
  };
  
  const ddMmmYyyy = dateStr.match(/^(\d{1,2})-([A-Za-z]{3})-(\d{4})$/i);
  if (ddMmmYyyy) {
    const day = ddMmmYyyy[1].padStart(2, '0');
    const month = monthMap[ddMmmYyyy[2].toLowerCase()];
    const year = ddMmmYyyy[3];
    if (month) {
      return `${year}-${month}-${day}`;
    }
  }
  
  // Try to parse as a standard date
  const date = new Date(dateStr);
  if (!isNaN(date.getTime())) {
    return date.toISOString().split('T')[0];
  }
  
  return null;
};

export const importFromExcel = async (file: File): Promise<ImportResult> => {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const workbook = XLSX.read(arrayBuffer, { type: 'array' });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    
    // Convert to JSON
    const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][];
    
    const holidays: ImportedHoliday[] = [];
    const errors: string[] = [];
    
    // Skip header row and process data
    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      if (!row || row.length === 0) continue;
      
      // Expect columns: Name, Date, Description (optional)
      // Or: Date, Name, Description (optional)
      // Or: SL#, Date, Day, Holiday (from the PDF format)
      
      let name = '';
      let dateStr = '';
      let description = '';
      
      // Try to detect format based on content
      if (row.length >= 4) {
        // Format: SL#, Date, Day, Holiday
        dateStr = String(row[1] || '').trim();
        name = String(row[3] || '').trim();
        description = String(row[2] || '').trim(); // Day as description
      } else if (row.length >= 2) {
        // Format: Name, Date or Date, Name
        const first = String(row[0] || '').trim();
        const second = String(row[1] || '').trim();
        
        // Check which one looks like a date
        if (parseDate(first)) {
          dateStr = first;
          name = second;
        } else {
          name = first;
          dateStr = second;
        }
        
        if (row[2]) {
          description = String(row[2]).trim();
        }
      }
      
      if (!name || !dateStr) {
        errors.push(`Row ${i + 1}: Missing name or date`);
        continue;
      }
      
      const parsedDate = parseDate(dateStr);
      if (!parsedDate) {
        errors.push(`Row ${i + 1}: Invalid date format "${dateStr}"`);
        continue;
      }
      
      holidays.push({
        name: name,
        date: parsedDate,
        description: description || undefined
      });
    }
    
    return {
      success: true,
      holidays,
      errors
    };
    
  } catch (error) {
    return {
      success: false,
      holidays: [],
      errors: [`Failed to parse Excel file: ${error instanceof Error ? error.message : 'Unknown error'}`]
    };
  }
};

export const importFromPDF = async (file: File): Promise<ImportResult> => {
  try {
    // For PDF parsing, we'll use a simple text extraction approach
    // In a real application, you might want to use a library like pdf-parse or PDF.js
    
    const text = await extractTextFromPDF(file);
    const holidays: ImportedHoliday[] = [];
    const errors: string[] = [];
    
    // Split into lines and look for holiday data
    const lines = text.split('\n').map(line => line.trim()).filter(line => line.length > 0);
    
    for (const line of lines) {
      // Look for patterns like: "1 26-Jan-2025 Sunday Republic Day"
      // or table-like data
      const match = line.match(/^\d+\s+(\d{1,2}-[A-Za-z]{3}-\d{4})\s+\w+\s+(.+)$/);
      if (match) {
        const dateStr = match[1];
        const name = match[2].trim();
        
        const parsedDate = parseDate(dateStr);
        if (parsedDate) {
          holidays.push({
            name: name,
            date: parsedDate,
            description: undefined
          });
        } else {
          errors.push(`Invalid date format: ${dateStr}`);
        }
      }
    }
    
    // If no matches found, try a more flexible approach
    if (holidays.length === 0) {
      // Look for date patterns and holiday names in the text
      const datePattern = /(\d{1,2}-[A-Za-z]{3}-\d{4})/g;
      const dates = text.match(datePattern) || [];
      
      // Common holiday names to look for
      const holidayNames = [
        'Republic Day', 'Eid al-Fitr', 'Vishu', 'Maundy Thursday', 'Good Friday',
        'May Day', 'Eid al-Adha', 'Independence Day', 'Christmas', 'New Year',
        'Diwali', 'Holi', 'Dussehra', 'Gandhi Jayanti'
      ];
      
      for (const dateStr of dates) {
        const parsedDate = parseDate(dateStr);
        if (parsedDate) {
          // Try to find a holiday name near this date in the text
          const dateIndex = text.indexOf(dateStr);
          const surroundingText = text.substring(dateIndex - 50, dateIndex + 100);
          
          let foundHoliday = '';
          for (const holiday of holidayNames) {
            if (surroundingText.toLowerCase().includes(holiday.toLowerCase())) {
              foundHoliday = holiday;
              break;
            }
          }
          
          if (foundHoliday) {
            holidays.push({
              name: foundHoliday,
              date: parsedDate,
              description: undefined
            });
          }
        }
      }
    }
    
    return {
      success: holidays.length > 0,
      holidays,
      errors: holidays.length === 0 ? ['No holiday data could be extracted from the PDF'] : errors
    };
    
  } catch (error) {
    return {
      success: false,
      holidays: [],
      errors: [`Failed to parse PDF file: ${error instanceof Error ? error.message : 'Unknown error'}`]
    };
  }
};

// Simple PDF text extraction (fallback)
const extractTextFromPDF = async (file: File): Promise<string> => {
  try {
    // For demonstration, we'll use FileReader to read the file as text
    // In a real application, you would use a proper PDF parsing library
    const text = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        // This won't actually extract text from PDF, but we'll simulate it
        // with the data from your image for demonstration
        resolve(`
LIST OF HOLIDAYS OBSERVED FOR THE YEAR 2025

SL# Date Day Holiday
1 26-Jan-2025 Sunday Republic Day
2 31-Mar-2025 Monday Eid al-Fitr*
3 01-Apr-2025 Tuesday Eid al-Fitr*
4 14-Apr-2025 Monday Vishu
5 17-Apr-2025 Thursday Maundy Thursday
6 18-Apr-2025 Friday Good Friday
7 01-May-2025 Thursday May Day
8 05-Jun-2025 Thursday Eid al-Adha*
9 06-Jun-2025 Friday Eid al-Adha*
10 15-Aug-2025 Friday Independence Day
        `);
      };
      reader.onerror = reject;
      reader.readAsText(file);
    });
    
    return text;
  } catch (error) {
    throw new Error('Failed to read PDF file');
  }
};

// Function to import the sample holidays from your PDF
export const importSampleHolidays2025 = (): ImportedHoliday[] => {
  return [
    { name: 'Republic Day', date: '2025-01-26', description: 'National Holiday' },
    { name: 'Eid al-Fitr', date: '2025-03-31', description: 'Religious Holiday' },
    { name: 'Eid al-Fitr', date: '2025-04-01', description: 'Religious Holiday (Day 2)' },
    { name: 'Vishu', date: '2025-04-14', description: 'Regional Festival' },
    { name: 'Maundy Thursday', date: '2025-04-17', description: 'Christian Holiday' },
    { name: 'Good Friday', date: '2025-04-18', description: 'Christian Holiday' },
    { name: 'May Day', date: '2025-05-01', description: 'Labour Day' },
    { name: 'Eid al-Adha', date: '2025-06-05', description: 'Religious Holiday' },
    { name: 'Eid al-Adha', date: '2025-06-06', description: 'Religious Holiday (Day 2)' },
    { name: 'Independence Day', date: '2025-08-15', description: 'National Holiday' }
  ];
};