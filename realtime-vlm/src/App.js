// src/App.js
import React from 'react';
import Camera from './Pages/Camera'; // or your preferred start page
import Layout from './Layout';       // your layout if you want to wrap pages

function App() {
  return (
    <Layout>
      <Camera />
    </Layout>
  );
}

export default App;
