import React, { useState, useRef, useEffect } from 'react';
import Globe from 'react-globe.gl';
import { fetchInsights, fetchCountryCoordinates, countryMatrixList } from './services/geoApi';

function App() {
  const globeRef = useRef();
  const [selectedCoords, setSelectedCoords] = useState(null);
  const [insights, setInsights] = useState(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('history'); // Active state tracker for tabs
  const [dimensions, setDimensions] = useState({ width: window.innerWidth, height: window.innerHeight });
  
  // Search States
  const [searchQuery, setSearchQuery] = useState('');
  const [searchLoading, setSearchLoading] = useState(false);
  
  // Suggestions Matrix State Layout
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  useEffect(() => {
    const handleResize = () => setDimensions({ width: window.innerWidth, height: window.innerHeight });
    window.addEventListener('resize', handleResize);
    
    if (globeRef.current) {
      // Clean, standardized rotational controls configuration
      globeRef.current.controls().autoRotate = true;
      globeRef.current.controls().autoRotateSpeed = 0.5;
      globeRef.current.controls().enablePan = false; 
    }
    
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Shared processing hub for handling data hydration and camera focus shifts
  const processLocationExecution = async (lat, lng) => {
    setLoading(true);
    setInsights(null);
    setActiveTab('history'); // Reset back to default tab

    // Smoothly pan camera to coordinates over 2500ms at an altitude multiplier of 2.0
    if (globeRef.current) {
      globeRef.current.controls().autoRotate = false;
      globeRef.current.pointOfView({ lat, lng, altitude: 2.0 }, 2500);
    }

    const data = await fetchInsights(lat, lng);
    setInsights(data);
    setLoading(false);
  };

  const handleGlobeClick = async ({ lat, lng }) => {
    setSelectedCoords({ lat, lng });
    await processLocationExecution(lat, lng);
  };

  // Real-time autofill matching query hook
  const handleInputChange = (e) => {
    const value = e.target.value;
    setSearchQuery(value);

    if (value.trim().length > 1) {
      const filtered = countryMatrixList
        .filter(country => country.toLowerCase().startsWith(value.toLowerCase()))
        .slice(0, 5); 
      setSuggestions(filtered);
      setShowSuggestions(true);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  };

  // Dropdown selection execution matrix
  const handleSelectSuggestion = async (country) => {
    setSearchQuery(country);
    setSuggestions([]);
    setShowSuggestions(false);
    setSearchLoading(true);

    try {
      const coords = await fetchCountryCoordinates(country);
      setSelectedCoords(coords);
      await processLocationExecution(coords.lat, coords.lng);
      setSearchQuery(''); 
    } catch (err) {
      alert("Matrix location mismatch on selection route.");
    } finally {
      setSearchLoading(false);
    }
  };

  const handleSearchSubmit = async (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setSearchLoading(true);
    try {
      const coords = await fetchCountryCoordinates(searchQuery);
      setSelectedCoords(coords); 
      await processLocationExecution(coords.lat, coords.lng);
      setSearchQuery(''); 
      setSuggestions([]);
      setShowSuggestions(false);
    } catch (err) {
      alert("Country location not found in matrix parameters. Keep to sovereign names!");
    } finally {
      setSearchLoading(false);
    }
  };

  return (
    <div style={{ width: '100vw', height: '100vh', position: 'relative', overflow: 'hidden', backgroundColor: '#020617' }}>
      
      {/* Floating Header */}
      <div style={{ position: 'absolute', top: '30px', left: '30px', zIndex: 20, color: '#fff', fontFamily: 'system-ui, sans-serif', pointerEvents: 'none' }}>
        <h1 style={{ margin: 0, fontSize: '22px', fontWeight: '400', letterSpacing: '3px' }}>GEO-INSIGHTS</h1>
        <p style={{ margin: '6px 0 0 0', fontSize: '11px', color: '#64748b' }}>Civil Services & Geography Study Matrix</p>
      </div>

      {/* Search Matrix Input Layer Overlay with Autofill Dropdown */}
      <div style={{ position: 'absolute', top: '30px', left: '50%', transform: 'translateX(-50%)', zIndex: 30, width: '100%', maxWidth: '420px', padding: '0 20px', boxSizing: 'border-box' }}>
        <form onSubmit={handleSearchSubmit} style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
          <input
            type="text"
            value={searchQuery}
            onChange={handleInputChange}
            onFocus={() => searchQuery.trim().length > 1 && setShowSuggestions(true)}
            onBlur={() => setTimeout(() => setShowSuggestions(false), 200)} 
            placeholder="Type country (e.g. Chile, Japan, Egypt)..."
            disabled={searchLoading}
            style={{
              width: '100%',
              padding: '13px 50px 13px 22px',
              borderRadius: '30px',
              backgroundColor: 'rgba(255, 255, 255, 0.04)',
              backdropFilter: 'blur(20px)',
              WebkitBackdropFilter: 'blur(20px)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              color: '#fff',
              fontSize: '13px',
              fontFamily: 'system-ui, sans-serif',
              outline: 'none',
              boxSizing: 'border-box',
              boxShadow: '0 20px 40px -15px rgba(0,0,0,0.5)',
              transition: 'border-color 0.3s'
            }}
          />
          <button
            type="submit"
            disabled={searchLoading}
            style={{
              position: 'absolute', right: '6px', top: '50%', transform: 'translateY(-50%)',
              background: 'none', border: 'none', cursor: 'pointer', padding: '10px',
              display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}
          >
            {searchLoading ? (
              <div style={{ width: '16px', height: '16px', border: '2px solid #38bdf8', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
            ) : (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line>
              </svg>
            )}
          </button>
        </form>

        {/* Glassmorphic Dropdown Panel overlay matrix */}
        {showSuggestions && suggestions.length > 0 && (
          <div style={{
            position: 'absolute', top: '54px', left: '20px', right: '20px',
            backgroundColor: 'rgba(8, 12, 24, 0.75)', backdropFilter: 'blur(30px)', WebkitBackdropFilter: 'blur(30px)',
            border: '1px solid rgba(255, 255, 255, 0.06)', borderRadius: '16px',
            overflow: 'hidden', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.6)', padding: '6px 0'
          }}>
            {suggestions.map((country, idx) => (
              <div
                key={idx}
                onMouseDown={() => handleSelectSuggestion(country)}
                style={{
                  padding: '10px 22px', fontSize: '13px', color: '#cbd5e1',
                  fontFamily: 'system-ui, sans-serif', cursor: 'pointer',
                  transition: 'background-color 0.15s, color 0.15s'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = 'rgba(56, 189, 248, 0.12)';
                  e.currentTarget.style.color = '#38bdf8';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent';
                  e.currentTarget.style.color = '#cbd5e1';
                }}
              >
                {country}
              </div>
            ))}
          </div>
        )}

        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>

      {/* Main Globe Container */}
      <div style={{ width: '100%', height: '100%', position: 'absolute', top: 0, left: 0, zIndex: 1 }}>
        <Globe
          ref={globeRef}
          width={dimensions.width}
          height={dimensions.height}
          
          // Pure, native high-performance assets mapping
          globeImageUrl="//unpkg.com/three-globe/example/img/earth-night.jpg"
          bumpImageUrl="//unpkg.com/three-globe/example/img/earth-topology.png"
          backgroundImageUrl="//unpkg.com/three-globe/example/img/night-sky.png"
          onGlobeClick={handleGlobeClick}
          
          // PHASE 7 FIX: Utilizing direct component props for robust, crash-free atmospheric glow shading
          showAtmosphere={true}
          atmosphereColor="#0ea5e9"
          atmosphereAltitude={0.18}
          
          // Render tracking rings on targeted coordinates
          ringsData={selectedCoords ? [selectedCoords] : []}
          ringLat={(d) => d.lat}
          ringLng={(d) => d.lng}
          ringColor={() => '#38bdf8'}
          ringMaxRadius={7}
          ringPropagationSpeed={3.5}
          ringRepeatPeriod={650}
        />
      </div>

      {/* Floating Dynamic Study Panel */}
      {selectedCoords && (
        <div style={{
          position: 'absolute', right: '30px', top: '30px', bottom: '30px', width: '400px',
          backgroundColor: 'rgba(8, 12, 24, 0.45)', backdropFilter: 'blur(25px)', WebkitBackdropFilter: 'blur(25px)',
          border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '24px', zIndex: 20,
          padding: '30px', color: '#f8fafc', fontFamily: 'system-ui, sans-serif',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.7)', display: 'flex', flexDirection: 'column', boxSizing: 'border-box',
        }}>
          {loading ? (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', flex: 1 }}>
              <p style={{ color: '#38bdf8', fontSize: '13px', letterSpacing: '2px', fontWeight: '500' }}>ASSEMBLING GEO-MODULES...</p>
            </div>
          ) : insights?.isOcean ? (
            <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', flex: 1, textAlign: 'center' }}>
              <h3 style={{ color: '#38bdf8', margin: '0 0 10px 0' }}>International Waters</h3>
              <p style={{ color: '#94a3b8', fontSize: '14px', margin: 0 }}>You targeted maritime or non-sovereign global territories. Focus your crosshairs back onto landmasses for core exam syllabi.</p>
            </div>
          ) : (
            <>
              <div>
                <span style={{ textTransform: 'uppercase', fontSize: '10px', color: '#38bdf8', fontWeight: '700', letterSpacing: '2px' }}>
                  {insights?.state}
                </span>
                <h2 style={{ margin: '4px 0 0 0', fontSize: '26px', fontWeight: '400', letterSpacing: '-0.5px' }}>
                  {insights?.country}
                </h2>
              </div>

              {/* Minimal Menu Tabs */}
              <div style={{ display: 'flex', gap: '8px', marginTop: '25px', borderBottom: '1px solid rgba(255, 255, 255, 0.06)', paddingBottom: '12px' }}>
                {['history', 'culture', 'current'].map((tab) => (
                  <button 
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    style={{
                      background: 'none', border: 'none', 
                      color: activeTab === tab ? '#38bdf8' : '#64748b',
                      fontSize: '13px', fontWeight: '500', cursor: 'pointer',
                      padding: '4px 8px', transition: 'color 0.2s ease',
                      textTransform: 'capitalize', letterSpacing: '0.5px',
                      position: 'relative'
                    }}
                  >
                    {tab === 'current' ? 'Current Affairs' : tab}
                    {activeTab === tab && (
                      <div style={{ position: 'absolute', bottom: '-13px', left: 0, right: 0, height: '2px', backgroundColor: '#38bdf8' }} />
                    )}
                  </button>
                ))}
              </div>
              
              {/* Contextual Data Viewer Area */}
              <div style={{ flex: 1, overflowY: 'auto', marginTop: '24px', paddingRight: '4px' }}>
                {activeTab === 'history' && (
                  <div>
                    <h4 style={{ margin: '0 0 10px 0', fontSize: '11px', color: '#38bdf8', letterSpacing: '1px', textTransform: 'uppercase' }}>Historical Synopsis</h4>
                    <p style={{ margin: 0, fontSize: '14px', lineHeight: '1.7', color: '#cbd5e1', fontWeight: '300' }}>{insights?.history}</p>
                  </div>
                )}

                {activeTab === 'culture' && (
                  <div>
                    <h4 style={{ margin: '0 0 10px 0', fontSize: '11px', color: '#38bdf8', letterSpacing: '1px', textTransform: 'uppercase' }}>Socio-Cultural Framework</h4>
                    <p style={{ margin: 0, fontSize: '14px', lineHeight: '1.7', color: '#cbd5e1', fontWeight: '300' }}>{insights?.culture}</p>
                  </div>
                )}

                {activeTab === 'current' && (
                  <div>
                    <h4 style={{ margin: '0 0 15px 0', fontSize: '11px', color: '#38bdf8', letterSpacing: '1px', textTransform: 'uppercase' }}>
                      Live Regional Briefings
                    </h4>
                    {insights?.currentAffairs ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        {insights.currentAffairs.map((art, idx) => (
                          <a 
                            key={idx} 
                            href={art.link} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            style={{ 
                              padding: '12px', 
                              backgroundColor: 'rgba(255,255,255,0.02)', 
                              borderRadius: '10px', 
                              border: '1px solid rgba(255,255,255,0.04)',
                              display: 'block',
                              textDecoration: 'none',
                              transition: 'transform 0.2s, background-color 0.2s',
                              cursor: 'pointer'
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.05)';
                              e.currentTarget.style.transform = 'translateY(-2px)';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.02)';
                              e.currentTarget.style.transform = 'translateY(0)';
                            }}
                          >
                            <h5 style={{ margin: '0 0 6px 0', fontSize: '13px', fontWeight: '500', color: '#f1f5f9', lineHeight: '1.4' }}>
                              {art.title}
                            </h5>
                            <span style={{ fontSize: '10px', color: '#64748b' }}>Publisher: {art.source}</span>
                          </a>
                        ))}
                      </div>
                    ) : (
                      <p style={{ margin: 0, fontSize: '13px', color: '#64748b' }}>
                        No live regional briefings discovered for this country timeline.
                      </p>
                    )}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}

export default App;