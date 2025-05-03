import React from 'react';
import { X, AlertCircle, CheckCircle, Info, AlertTriangle } from 'lucide-react';

type AlertType = 'success' | 'error' | 'info' | 'warning';

interface AlertProps {
  type: AlertType;
  message: string;
  onClose?: () => void;
  showIcon?: boolean;
}

const Alert: React.FC<AlertProps> = ({ 
  type, 
  message, 
  onClose, 
  showIcon = true 
}) => {
  const alertStyles = {
    success: 'bg-green-50 text-green-800 border-green-200',
    error: 'bg-red-50 text-red-800 border-red-200',
    info: 'bg-blue-50 text-blue-800 border-blue-200',
    warning: 'bg-yellow-50 text-yellow-800 border-yellow-200',
  };
  
  const iconStyles = {
    success: <CheckCircle className="w-5 h-5 text-green-500" />,
    error: <AlertCircle className="w-5 h-5 text-red-500" />,
    info: <Info className="w-5 h-5 text-blue-500" />,
    warning: <AlertTriangle className="w-5 h-5 text-yellow-500" />,
  };

  return (
    <div className={`rounded-md p-4 border ${alertStyles[type]} flex items-start`}>
      {showIcon && (
        <div className="flex-shrink-0 mr-3">
          {iconStyles[type]}
        </div>
      )}
      <div className="flex-1 text-sm">
        {message}
      </div>
      {onClose && (
        <button 
          onClick={onClose}
          className="ml-auto flex-shrink-0 text-gray-400 hover:text-gray-500 focus:outline-none"
        >
          <X className="w-5 h-5" />
        </button>
      )}
    </div>
  );
};

export default Alert;
