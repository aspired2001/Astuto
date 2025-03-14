import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { ChevronDown, ChevronUp } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from '@/components/ui/tooltip';

interface ExpandableCellProps {
  value: string;
  maxLength?: number;
  searchTerm?: string;
}

const ExpandableCell: React.FC<ExpandableCellProps> = ({
  value,
  maxLength = 50,
  searchTerm = ''
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  // If value is not a string or is shorter than maxLength, return as-is
  if (typeof value !== 'string' || value.length <= maxLength) {
    return <div className="whitespace-pre-wrap break-words">{value}</div>;
  }

  const toggleExpand = () => setIsExpanded(!isExpanded);

  // Function to highlight search terms in text
  const highlightText = (text: string, term: string) => {
    if (!term) return text;

    const regex = new RegExp(`(${term})`, 'gi');
    const parts = text.split(regex);

    return parts.map((part, index) =>
      part.toLowerCase() === term.toLowerCase() ? (
        <mark key={index} className="bg-yellow-200">
          {part}
        </mark>
      ) : (
        part
      )
    );
  };

  return (
    <div className="relative flex max-w-[300px] items-start gap-2">
      <div
        className={`whitespace-pre-wrap break-words ${
          !isExpanded ? 'line-clamp-2' : ''
        }`}
      >
        {highlightText(
          isExpanded ? value : value.slice(0, maxLength) + '...',
          searchTerm
        )}
      </div>
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleExpand}
              className="ml-1 h-6 w-6 shrink-0 p-0"
            >
              {isExpanded ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            {isExpanded ? 'Show less' : 'Show more'}
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </div>
  );
};

export default ExpandableCell;
