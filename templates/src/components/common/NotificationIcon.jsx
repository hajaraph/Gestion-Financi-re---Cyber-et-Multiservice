import React from 'react';
import { FaCheckCircle, FaTimesCircle, FaInfoCircle, FaExclamationTriangle } from 'react-icons/fa';

const NotificationIcon = ({ type, className = "w-5 h-5" }) => {
  switch (type) {
    case 'success':
      return <FaCheckCircle className={`${className} text-white`} />;
    case 'error':
      return <FaTimesCircle className={`${className} text-white`} />;
    case 'info':
      return <FaInfoCircle className={`${className} text-white`} />;
    case 'warning':
      return <FaExclamationTriangle className={`${className} text-white`} />;
    default:
      return null;
  }
};

export default NotificationIcon;
