
import React from 'react';
import Navbar from '../Common/Navbar';
import Footer from '../Common/Footer'; 

const MainLayout = ({ children }) => {
  return (
    <>
      <Navbar />
      <main className="container" style={{ paddingTop: '20px', paddingBottom: '20px', minHeight: 'calc(100vh - 120px)' }}>
        {children}
      </main>
      <Footer />
    </>
  );
};

export default MainLayout;