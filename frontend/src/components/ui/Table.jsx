import React from "react";

export function Table({ children, className = "" }) {
  return (
    <div className="w-full overflow-x-auto rounded-xl border border-slate-200/80 bg-white shadow-subtle">
      <table className={`w-full text-left border-collapse text-sm ${className}`}>
        {children}
      </table>
    </div>
  );
}

export function TableHeader({ children, className = "" }) {
  return (
    <thead className={`bg-slate-50/80 border-b border-slate-200/80 text-[11px] font-bold uppercase tracking-wider text-slate-500 ${className}`}>
      {children}
    </thead>
  );
}

export function TableBody({ children, className = "" }) {
  return <tbody className={`divide-y divide-slate-100 ${className}`}>{children}</tbody>;
}

export function TableRow({ children, className = "", onClick, hover = true }) {
  return (
    <tr
      onClick={onClick}
      className={`transition-colors duration-100 ${
        hover ? "hover:bg-slate-50/70" : ""
      } ${onClick ? "cursor-pointer" : ""} ${className}`}
    >
      {children}
    </tr>
  );
}

export function TableHead({ children, className = "" }) {
  return (
    <th className={`px-4 py-3 text-slate-600 font-semibold whitespace-nowrap ${className}`}>
      {children}
    </th>
  );
}

export function TableCell({ children, className = "" }) {
  return (
    <td className={`px-4 py-3.5 text-slate-700 align-middle ${className}`}>
      {children}
    </td>
  );
}

export default Table;
