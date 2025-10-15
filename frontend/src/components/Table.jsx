import React from 'react';
import '../styles/Table.css';

const Table = ({ columns, data, onRowClick = null, emptyMessage = 'No data available' }) => {
    return (
        <div className="table-container">
            <table className="table">
                <thead>
                    <tr>
                        {columns.map((column, index) => (
                            <th key={index} style={{ width: column.width }}>
                                {column.header}
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {data.length === 0 ? (
                        <tr>
                            <td colSpan={columns.length} className="empty-message">
                                {emptyMessage}
                            </td>
                        </tr>
                    ) : (
                        data.map((row, rowIndex) => (
                            <tr 
                                key={rowIndex}
                                onClick={() => onRowClick && onRowClick(row)}
                                className={onRowClick ? 'clickable' : ''}
                            >
                                {columns.map((column, colIndex) => (
                                    <td key={colIndex}>
                                        {column.render 
                                            ? column.render(row[column.accessor], row)
                                            : row[column.accessor]
                                        }
                                    </td>
                                ))}
                            </tr>
                        ))
                    )}
                </tbody>
            </table>
        </div>
    );
};

export default Table;
