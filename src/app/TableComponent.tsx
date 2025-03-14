'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { MRT_ColumnDef } from 'material-react-table';
import { useDebounce } from './use-debounce';
import { Avatar } from '@/components/ui/avatar';
import { AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { PlusIcon } from 'lucide-react';
import ESCustomTable from '../CustomComponent/ESCustomTable';

// Define the Person interface based on the expected data structure
interface Person {
  id: string;
  name: string;
  teams: string[];
  role: string;
  email: string;
  status: string;
  imageUrl?: string;
}

// Update the ColumnConfig interface to match your actual configuration
interface ColumnConfig {
  accessorKey: string;
  header: string;
  type: string;
  size?: number;
  filterType?: string;
  filterOptions?: string[];
  sortable?: boolean;
  cell?: string; // A string identifier for custom cell renderers
}

// The rest of your interfaces remain the same
interface TableConfig {
  columns: ColumnConfig[];
  features: {
    enablePagination?: boolean;
    enableRowSelection?: boolean;
    enableSearch?: boolean;
    enableFilters?: boolean;
    enableSorting?: boolean;
    defaultPageSize?: number;
    pageSizeOptions?: number[];
  };
  defaultSorting?: Array<{ id: string; desc: boolean }>;
}

interface JSONDrivenTableProps {
  tableConfig: TableConfig;
  data: Person[];
  isLoading?: boolean;
}

export default function JSONDrivenTable({
  tableConfig,
  data,
  isLoading = false
}: JSONDrivenTableProps) {
  // State for selected roles (for multi-select filtering)
  const [selectedRoles, setSelectedRoles] = useState<string[]>([]);
  const [selectedTeams, setSelectedTeams] = useState<string[]>([]);
  const [nameFilter, setNameFilter] = useState<string>('');
  const [debouncedNameFilter] = useDebounce(nameFilter, 300);
  
  // Generate columns based on configuration
  const columns = useMemo<MRT_ColumnDef<Person>[]>(() => {
    return tableConfig.columns.map((colConfig) => {
      const column: MRT_ColumnDef<Person> = {
        accessorKey: colConfig.accessorKey,
        header: colConfig.header,
        size: colConfig.size,
        enableSorting: colConfig.sortable !== false,
      };

      // Add filter functionality based on column config
      if (colConfig.filterType) {
        column.enableColumnFilter = true;
        
        if (colConfig.filterType === 'text' && colConfig.accessorKey === 'name') {
          column.Filter = ({ column }) => (
            <Input
              placeholder={`Filter ${colConfig.header.toLowerCase()}...`}
              value={nameFilter}
              onChange={(e) => setNameFilter(e.target.value)}
              className="mt-1 h-8 w-full border border-dashed font-normal text-foreground placeholder-muted-foreground"
            />
          );
        }
        
        if (colConfig.filterType === 'multiSelect' && colConfig.accessorKey === 'role') {
          column.Filter = ({ column }) => (
            <div className="space-y-2">
              {colConfig.filterOptions?.map((option) => (
                <div key={option} className="flex items-center space-x-2">
                  <Checkbox
                    id={`role-${option}`}
                    checked={selectedRoles.includes(option)}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        setSelectedRoles([...selectedRoles, option]);
                      } else {
                        setSelectedRoles(selectedRoles.filter(role => role !== option));
                      }
                    }}
                  />
                  <label
                    htmlFor={`role-${option}`}
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    {option}
                  </label>
                </div>
              ))}
            </div>
          );
        }

        if (colConfig.filterType === 'multiSelect' && colConfig.accessorKey === 'teams') {
          column.Filter = ({ column }) => (
            <div className="space-y-2">
              {colConfig.filterOptions?.map((option) => (
                <div key={option} className="flex items-center space-x-2">
                  <Checkbox
                    id={`team-${option}`}
                    checked={selectedTeams.includes(option)}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        setSelectedTeams([...selectedTeams, option]);
                      } else {
                        setSelectedTeams(selectedTeams.filter(team => team !== option));
                      }
                    }}
                  />
                  <label
                    htmlFor={`team-${option}`}
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    {option}
                  </label>
                </div>
              ))}
            </div>
          );
        }
      } else {
        column.enableColumnFilter = false;
      }

      // Setup custom cell renderers based on configuration
      if (colConfig.cell) {
        if (colConfig.cell === 'avatar') {
          column.Cell = ({ row }) => (
            <div className="flex items-center space-x-4">
              <Avatar className="h-10 w-10">
                {row.original.imageUrl ? (
                  <AvatarImage src={row.original.imageUrl} alt={row.original.name} />
                ) : (
                  <AvatarFallback>
                    {row.original.name.charAt(0).toUpperCase()}
                  </AvatarFallback>
                )}
              </Avatar>
              <div className="flex flex-col">
                <span className="font-medium">{row.original.name}</span>
                <span className="text-sm text-gray-500">@{row.original.name.toLowerCase().replace(' ', '')}</span>
              </div>
            </div>
          );
        } else if (colConfig.cell === 'badge') {
          column.Cell = ({ cell }) => {
            const value = cell.getValue<string>();
            let variant: 'default' | 'destructive' | 'outline' | 'secondary' = 'default';
            let bgColor = 'bg-blue-100';
            let textColor = 'text-blue-600';
            
            if (value === 'Working') {
              bgColor = 'bg-blue-100';
              textColor = 'text-blue-600';
            } else if (value === 'Inactive') {
              bgColor = 'bg-gray-100';
              textColor = 'text-gray-600';
            } else if (value === 'Pending') {
              bgColor = 'bg-yellow-100';
              textColor = 'text-yellow-600';
            }
            
            return (
              <span className={`inline-flex rounded-full px-3 py-1 text-xs font-medium ${bgColor} ${textColor}`}>
                {value}
              </span>
            );
          };
        } else if (colConfig.cell === 'teamBadges') {
          column.Cell = ({ row }) => {
            const teams = row.original.teams;
            
            const getTeamBadgeStyle = (team: string) => {
              switch(team) {
                case 'Design':
                  return 'bg-blue-100 text-blue-600';
                case 'Product':
                  return 'bg-indigo-100 text-indigo-600';
                case 'Development':
                  return 'bg-purple-100 text-purple-600';
                default:
                  return 'bg-gray-100 text-gray-600';
              }
            };
            
            return (
              <div className="flex items-center gap-1">
                {teams.map((team, index) => (
                  <span 
                    key={index} 
                    className={`inline-flex rounded-full px-3 py-1 text-xs font-medium ${getTeamBadgeStyle(team)}`}
                  >
                    {team}
                  </span>
                ))}
                <span className="ml-1 text-xs font-medium text-gray-400">+5</span>
              </div>
            );
          };
        }
      }

      return column;
    });
  }, [tableConfig.columns, nameFilter, selectedRoles, selectedTeams]);

  // Filter data based on selected roles, teams, and name filter
  const filteredData = useMemo(() => {
    let filtered = [...data];
    
    // Apply name filter
    if (debouncedNameFilter) {
      filtered = filtered.filter(person => 
        person.name.toLowerCase().includes(debouncedNameFilter.toLowerCase())
      );
    }
    
    // Apply role filter
    if (selectedRoles.length > 0) {
      filtered = filtered.filter(person => selectedRoles.includes(person.role));
    }
    
    // Apply teams filter
    if (selectedTeams.length > 0) {
      filtered = filtered.filter(person => 
        person.teams.some(team => selectedTeams.includes(team))
      );
    }
    
    return filtered;
  }, [data, debouncedNameFilter, selectedRoles, selectedTeams]);

  // Update column order to match the image
  const orderedColumns = useMemo(() => {
    const columnOrder = ['name', 'status', 'role', 'email', 'teams'];
    return columns.sort((a, b) => {
      const aKey = a.accessorKey as string;
      const bKey = b.accessorKey as string;
      return columnOrder.indexOf(aKey) - columnOrder.indexOf(bKey);
    });
  }, [columns]);

  return (
    <div className="space-y-4">
      <ESCustomTable
        data={filteredData}
        columns={orderedColumns}
        isLoading={isLoading}
        config={{
          enablePagination: tableConfig.features.enablePagination,
          enableRowSelection: tableConfig.features.enableRowSelection,
          enableSearch: tableConfig.features.enableSearch,
          enableFilters: tableConfig.features.enableFilters,
          enableSorting: tableConfig.features.enableSorting,
          defaultPageSize: tableConfig.features.defaultPageSize || 10,
          pageSizeOptions: tableConfig.features.pageSizeOptions || [5, 10, 20, 30, 40, 50]
        }}
        tableProps={{
          initialState: {
            sorting: tableConfig.defaultSorting || []
          }
        }}
      />
    </div>
  );
}