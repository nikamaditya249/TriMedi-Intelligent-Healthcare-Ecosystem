import { Link } from "react-router-dom";

/**
 * TriMedi Accessible Breadcrumb Navigation
 * @param {Array<{ label: string, to?: string }>} items
 */
export default function Breadcrumbs({ items = [] }) {
  if (!items || items.length === 0) return null;

  return (
    <nav
      aria-label="Breadcrumb"
      className="py-3 px-4 sm:px-6 lg:px-8 xl:px-10 w-full text-xs sm:text-sm text-slate-500 font-medium"
    >
      <ol className="flex items-center space-x-2 overflow-x-auto whitespace-nowrap scrollbar-none">
        <li>
          <Link
            to="/"
            className="hover:text-teal-700 text-slate-500 transition-colors flex items-center gap-1"
          >
            <i className="bx bx-home-alt text-sm"></i>
            <span>Home</span>
          </Link>
        </li>

        {items.map((item, index) => {
          const isLast = index === items.length - 1;
          return (
            <li key={index} className="flex items-center space-x-2">
              <span className="text-slate-300">/</span>
              {isLast || !item.to ? (
                <span
                  aria-current={isLast ? "page" : undefined}
                  className="text-slate-900 font-semibold truncate max-w-[200px] sm:max-w-none"
                >
                  {item.label}
                </span>
              ) : (
                <Link
                  to={item.to}
                  className="hover:text-teal-700 text-slate-500 transition-colors"
                >
                  {item.label}
                </Link>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
