import React from 'react';
import { Link } from 'react-router-dom';

const ClassList = ({ classes }) => {
    return (
        <div className="bg-white p-4 rounded shadow-md">
            {classes.length === 0 ? (
                <p>No classes found. Please create one.</p>
            ) : (
                <ul>
                    {classes.map(c => (
                        <li key={c._id} className="border-b last:border-b-0 py-3">
                            <Link to={`/class/${c._id}`} className="hover:text-blue-600">
                                <h3 className="font-semibold text-lg">{c.name}</h3>
                                <p className="text-gray-600">{c.subject}</p>
                            </Link>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
};

export default ClassList;