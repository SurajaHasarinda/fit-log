import React from 'react';

interface EmptyStateProps {
    icon: React.ReactNode;
    title: string;
    description: string;
    action?: React.ReactNode;
}

const EmptyState: React.FC<EmptyStateProps> = ({ icon, title, description, action }) => {
    return (
        <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
            <div className="text-slate-600 mb-4">
                {icon}
            </div>
            <h3 className="text-lg font-semibold text-slate-300 mb-2">{title}</h3>
            <p className="text-sm text-slate-500 max-w-md mb-6">{description}</p>
            {action}
        </div>
    );
};

export default EmptyState;
