import React from 'react';

const Footer = () => {
  return (
    <footer style={{ textAlign: 'center', padding: '20px', marginTop: '30px', borderTop: '1px solid #eee' }}>
      <p>© {new Date().getFullYear()} Rental Management System. All Rights Reserved.</p>
    </footer>
  );
};

export default Footer;