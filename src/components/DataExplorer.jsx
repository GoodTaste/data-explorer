import React, { useState, useEffect, useCallback } from 'react';
import { Table, TableHeader, TableBody, TableRow, TableCell } from './ui/table';
import { Input } from './ui/input';
import { Button } from './ui/button';
import Papa from 'papaparse';

const DataExplorer = () => {
  const [schema, setSchema] = useState(null);
  const [tables, setTables] = useState({});
  const [currentTable, setCurrentTable] = useState('');
  const [filteredData, setFilteredData] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const parseSchema = (markdown) => {
    console.log('Parsing schema from markdown:', markdown);
    const tables = [];
    let currentTable = null;
  
    markdown.split('\n').forEach(line => {
      console.log('Processing line:', line);
      if (line.startsWith('## ')) {
        if (currentTable) {
          tables.push(currentTable);
        }
        currentTable = { name: line.substring(3).trim(), columns: [] };
      } else if (line.startsWith('| ') && currentTable) {
        const [name, type] = line.split('|').filter(Boolean).map(s => s.trim());
        if (name && type) {
          currentTable.columns.push({ name, type });
        }
      }
    });
  
    if (currentTable) {
      tables.push(currentTable);
    }
  
    console.log('Parsed tables:', tables);
    return tables;
  };

  const loadTableData = useCallback(async (tableName) => {
    if (tables[tableName]) {
      setCurrentTable(tableName);
      setFilteredData(tables[tableName]);
      return;
    }

    try {
      setIsLoading(true);
      const url = `https://raw.githubusercontent.com/Meaningful-Bites/data/main/public_data/snapshots/latest/${tableName}.csv`;
      console.log(`Fetching data for ${tableName} from:`, url);
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const text = await response.text();
      console.log(`Received CSV data for ${tableName}:`, text.substring(0, 200) + '...'); // Log the first 200 characters
      
      const result = Papa.parse(text, { header: true });
      console.log(`Parsed data for ${tableName}:`, result.data.slice(0, 5)); // Log the first 5 rows
      
      setTables(prev => ({ ...prev, [tableName]: result.data }));
      setCurrentTable(tableName);
      setFilteredData(result.data);
    } catch (error) {
      console.error(`Error loading data for ${tableName}:`, error);
      setError(`Failed to load data for ${tableName}: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  }, [tables]);

  useEffect(() => {
    const fetchSchema = async () => {
      try {
        setIsLoading(true);
        const url = 'https://raw.githubusercontent.com/Meaningful-Bites/data/main/SCHEMA.md';
        console.log('Fetching schema from:', url);
        const response = await fetch(url);
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const text = await response.text();
        console.log('Received schema text:', text);
        
        const parsedSchema = parseSchema(text);
        console.log('Parsed schema:', parsedSchema);
        
        if (!parsedSchema || !Array.isArray(parsedSchema)) {
          throw new Error('Invalid schema format');
        }
        
        setSchema(parsedSchema);
        
        if (parsedSchema.length > 0) {
          await loadTableData(parsedSchema[0].name);
        }
      } catch (error) {
        console.error('Error fetching or parsing schema:', error);
        setError(`Failed to fetch or parse schema: ${error.message}`);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSchema();
  }, [loadTableData]);

  const handleSearch = (e) => {
    const term = e.target.value.toLowerCase();
    setSearchTerm(term);
    if (currentTable && tables[currentTable]) {
      const filtered = tables[currentTable].filter(item =>
        Object.values(item).some(val => 
          val.toString().toLowerCase().includes(term)
        )
      );
      setFilteredData(filtered);
    }
  };

  const handleSort = (key) => {
    const sorted = [...filteredData].sort((a, b) => 
      a[key] > b[key] ? 1 : -1
    );
    setFilteredData(sorted);
  };

  if (isLoading) {
    return <div className="p-4">Loading...</div>;
  }

  if (error) {
    return <div className="p-4 text-red-500">Error: {error}</div>;
  }

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Data Explorer</h1>
      {schema && schema.length > 0 ? (
        <>
          <div className="mb-4">
            {schema.map(table => (
              <Button 
                key={table.name} 
                onClick={() => loadTableData(table.name)}
                className="mr-2 mb-2"
              >
                {table.name}
              </Button>
            ))}
          </div>
          <Input
            type="text"
            placeholder="Search..."
            value={searchTerm}
            onChange={handleSearch}
            className="mb-4"
          />
          {currentTable && filteredData.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  {Object.keys(filteredData[0]).map(key => (
                    <TableCell key={key}>
                      <Button onClick={() => handleSort(key)}>{key}</Button>
                    </TableCell>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredData.map((item, index) => (
                  <TableRow key={index}>
                    {Object.values(item).map((value, valueIndex) => (
                      <TableCell key={valueIndex}>{value}</TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <p>{currentTable ? 'No data available' : 'Select a table to view data'}</p>
          )}
        </>
      ) : (
        <p>No schema available. Please check your SCHEMA.md file.</p>
      )}
    </div>
  );
};

export default DataExplorer;