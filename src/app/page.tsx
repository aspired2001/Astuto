
'use client';

import React, { useState, useEffect } from 'react';
import JSONDrivenTable from "./TableComponent";
import tableConfig from './JsonData/tableConfig.json';
import tableData from './JsonData/tableData.json';

export default function TablePage() {
  const [isLoading, setIsLoading] = useState(true);
  
  // Simulate loading data from an API
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1000);
    
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="container mx-auto py-8">
      <h1 className="mb-6 text-2xl font-bold">JSON Driven Table</h1>
      <div className="rounded-lg border bg-card p-6 shadow-sm">
        <JSONDrivenTable 
          tableConfig={tableConfig} 
          data={tableData} 
          isLoading={isLoading} 
        />
      </div>
    </div>
  );
}
