import { FiChevronLeft, FiChevronRight } from 'react-icons/fi';

/**
 * Reusable pagination component.
 *
 * Props:
 *  - page: current page (1-indexed)
 *  - pages: total number of pages
 *  - onPageChange: (newPage) => void
 *  - total: total item count (optional, displayed as label)
 */
const Pagination = ({ page, pages, onPageChange, total }) => {
  if (pages <= 1) return null;

  // Generate visible page numbers with ellipsis
  const getPageNumbers = () => {
    const items = [];
    const maxVisible = 5;

    if (pages <= maxVisible + 2) {
      for (let i = 1; i <= pages; i++) items.push(i);
    } else {
      items.push(1);
      if (page > 3) items.push('…');

      const start = Math.max(2, page - 1);
      const end = Math.min(pages - 1, page + 1);
      for (let i = start; i <= end; i++) items.push(i);

      if (page < pages - 2) items.push('…');
      items.push(pages);
    }

    return items;
  };

  return (
    <div className="pagination-wrap row" style={{ justifyContent: 'space-between' }}>
      {total !== undefined && (
        <span className="text-muted" style={{ fontSize: '0.8125rem' }}>
          {total} total
        </span>
      )}

      <div className="row gap-1">
        <button
          type="button"
          className="btn btn-sm btn-ghost pagination-btn"
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
          aria-label="Previous page"
        >
          <FiChevronLeft size={16} />
        </button>

        {getPageNumbers().map((item, i) =>
          item === '…' ? (
            <span key={`ell-${i}`} className="pagination-ellipsis text-muted">
              …
            </span>
          ) : (
            <button
              key={item}
              type="button"
              className={`btn btn-sm pagination-btn${item === page ? ' pagination-active' : ''}`}
              onClick={() => onPageChange(item)}
            >
              {item}
            </button>
          )
        )}

        <button
          type="button"
          className="btn btn-sm btn-ghost pagination-btn"
          disabled={page >= pages}
          onClick={() => onPageChange(page + 1)}
          aria-label="Next page"
        >
          <FiChevronRight size={16} />
        </button>
      </div>
    </div>
  );
};

export default Pagination;
