// @ts-nocheck
import React, { useState, useRef, useEffect } from 'react';
import {
  Popover,
  PopoverContent,
  PopoverTrigger
} from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { Filter, X, GripHorizontal, Maximize2, Minimize2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Calendar } from '@/components/ui/calendar';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';
import { MRT_TableInstance, MRT_Column } from 'material-react-table';
import { DateRange } from 'react-day-picker';
import * as Portal from '@radix-ui/react-portal';

// Date Range Filter Component
const DateRangeFilter: React.FC<{
  column: MRT_Column<any>;
  initialValue: DateRange | undefined;
}> = ({ column, initialValue }) => {
  const [date, setDate] = useState<DateRange | undefined>(initialValue);

  return (
    <div className="space-y-2">
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className={cn(
              'h-9 w-full justify-start border-dashed text-left font-normal hover:bg-muted/50',
              !date && 'text-muted-foreground'
            )}
          >
            {date?.from ? (
              date.to ? (
                <>
                  {format(date.from, 'MMM dd, yyyy')} -{' '}
                  {format(date.to, 'MMM dd, yyyy')}
                </>
              ) : (
                format(date.from, 'MMM dd, yyyy')
              )
            ) : (
              <span>Select date range...</span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent
          className="w-auto p-0"
          align="start"
          sideOffset={5}
          style={{ zIndex: 50 }}
        >
          <Calendar
            initialFocus
            mode="range"
            selected={date}
            onSelect={(newDate) => {
              setDate(newDate);
              column.setFilterValue(newDate);
            }}
            numberOfMonths={2}
            className="rounded-md border shadow-md"
          />
        </PopoverContent>
      </Popover>
      {date && (
        <Button
          variant="ghost"
          size="sm"
          className="h-8 px-2 text-muted-foreground hover:text-foreground"
          onClick={() => {
            setDate(undefined);
            column.setFilterValue(undefined);
          }}
        >
          <X className="mr-2 h-4 w-4" />
          Clear dates
        </Button>
      )}
    </div>
  );
};

// Purchase Type Filter Component
const PurchaseTypeFilter: React.FC<{
  column: MRT_Column<any>;
  filterValue: string | undefined;
}> = ({ column, filterValue }) => (
  <Select
    value={filterValue?.toString() ?? ''}
    onValueChange={(value) => column.setFilterValue(value)}
  >
    <SelectTrigger className="h-9 w-full border-dashed">
      <SelectValue placeholder="Select purchase type..." />
    </SelectTrigger>
    <SelectContent>
      <SelectItem value="">All types</SelectItem>
      <SelectItem value="Free Text">Free Text</SelectItem>
      <SelectItem value="Stock">Stock</SelectItem>
    </SelectContent>
  </Select>
);

// Text Filter Component
const TextFilter: React.FC<{
  column: MRT_Column<any>;
  filterValue: string | undefined;
}> = ({ column, filterValue }) => (
  <div className="space-y-2">
    <Input
      placeholder={`Search ${column.columnDef.header
        ?.toString()
        .toLowerCase()}...`}
      value={(filterValue ?? '').toString()}
      onChange={(e) => column.setFilterValue(e.target.value)}
      className="h-9 border-dashed"
    />
    {filterValue && (
      <Button
        variant="ghost"
        size="sm"
        className="h-8 px-2 text-muted-foreground hover:text-foreground"
        onClick={() => column.setFilterValue(undefined)}
      >
        <X className="mr-2 h-4 w-4" />
        Clear search
      </Button>
    )}
  </div>
);

// Types for draggable functionality
interface Position {
  x: number;
  y: number;
}

interface Size {
  width: number;
  height: number;
}

// Determine which filter component to render based on column definition
const renderFilterComponent = (column: MRT_Column<any>) => {
  const filterValue = column.getFilterValue();
  const columnDef = column.columnDef;

  // Check if column has a custom Filter component
  if (columnDef.Filter) {
    return columnDef.Filter({ column });
  }

  // Check column ID or accessorKey for specific filter types
  const columnKey = column.id || columnDef.accessorKey;

  if (typeof columnKey === 'string') {
    if (columnKey.toLowerCase().includes('date')) {
      return (
        <DateRangeFilter
          column={column}
          initialValue={filterValue as DateRange | undefined}
        />
      );
    }

    if (columnKey.toLowerCase().includes('type')) {
      return (
        <PurchaseTypeFilter
          column={column}
          filterValue={filterValue as string | undefined}
        />
      );
    }

    if (columnKey.toLowerCase().includes('status')) {
      return (
        <Select
          value={filterValue?.toString() ?? ''}
          onValueChange={(value) => column.setFilterValue(value)}
        >
          <SelectTrigger className="h-9 w-full border-dashed">
            <SelectValue
              placeholder={`Filter ${column.columnDef.header
                ?.toString()
                .toLowerCase()}...`}
            />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">All</SelectItem>
            <SelectItem value="Received">Received</SelectItem>
            <SelectItem value="Pending">Pending</SelectItem>
            <SelectItem value="Rejected">Rejected</SelectItem>
          </SelectContent>
        </Select>
      );
    }
  }

  // Default to TextFilter
  return (
    <TextFilter
      column={column}
      filterValue={filterValue as string | undefined}
    />
  );
};

// Draggable Content Component
// Draggable Content Component with updated positioning
const DraggableContent: React.FC<{
  onClose: () => void;
  defaultSize?: Size;
  children: React.ReactNode;
}> = ({ children, onClose, defaultSize = { width: 450, height: 500 } }) => {
  const [position, setPosition] = useState<Position>({ x: 100, y: 100 });
  const [size, setSize] = useState<Size>(defaultSize);
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [dragStart, setDragStart] = useState<Position>({ x: 0, y: 0 });
  const dragRef = useRef<HTMLDivElement>(null);
  const resizeRef = useRef<HTMLDivElement>(null);

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setDragStart({
      x: e.clientX - position.x,
      y: e.clientY - position.y
    });
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDragging) {
        setPosition({
          x: e.clientX - dragStart.x,
          y: e.clientY - dragStart.y
        });
      }

      if (isResizing) {
        setSize((prev) => ({
          width: Math.max(300, prev.width + e.movementX),
          height: Math.max(200, prev.height + e.movementY)
        }));
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      setIsResizing(false);
    };

    if (isDragging || isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, isResizing, dragStart]);

  return (
    <Portal.Root>
      <div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          pointerEvents: 'none',
          zIndex: 40
        }}
      >
        <div
          className="fixed overflow-hidden rounded-lg border bg-background shadow-lg"
          style={{
            left: position.x,
            top: position.y,
            width: size.width,
            height: size.height,
            pointerEvents: 'auto'
          }}
        >
          <div
            ref={dragRef}
            className="flex h-10 cursor-move items-center justify-between border-b bg-muted/40 px-4"
            onMouseDown={handleMouseDown}
          >
            <div className="flex items-center gap-2">
              <GripHorizontal className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium">Filters</span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="h-8 w-8 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          <div className="h-[calc(100%-2.5rem)]">{children}</div>

          <div
            ref={resizeRef}
            className="absolute bottom-0 right-0 h-4 w-4 cursor-se-resize"
            onMouseDown={() => setIsResizing(true)}
          >
            <div className="absolute bottom-1 right-1 h-2 w-2 border-b-2 border-r-2 border-foreground/40" />
          </div>
        </div>
      </div>
    </Portal.Root>
  );
};

// Normal Filter Content
const NormalFilterContent: React.FC<{
  table: MRT_TableInstance<any>;
  onDragModeChange: () => void;
}> = ({ table, onDragModeChange }) => {
  const filterableColumns = table
    .getAllColumns()
    .filter(
      (column) =>
        column.getCanFilter() && !column.columnDef.id?.includes('compare')
    );

  const activeFiltersCount = filterableColumns.reduce((acc, column) => {
    return acc + (column.getFilterValue() ? 1 : 0);
  }, 0);

  return (
    <div className="flex flex-col">
      <div className="flex items-center justify-between border-b p-4">
        <div className="space-y-1">
          <h4 className="font-medium leading-none">Filters</h4>
          <p className="text-sm text-muted-foreground">
            Filter your data by specific criteria
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={onDragModeChange}
            className="h-8 w-8 p-0"
            title="Switch to draggable mode"
          >
            <Maximize2 className="h-4 w-4" />
          </Button>
          {activeFiltersCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => table.resetColumnFilters()}
              className="h-8 px-2 text-muted-foreground hover:text-foreground lg:px-3"
            >
              <X className="mr-2 h-4 w-4" />
              Reset all
            </Button>
          )}
        </div>
      </div>

      <ScrollArea className="h-[400px]">
        <div className="space-y-6 p-4">
          {filterableColumns.map((column) => (
            <div key={column.id} className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium" htmlFor={column.id}>
                  {typeof column.columnDef.header === 'string'
                    ? column.columnDef.header
                    : column.id}
                </label>
                {Boolean(column.getFilterValue()) && (
                  <Badge variant="secondary" className="font-normal">
                    Filtered
                  </Badge>
                )}
              </div>
              {renderFilterComponent(column)}
            </div>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
};

// Draggable Filter Content
const DraggableFilterContent: React.FC<{
  table: MRT_TableInstance<any>;
}> = ({ table }) => {
  const filterableColumns = table
    .getAllColumns()
    .filter(
      (column) =>
        column.getCanFilter() && !column.columnDef.id?.includes('compare')
    );

  const activeFiltersCount = filterableColumns.reduce((acc, column) => {
    return acc + (column.getFilterValue() ? 1 : 0);
  }, 0);

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b p-4">
        <div className="space-y-1">
          <h4 className="font-medium leading-none">Filters</h4>
          <p className="text-sm text-muted-foreground">
            Filter your data by specific criteria
          </p>
        </div>
        {activeFiltersCount > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => table.resetColumnFilters()}
            className="h-8 px-2 text-muted-foreground hover:text-foreground lg:px-3"
          >
            <X className="mr-2 h-4 w-4" />
            Reset all
          </Button>
        )}
      </div>

      <div className="flex-1 overflow-hidden">
        <ScrollArea className="h-full">
          <div className="space-y-6 p-4">
            {filterableColumns.map((column) => (
              <div key={column.id} className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium" htmlFor={column.id}>
                    {typeof column.columnDef.header === 'string'
                      ? column.columnDef.header
                      : column.id}
                  </label>
                  {Boolean(column.getFilterValue()) && (
                    <Badge variant="secondary" className="font-normal">
                      Filtered
                    </Badge>
                  )}
                </div>
                {renderFilterComponent(column)}
              </div>
            ))}
          </div>
        </ScrollArea>
      </div>
    </div>
  );
};

interface FilterPopoverProps {
  table: MRT_TableInstance<any>;
}

const FilterPopover: React.FC<FilterPopoverProps> = ({ table }) => {
  const [open, setOpen] = useState(false);
  const [isDraggableMode, setIsDraggableMode] = useState(false);

  const filterableColumns = table
    .getAllColumns()
    .filter(
      (column) =>
        column.getCanFilter() && !column.columnDef.id?.includes('compare')
    );

  const activeFiltersCount = filterableColumns.reduce((acc, column) => {
    return acc + (column.getFilterValue() ? 1 : 0);
  }, 0);

  const triggerButton = (
    <Button
      variant="outline"
      size="sm"
      className={cn(
        'h-9 bg-white hover:bg-muted/50 dark:bg-background',
        activeFiltersCount > 0 &&
          'border-primary/50 bg-primary/10 hover:bg-primary/20'
      )}
      data-trigger="filter-button"
    >
      <Filter className="mr-2 h-4 w-4" />
      Filters
      {activeFiltersCount > 0 && (
        <Badge
          variant="secondary"
          className="ml-2 rounded-sm px-1.5 font-normal"
        >
          {activeFiltersCount}
        </Badge>
      )}
    </Button>
  );

  if (isDraggableMode) {
    return (
      <>
        {triggerButton}
        <DraggableContent onClose={() => setIsDraggableMode(false)}>
          <DraggableFilterContent table={table} />
        </DraggableContent>
      </>
    );
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>{triggerButton}</PopoverTrigger>
      <PopoverContent className="w-[450px] p-0" align="start" side="right">
        <NormalFilterContent
          table={table}
          onDragModeChange={() => {
            setIsDraggableMode(true);
            setOpen(false);
          }}
        />
      </PopoverContent>
    </Popover>
  );
};

export default FilterPopover;
