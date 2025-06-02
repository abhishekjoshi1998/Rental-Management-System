import React from 'react';
const AlertMessage = ({ type, message }) => {
  const baseClass = 'alert-message';
  let typeClass = '';

  switch (type) {
    case 'error':
      typeClass = 'error-message';
      break;
    case 'success':
      typeClass = 'success-message';
      break;
    case 'info':
      typeClass = 'info-message';
      break;
    case 'warning':
      typeClass = 'warning-message';
      break;
    default:
      typeClass = 'info-message';
  }

  if (!message) {
    return null;
  }

  return (
    <div className={`${baseClass} ${typeClass}`}>
      {message}
    </div>
  );
};

export default AlertMessage;