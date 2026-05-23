import React, { useState, useRef, useEffect } from 'react';
import Globe from 'react-globe.gl';

function App() {
  const globeRef = useRef();
  const [selectedCoords, setSelectedCoords] = useState(null);
  const [dimensions, setDimensions] = useState({ width: window.innerWidth, height: window.innerHeight });

  // Handle window resizing dynamically
  useEffect(() => {
    const handleResize = () => {
      setDimensions({ width: window.innerWidth, height: window.innerHeight });
    };
    window.addEventListener('resize', handleResize);
    
    if (globeRef.current) {
      globeRef.current.controls().autoRotate = true;
      globeRef.current.controls().autoRotateSpeed = 0.5;
      globeRef.current.controls().enablePan = false; 
    }

    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleGlobeClick = ({ lat, lng }) => {
    globeRef.current.controls().autoRotate = false;
    setSelectedCoords({ lat, lng });
  };

  return (
    <div style={{ 
      width: '100vw', 
      height: '100vh', 
      position: 'relative', 
      overflow: 'hidden',
    }}>
      
      {/* Floating Header */}
      <div style={{ 
        position: 'absolute', 
        top: '30px', 
        left: '30px', 
        zIndex: 20, 
        color: '#fff', 
        fontFamily: 'system-ui, -apple-system, sans-serif',
        pointerEvents: 'none'
      }}>
        <h1 style={{ margin: 0, fontSize: '22px', fontWeight: '400', letterSpacing: '3px' }}>
          GEO-INSIGHTS
        </h1>
        <p style={{ margin: '6px 0 0 0', fontSize: '11px', color: '#64748b' }}>
          Click the globe to query geo-insights
        </p>
      </div>

      {/* Main Globe Container */}
      <div style={{ width: '100%', height: '100%', position: 'absolute', top: 0, left: 0, zIndex: 1 }}>
        <Globe
          ref={globeRef}
          width={dimensions.width}
          height={dimensions.height}
          globeImageUrl="//unpkg.com/three-globe/example/img/earth-night.jpg"
          bumpImageUrl="//unpkg.com/three-globe/example/img/earth-topology.png"
          backgroundImageUrl="//unpkg.com/three-globe/example/img/night-sky.png"
          onGlobeClick={handleGlobeClick}
        />
      </div>

      {/* Floating Right Info Panel */}
      {selectedCoords && (
        <div style={{
          position: 'absolute',
          right: '30px',
          top: '30px',
          bottom: '30px',
          width: '380px',
          backgroundColor: 'rgba(10, 15, 30, 0.4)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          borderRadius: '20px',
          zIndex: 20,
          padding: '30px',
          color: '#f8fafc',
          fontFamily: 'system-ui, -apple-system, sans-serif',
          boxShadow: '0 20px 40px rgba(0, 0, 0, 0.5)',
          display: 'flex',
          flexDirection: 'column',
          boxSizing: 'border-box',
        }}>
          <div>
            <span style={{ textTransform: 'uppercase', fontSize: '10px', color: '#38bdf8', fontWeight: '600', letterSpacing: '1.5px' }}>
              Target Acquired
            </span>
            <h2 style={{ margin: '4px 0 0 0', fontSize: '20px', fontWeight: '500' }}>Location Insights</h2>
          </div>
          
          <div style={{ 
            marginTop: '20px', 
            padding: '12px', 
            backgroundColor: 'rgba(255,255,255,0.03)', 
            borderRadius: '10px', 
            fontSize: '13px', 
            fontFamily: 'monospace', 
            color: '#94a3b8'
          }}>
            LAT: {selectedCoords.lat.toFixed(6)}<br />
            LNG: {selectedCoords.lng.toFixed(6)}
          </div>

          <hr style={{ border: 'none', borderTop: '1px solid rgba(255, 255, 255, 0.08)', margin: '25px 0' }} />
        </div>
      )}
    </div>
  );
}

export default App;