import * as React from "react"
import { cn } from "@/lib/utils"

interface PaginationProps {
  currentPage: number
  totalPages: number
  onPageChange: (page: number) => void
  className?: string
}

const Pagination = React.forwardRef<HTMLDivElement, PaginationProps>(
  ({ currentPage, totalPages, onPageChange, className }, ref) => {
    const pages: (number | string)[] = []
    const showEllipsis = totalPages > 7

    // Generate page numbers
    if (showEllipsis) {
      if (currentPage <= 4) {
        for (let i = 1; i <= 5; i++) pages.push(i)
        pages.push('...')
        pages.push(totalPages)
      } else if (currentPage >= totalPages - 3) {
        pages.push(1)
        pages.push('...')
        for (let i = totalPages - 4; i <= totalPages; i++) pages.push(i)
      } else {
        pages.push(1)
        pages.push('...')
        for (let i = currentPage - 1; i <= currentPage + 1; i++) pages.push(i)
        pages.push('...')
        pages.push(totalPages)
      }
    } else {
      for (let i = 1; i <= totalPages; i++) pages.push(i)
    }

    return (
      <div
        className={cn(
          "flex items-center justify-center space-x-2",
          className
        )}
        ref={ref}
      >
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Previous
        </button>
        
        {pages.map((page, index) => (
          <React.Fragment key={index}>
            {page === '...' ? (
              <span className="px-3 py-2 text-sm font-medium text-gray-500">...</span>
            ) : (
              <button
                onClick={() => onPageChange(page as number)}
                className={cn(
                  "px-3 py-2 text-sm font-medium border rounded-md",
                  currentPage === page
                    ? "text-white bg-blue-600 border-blue-600"
                    : "text-gray-500 bg-white border-gray-300 hover:bg-gray-50"
                )}
              >
                {page}
              </button>
            )}
          </React.Fragment>
        ))}
        
        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Next
        </button>
      </div>
    )
  }
)
Pagination.displayName = "Pagination"

export { Pagination }