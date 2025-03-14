// @ts-nocheck
import React, { useState } from 'react';
import {
  MRT_SortingState,
  MaterialReactTable,
  useMaterialReactTable,
  type MRT_DensityState,
  type MRT_Row,
  type MaterialReactTableProps
} from 'material-react-table';
import { type MRT_ColumnDef } from 'material-react-table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,


  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import {
  Columns,
  Filter,
  Maximize2,
  Minimize2,
  Monitor,
  Search,
  Download,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Eye,
  EyeOff,
  ChevronUp,
  ChevronDown,
  Plus,
  LucideIcon
} from 'lucide-react';
import { mkConfig, generateCsv, download } from 'export-to-csv';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Pin, PinOff } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from '@/components/ui/tooltip';
import ExpandableCell from './ExpandableCell';
import FilterPopover from './FilterPopover';

interface CustomButton {
  label: string;
  onClick: () => void;
  icon?: LucideIcon;
  variant?:
    | 'default'
    | 'destructive'
    | 'outline'
    | 'secondary'
    | 'ghost'
    | 'link';
}

interface TableConfig {
  enableRowSelection?: boolean;
  enableColumnPinning?: boolean;
  enableHiding?: boolean;
  enableRowActions?: boolean;
  enableSearch?: boolean;
  enableAddItem?: boolean;
  enableExport?: boolean;
  enableColumnVisibility?: boolean;
  enableFilters?: boolean;
  enableDensityToggle?: boolean;
  enableFullScreen?: boolean;
  enablePagination?: boolean;
  enableSorting?: boolean;
  enableSticky?: boolean;
  enableColumnOrdering?: boolean;
  defaultPageSize?: number;
  pageSizeOptions?: number[];
  onAddItem?: () => void;
  customButtons?: CustomButton[];
}

interface MuiCustomProps {
  tableContainerProps?: Record<string, any>;
  tablePaperProps?: Record<string, any>;
  tableProps?: Record<string, any>;
  tableHeadProps?: Record<string, any>;
  tableBodyProps?: Record<string, any>;
  toolbarProps?: Record<string, any>;
  bottomToolbarProps?: Record<string, any>;
  tableHeadCellProps?: Record<string, any>;
  tableBodyCellProps?: Record<string, any>;
  tableHeadRowProps?: Record<string, any>;
  tableBodyRowProps?: Record<string, any>;
}

interface TableProps<T extends Record<string, any>> {
  data: T[];
  columns: MRT_ColumnDef<T>[];
  config?: TableConfig;
  muiProps?: MuiCustomProps;
  tableProps?: Partial<MaterialReactTableProps<T>>;
  isLoading?: boolean;
}

const defaultConfig: TableConfig = {
  enableAddItem: false,
  enableSearch: true,
  enableExport: true,
  enableHiding: false,
  enableColumnVisibility: true,
  enableFilters: true,
  enableDensityToggle: true,
  enableFullScreen: true,
  enablePagination: true,
  enableSorting: true,
  enableSticky: true,
  enableColumnOrdering: true,
  defaultPageSize: 10,
  pageSizeOptions: [5, 10, 20, 30, 40, 50],
  enableColumnPinning: true,
  customButtons: []
};

export default function ESCustomTable<T extends Record<string, any>>({
  data,
  columns,
  config = {},
  muiProps = {},
  tableProps = {},
  isLoading = false
}: TableProps<T>) {
  const [isFullScreen, setIsFullScreen] = useState(false);
  const finalConfig = { ...defaultConfig, ...config };
  const [showFilters, setShowFilters] = useState(false);
  const csvConfig = mkConfig({
    fieldSeparator: ',',
    decimalSeparator: '.',
    useKeysAsHeaders: true
  });

  const handleExportRows = (rows: MRT_Row<T>[]) => {
    const rowData = rows.map((row) => row.original);
    const csv = generateCsv(csvConfig)(rowData);
    download(csvConfig)(csv);
  };

  const handleExportRowsPDF = (rows: MRT_Row<T>[]) => {
    const doc = new jsPDF();
    const tableData = rows.map((row) => Object.values(row.original));
    const tableHeaders = columns.map((c) => c.header);

    autoTable(doc, {
      head: [tableHeaders],
      body: tableData
    });

    doc.save('table-export.pdf');
  };

  const enhancedColumns: MRT_ColumnDef<T>[] = columns.map((column) => {
    // Store the original Cell renderer if it exists
    const originalCellRenderer = column.Cell;

    return {
      ...column,
      Cell: ({ cell, column, row, table }) => {
        const value = cell.getValue();
        const searchTerm = table.getState().globalFilter ?? '';
        const cellWidth = column.getSize(); // Get current column width

        // If value is not a string or is short, use original renderer or default
        if (typeof value !== 'string' || value.length <= 50) {
          if (originalCellRenderer) {
            return originalCellRenderer({
              cell,
              column,
              row,
              table,
              renderedCellValue: value?.toString() ?? null
            });
          }
          return value?.toString() ?? null;
        }

        // For long string values, wrap in ExpandableCell
        return (
          <ExpandableCell
            value={value}
            maxLength={50}
            searchTerm={searchTerm}
          />
        );
      }
    };
  });

  // const initialSortingState: MRT_SortingState = [
  //   {
  //     id: 'creation_date',
  //     desc: true
  //   }
  // ];

  const table = useMaterialReactTable({
    columns: enhancedColumns,
    data: data || [],
    enableStickyHeader: finalConfig.enableSticky,
    enableColumnOrdering: finalConfig.enableColumnOrdering,
    enableSorting: finalConfig.enableSorting,
    enableColumnFilters: finalConfig.enableFilters,
    enableColumnActions: false,
    enableGlobalFilter: finalConfig.enableSearch,
    enablePagination: finalConfig.enablePagination,
    enableRowSelection: finalConfig.enableRowSelection,
    enableColumnPinning: finalConfig.enableColumnPinning,
    muiPaginationProps: {
      color: 'secondary',
      shape: 'rounded',
      showRowsPerPage: false,
      variant: 'outlined'
    },
    state: {
      showProgressBars: isLoading
    },
    paginationDisplayMode: 'pages',
    renderToolbarInternalActions: ({ table }) => (
      <div className="flex items-center gap-2 ">
        {finalConfig.enableSearch && (
          <div className="relative h-full">
            <Search className="absolute left-2 top-2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search..."
              value={table.getState().globalFilter ?? ''}
              onChange={(e) => table.setGlobalFilter(e.target.value)}
              className={`h-[36px] w-[300px] pl-8 ${
                showFilters ? 'text-green' : 'text-green'
              }`}
            />
          </div>
        )}

        {/* Render custom buttons */}
        {finalConfig.customButtons?.map((button, index) => {
          const IconComponent = button.icon;
          return (
            <Button
              key={index}
              variant={button.variant || 'outline'}
              size="sm"
              onClick={button.onClick}
              className="ml-2 bg-white dark:bg-background"
            >
              {IconComponent && <IconComponent className="mr-2 h-4 w-4" />}
              {button.label}
            </Button>
          );
        })}

        {finalConfig.enableAddItem && (
          <Button
            variant="outline"
            size="sm"
            onClick={finalConfig.onAddItem}
            className="ml-2 bg-white dark:bg-background"
          >
            <Plus className="mr-2 h-4 w-4" />
            Add Item
          </Button>
        )}

        {finalConfig.enableExport && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="bg-white dark:bg-background"
              >
                <Download className="mr-2 h-4 w-4" />
                Export
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="z-[2000]" align="end">
              <DropdownMenuItem
                onClick={() =>
                  handleExportRows(
                    table.getPrePaginationRowModel().rows as MRT_Row<T>[]
                  )
                }
              >
                Export All (CSV)
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() =>
                  handleExportRows(table.getRowModel().rows as MRT_Row<T>[])
                }
              >
                Export Page (CSV)
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() =>
                  handleExportRowsPDF(
                    table.getPrePaginationRowModel().rows as MRT_Row<T>[]
                  )
                }
              >
                Export All (PDF)
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() =>
                  handleExportRowsPDF(table.getRowModel().rows as MRT_Row<T>[])
                }
              >
                Export Page (PDF)
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}

        {finalConfig.enableColumnVisibility && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="bg-white dark:bg-background"
                aria-label="Toggle column visibility menu"
              >
                <Columns className="mr-2 h-4 w-4 " />
                <span>Columns</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              className="max-h-[400px] w-[300px] overflow-y-auto p-2"
              align="end"
              role="menu"
              aria-label="Column visibility options"
            >
              <div className="flex h-full flex-col gap-4">
                <div
                  className="flex flex-grow flex-col gap-2 overflow-y-auto"
                  role="group"
                  aria-label="Column visibility toggles"
                >
                  {table.getAllColumns().map((column) => {
                    const isPinnedLeft = column.getIsPinned() === 'left';
                    const isPinnedRight = column.getIsPinned() === 'right';
                    const isVisible = column.getIsVisible();
                    const columnId = column.id;

                    return (
                      <div
                        key={columnId}
                        className="flex items-center justify-between gap-10 rounded-sm px-2 py-1 hover:bg-accent hover:text-accent-foreground"
                        role="menuitem"
                      >
                        <div className="flex items-center gap-2">
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className={`h-8 w-8 p-1 transition-colors hover:bg-muted ${
                                    isVisible
                                      ? 'text-primary hover:text-primary/80'
                                      : 'text-muted-foreground hover:text-muted-foreground/80'
                                  }`}
                                  onClick={() => column.toggleVisibility()}
                                  aria-pressed={isVisible}
                                  aria-label={`${
                                    isVisible ? 'Hide' : 'Show'
                                  } ${columnId} column`}
                                >
                                  {isVisible ? (
                                    <Eye className="h-4 w-4" />
                                  ) : (
                                    <EyeOff className="h-4 w-4" />
                                  )}
                                  <span className="absolute h-[1px] w-[1px] overflow-hidden whitespace-nowrap border-0 p-0 [clip:rect(0,0,0,0)]">
                                    {isVisible ? 'Hide' : 'Show'}
                                    {columnId} column
                                  </span>
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                {isVisible ? 'Hide' : 'Show'} column
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                          <span
                            className="-ml-2 text-sm capitalize"
                            id={`column-label-${columnId}`}
                          >
                            {typeof column.columnDef.header === 'function'
                              ? String(column.columnDef.header)
                              : column.columnDef.header || columnId}
                          </span>
                        </div>

                        {column.getCanPin() && (
                          <div
                            className="flex items-center gap-1"
                            role="group"
                            aria-label={`Pinning controls for ${columnId} column`}
                          >
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    variant={isPinnedLeft ? 'default' : 'ghost'}
                                    size="sm"
                                    className={`h-6 w-6 p-0 transition-colors hover:bg-violet-200 ${
                                      !isVisible
                                        ? 'cursor-not-allowed opacity-50'
                                        : ''
                                    }`}
                                    onClick={() => {
                                      if (!isVisible) return;
                                      column.pin(isPinnedLeft ? false : 'left');
                                    }}
                                    disabled={!isVisible}
                                    aria-label={`${
                                      isPinnedLeft ? 'Unpin from' : 'Pin to'
                                    } left`}
                                  >
                                    <Pin className="h-3 w-3" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                  {isPinnedLeft
                                    ? 'Unpin from left'
                                    : 'Pin to left'}
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>

                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    variant={
                                      isPinnedRight ? 'default' : 'ghost'
                                    }
                                    size="sm"
                                    className={`h-6 w-6 p-0 transition-colors hover:bg-violet-200 ${
                                      !isVisible
                                        ? 'cursor-not-allowed opacity-50'
                                        : ''
                                    }`}
                                    onClick={() => {
                                      if (!isVisible) return;
                                      column.pin(
                                        isPinnedRight ? false : 'right'
                                      );
                                    }}
                                    disabled={!isVisible}
                                    aria-label={`${
                                      isPinnedRight ? 'Unpin from' : 'Pin to'
                                    } right`}
                                  >
                                    <Pin className="h-3 w-3 rotate-90" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                  {isPinnedRight
                                    ? 'Unpin from right'
                                    : 'Pin to right'}
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                <div
                  className="sticky bottom-0 z-10 mt-2 border-t bg-white pt-2 dark:bg-background"
                  role="group"
                  aria-label="Reset options"
                >
                  <div className="flex justify-between px-2 pb-2">
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => table.resetColumnPinning()}
                            className="flex items-center gap-1"
                            aria-label="Reset all column pins"
                          >
                            <PinOff className="h-3 w-3" />
                            <span className="text-xs">Reset Pins</span>
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          Reset all column pins to default
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>

                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              table.toggleAllColumnsVisible(true);
                              table.resetColumnPinning();
                            }}
                            className="text-xs"
                            aria-label="Reset all column settings"
                          >
                            Reset All
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          Reset visibility and pins for all columns
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                </div>
              </div>
            </DropdownMenuContent>
          </DropdownMenu>
        )}

        {finalConfig.enableFilters && <FilterPopover table={table} />}

        {finalConfig.enableDensityToggle && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              const currentDensity = table.getState().density;
              const newDensity: MRT_DensityState =
                currentDensity === 'comfortable'
                  ? 'compact'
                  : currentDensity === 'compact'
                  ? 'spacious'
                  : 'comfortable';
              table.setDensity(newDensity);
            }}
            className="bg-white dark:bg-background"
          >
            <Monitor className="mr-2 h-4 w-4" />
            Density
          </Button>
        )}

        {finalConfig.enableFullScreen && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setIsFullScreen(!isFullScreen);
              table.setIsFullScreen(!isFullScreen);
            }}
            className="bg-white dark:bg-background"
          >
            {isFullScreen ? (
              <Minimize2 className="mr-2 h-4 w-4" />
            ) : (
              <Maximize2 className="mr-2 h-4 w-4" />
            )}
            {isFullScreen ? 'Exit Fullscreen' : 'Fullscreen'}
          </Button>
        )}
      </div>
    ),
    renderBottomToolbar: () => {
      const currentPage = table.getState().pagination.pageIndex + 1;
      const totalPages = table.getPageCount();

      const getVisiblePages = () => {
        const pages = [];

        // Always add page 1
        pages.push(1);

        if (currentPage <= 4) {
          // Near the start
          for (let i = 2; i <= Math.min(5, totalPages - 1); i++) {
            pages.push(i);
          }
          if (totalPages > 6) pages.push('ellipsis');
        } else if (currentPage >= totalPages - 3) {
          // Near the end
          if (totalPages > 6) pages.push('ellipsis');
          for (let i = totalPages - 4; i < totalPages; i++) {
            pages.push(i);
          }
        } else {
          // In the middle
          pages.push('ellipsis');
          for (let i = currentPage - 1; i <= currentPage + 1; i++) {
            pages.push(i);
          }
          pages.push('ellipsis');
        }

        // Always add last page
        if (totalPages > 1) {
          pages.push(totalPages);
        }

        return pages;
      };

      return (
        <div className="flex items-center justify-between px-2 py-4">
          {finalConfig.enablePagination && (
            <>
              <div className="flex items-center space-x-4">
                <Select
                  value={table.getState().pagination.pageSize.toString()}
                  onValueChange={(value) => {
                    table.setPageSize(Number(value));
                  }}
                >
                  <SelectTrigger className="h-8 w-[70px]">
                    <SelectValue>
                      {table.getState().pagination.pageSize}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {finalConfig.pageSizeOptions?.map((size) => (
                      <SelectItem key={size} value={size.toString()}>
                        {size}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <span className="text-sm text-muted-foreground">
                  rows per page
                </span>
              </div>

              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => table.setPageIndex(0)}
                  disabled={!table.getCanPreviousPage()}
                >
                  <ChevronsLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => table.previousPage()}
                  disabled={!table.getCanPreviousPage()}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>

                <div className="flex items-center gap-1">
                  {getVisiblePages().map((pageNum, idx) => {
                    if (pageNum === 'ellipsis') {
                      return (
                        <Button
                          key={`ellipsis-${idx}`}
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 cursor-default"
                          disabled
                        >
                          ...
                        </Button>
                      );
                    }
                    return (
                      <Button
                        key={pageNum}
                        variant={
                          currentPage === pageNum ? 'default' : 'outline'
                        }
                        size="icon"
                        onClick={() =>
                          typeof pageNum === 'number' &&
                          table.setPageIndex(pageNum - 1)
                        }
                        className="h-8 w-8"
                      >
                        {pageNum}
                      </Button>
                    );
                  })}
                </div>

                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => table.nextPage()}
                  disabled={!table.getCanNextPage()}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => table.setPageIndex(table.getPageCount() - 1)}
                  disabled={!table.getCanNextPage()}
                >
                  <ChevronsRight className="h-4 w-4" />
                </Button>
              </div>
            </>
          )}
        </div>
      );
    },
    initialState: {
      // sorting: initialSortingState,
      pagination: { pageSize: finalConfig.defaultPageSize ?? 10, pageIndex: 0 },
      showColumnFilters: false
    },
    mrtTheme: (theme) => ({
      matchHighlightColor: '#000'
    }),
    muiTablePaperProps: {
      elevation: 0,
      sx: {
        backgroundColor: 'hsl(var(--escustom))',
        color: 'hsl(var(--foreground))',
        '& .MuiBox-root, &.MuiPaper-root': {
          backgroundColor: 'transparent',
          color: 'hsl(var(--foreground))'
        },
        '& .MuiBadge-root': {
          '& .MuiButtonBase-root': {
            '& .MuiSvgIcon-root': {
              fill: 'hsl(var(--escustom))'
            }
          }
        },

        ...(muiProps.tablePaperProps?.sx || {})
      },
      ...muiProps.tablePaperProps
    },
    muiTableContainerProps: {
      sx: {
        '& .MuiBox-root': {
          backgroundColor: 'hsl(var(--escustom))',
          color: 'hsl(var(--foreground))'
        },
        border: '1px solid hsl(var(--border))',
        borderRadius: '8px',
        maxHeight: 'calc(100vh - 300px)',
        height: 'auto',
        overflow: 'auto',
        width: '100%', // Ensure container takes full width
        ...(muiProps.tableContainerProps?.sx || {})
      },
      ...muiProps.tableContainerProps
    },

    muiTableProps: {
      sx: {
        backgroundColor: 'hsl(var(--escustom))',
        color: 'hsl(var(--foreground))',
        tableLayout: 'auto',
        width: '100%',
        '& td, & th': {
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          minWidth: '0'
        },
        ...(muiProps.tableProps?.sx || {})
      },
      ...muiProps.tableProps
    },
    muiTableBodyRowProps: {
      sx: {
        backgroundColor: 'hsl(var(--escustom))',
        color: 'hsl(var(--foreground))',
        ...(muiProps.tableBodyRowProps?.sx || {})
      },
      ...muiProps.tableBodyRowProps
    },
  muiTableHeadRowProps: {
  sx: {
    backgroundColor: 'hsl(var(--escustom))', // Ensure a visible background color
    color: 'hsl(var(--foreground))',
    position: 'sticky',
    top: 0, // Ensures the header stays at the top
    zIndex: 100, // Keeps the header above the table content
    ...(muiProps.tableHeadRowProps?.sx || {})
  },
  ...muiProps.tableHeadRowProps
},

    muiTableBodyCellProps: {
      sx: {
        color: 'hsl(var(--foreground))',
        borderBottom: '1px solid hsl(var(--border))',
        padding: '8px',
        paddingLeft: '16px',
        '&:hover': {
          overflow: 'visible',
          whiteSpace: 'normal',
          wordBreak: 'break-word'
        },
        ...(muiProps.tableBodyCellProps?.sx || {})
      },
      ...muiProps.tableBodyCellProps
    },
    muiTableHeadProps: muiProps.tableHeadProps,
    muiTableBodyProps: {
      sx: {
        backgroundColor: 'hsl(var(--escustom))',
        color: 'hsl(var(--foreground))',
        ...(muiProps.tableBodyProps?.sx || {})
      },
      ...muiProps.tableBodyProps
    },
    muiTopToolbarProps: {
      sx: {
        color: 'hsl(var(--foreground))',
        ...(muiProps.toolbarProps?.sx || {})
      },
      ...muiProps.toolbarProps
    },
    muiBottomToolbarProps: {
      sx: {
        boxShadow: 'none',
        color: 'hsl(var(--foreground))',
        '& .MuiTablePagination-root button': {
          border: '1px solid hsl(var(--border))',
          color: 'hsl(var(--foreground))',
          '&.Mui-selected': {
            color: '#9c27b0',
            backgroundColor: 'rgba(156, 39, 176, 0.12)',
            border: '1px solid rgba(156, 39, 176, 0.5)'
          }
        },
        ...(muiProps.bottomToolbarProps?.sx || {})
      },
      ...muiProps.bottomToolbarProps
    },
muiTableHeadCellProps: {
  sx: {
    backgroundColor: 'hsl(var(--escustom))', // Ensure background is applied
    color: 'hsl(var(--foreground))',
    position: 'sticky',
    top: 0, // Keeps the header fixed at the top
    zIndex: 0, // Ensures the column headers are above row data
    '&[data-pinned="true"]': {
      backgroundColor: 'hsl(var(--escustom))',
      borderLeft: '1px solid hsl(var(--border))',
      color: 'hsl(var(--foreground))'
    },
    ...(muiProps.tableHeadCellProps?.sx || {})
  },
  ...muiProps.tableHeadCellProps
},

    ...tableProps
  });

  return <MaterialReactTable table={table} />;
}
