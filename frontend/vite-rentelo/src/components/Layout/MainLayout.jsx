// src/components/Layout/MainLayout.js
import React from 'react';
import Navbar from '../Common/Navbar';
import Footer from '../Common/Footer'; // Assuming you have Footer.js

const MainLayout = ({ children }) => {
  return (
    <>
      <Navbar />
      <main className="container" style={{ paddingTop: '20px', paddingBottom: '20px', minHeight: 'calc(100vh - 120px)' /* Adjust based on Navbar/Footer height */}}>
        {children}
      </main>
      <Footer />
    </>
  );
};

export default MainLayout;