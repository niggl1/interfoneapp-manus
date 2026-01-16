export function Table({ children, className = '' }) {
  return (
    <div className={`overflow-x-auto ${className}`}>
      <table className="w-full">
        {children}
      </table>
    </div>
  );
}

export function TableHeader({ children }) {
  return (
    <thead className="bg-slate-50 border-b border-slate-200">
      {children}
    </thead>
  );
}

export function TableBody({ children }) {
  return <tbody className="divide-y divide-slate-200">{children}</tbody>;
}

export function TableRow({ children, className = '' }) {
  return <tr className={className}>{children}</tr>;
}

export function TableHead({ children, className = '' }) {
  return (
    <th className={`px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider ${className}`}>
      {children}
    </th>
  );
}

export function TableCell({ children, className = '' }) {
  return (
    <td className={`px-6 py-4 text-sm text-slate-700 ${className}`}>
      {children}
    </td>
  );
}

export function TableEmpty({ message = 'Nenhum registro encontrado', colSpan = 1 }) {
  return (
    <tr>
      <td colSpan={colSpan} className="px-6 py-12 text-center text-slate-500">
        {message}
      </td>
    </tr>
  );
}
