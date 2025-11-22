import React from 'react';
import { FaCheckCircle, FaTimesCircle, FaInfoCircle, FaExclamationTriangle } from 'react-icons/fa'; // Import FaExclamationTriangle

const NotificationIcon = ({ type }) => {
  switch (type) {
    case 'success':
      return <FaCheckCircle className="text-white" />;
    case 'error':
      return <FaTimesCircle className="text-white" />;
    case 'info':
      return <FaInfoCircle className="text-white" />;
    case 'warning': // Nouveau cas pour les avertissements
      return <FaExclamationTriangle className="text-white" />;
    default:
      return null;
  }
};

export default NotificationIcon;
