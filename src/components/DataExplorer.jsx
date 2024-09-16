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

  const baseUrl = `https://raw.githubusercontent.com/Meaningful-Bites/data/main`;

  const parseSchema = useCallback((markdown) => {
    const tables = [];
    let currentTable = null;
  
    markdown.split('\n').forEach(line => {
      if (line.startsWith('## ')) {
        if (currentTable) {
          tables.push(currentTable);
        }
        currentTable = { name: line.substring(3).trim(), columns: [] };
      } else if (line.startsWith('| ') && currentTable) {
        const parts = line.split('|').filter(Boolean).map(s => s.trim());
        if (parts.length >= 2) {
          const [name, type] = parts;
          currentTable.columns.push({ name, type });
        }
      }
    });
  
    if (currentTable) {
      tables.push(currentTable);
    }
  
    return tables;
  }, []);

  const loadTableData = useCallback(async (tableName) => {
    setCurrentTable(tableName);
    if (tables[tableName]) {
      setFilteredData(tables[tableName]);
      return;
    }

    try {
      setIsLoading(true);
      const url = `${baseUrl}/public_data/snapshots/latest/${tableName}.csv`;
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const text = await response.text();
      const result = Papa.parse(text, { header: true });
      
      setTables(prev => ({ ...prev, [tableName]: result.data }));
      setFilteredData(result.data);
    } catch (error) {
      console.error(`Error loading data for ${tableName}:`, error);
      setError(`Failed to load data for ${tableName}: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  }, [tables, baseUrl]);

  useEffect(() => {
    const fetchSchema = async () => {
      try {
        setIsLoading(true);
        const url = `${baseUrl}/SCHEMA.md`;
        const response = await fetch(url);
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const text = await response.text();
        const parsedSchema = parseSchema(text);
        
        if (!parsedSchema || !Array.isArray(parsedSchema) || parsedSchema.length === 0) {
          throw new Error('Invalid schema format or empty schema');
        }
        
        setSchema(parsedSchema);
        await loadTableData(parsedSchema[0].name);
      } catch (error) {
        console.error('Error fetching or parsing schema:', error);
        setError(`Failed to fetch or parse schema: ${error.message}`);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSchema();
  }, [parseSchema, loadTableData, baseUrl]);

  const handleSearch = useCallback((e) => {
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
  }, [currentTable, tables]);

  const handleSort = useCallback((key) => {
    setFilteredData(prevData => [...prevData].sort((a, b) => 
      a[key] > b[key] ? 1 : -1
    ));
  }, []);

  if (isLoading) {
    return <div className="p-4">Loading...</div>;
  }

  if (error) {
    return <div className="p-4 text-red-500">Error: {error}</div>;
  }

  return (
    <div className="p-4 flex flex-col min-h-screen">
      <h1 className="text-2xl font-bold mb-4">Data Explorer</h1>
      {schema && schema.length > 0 ? (
        <div className="flex flex-col flex-grow">
          <div className="mb-4 sticky top-0 bg-white z-10 pb-4">
            <div className="flex flex-wrap mb-2">
              {schema.map(table => (
                <Button 
                  key={table.name} 
                  onClick={() => loadTableData(table.name)}
                  className="mr-2 mb-2"
                  variant={currentTable === table.name ? "default" : "outline"}
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
              className="max-w-sm"
            />
          </div>
          <div className="flex-grow overflow-auto">
            {isLoading ? (
              <p>Loading...</p>
            ) : currentTable && filteredData.length > 0 ? (
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
          </div>
        </div>
      ) : (
        <p>No schema available. Please check your SCHEMA.md file.</p>
      )}
    </div>
  );
};

export default DataExplorer;