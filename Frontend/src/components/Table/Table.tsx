import React from 'react';

interface TableColumn<T> {
  key: keyof T | string;
  header: string | React.ReactNode;
  render?: (item: T) => React.ReactNode;
}

interface TableProps<T> {
  data: T[];
  columns: TableColumn<T>[];
  onRowClick?: (item: T) => void;
  className?: string;
}

const Table = <T extends Record<string, any>>({
  data,
  columns,
  onRowClick,
  className = '',
}: TableProps<T>) => {
  return (
    <div className={`overflow-x-auto ${className}`}>
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            {columns.map((column) => (
              <th
                key={String(column.key)}
                className="px-2 py-2 text-xs text-left font-medium text-gray-500 uppercase tracking-wider"
              >
                {column.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {data.map((item, index) => (
            <tr
              key={index}
              onClick={() => onRowClick?.(item)}
              className={`${
                onRowClick ? 'cursor-pointer hover:bg-gray-50' : ''
              } transition-colors`}
            >
              {columns.map((column) => (
                <td key={String(column.key)} className="px-2 text-left py-2 whitespace-nowrap text-sm text-gray-900">
                  {column.render ? column.render(item) : String(item[column.key] || '')}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default Table;

