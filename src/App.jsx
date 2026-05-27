import React, { useState, useRef, useEffect } from 'react';
import Globe from 'react-globe.gl';
import { fetchInsights, fetchCountryCoordinates, countryMatrixList, fetchLiveGlobalEvents, verifyQuizClick } from './services/geoApi';

function App() {
  const globeRef = useRef();
  const [selectedCoords, setSelectedCoords] = useState(null);
  const [insights, setInsights] = useState(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('history'); 
  const [dimensions, setDimensions] = useState({ width: window.innerWidth, height: window.innerHeight });
  
  // Search & Suggestions States
  const [searchQuery, setSearchQuery] = useState('');
  const [searchLoading, setSearchLoading] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  // Live Crisis Data Tracking States
  const [liveEvents, setLiveEvents] = useState([]);
  const [activeCrisis, setActiveCrisis] = useState(null);

  // PHASE 10: Interactive Quiz Engine State Matrix
  const [isQuizMode, setIsQuizMode] = useState(false);
  const [targetCountry, setTargetCountry] = useState(null);
  const [quizScore, setQuizScore] = useState({ correct: 0, total: 0 });
  const [quizFeedback, setQuizFeedback] = useState('');
  const [quizVerifying, setQuizVerifying] = useState(false);

  useEffect(() => {
    const handleResize = () => setDimensions({ width: window.innerWidth, height: window.innerHeight });
    window.addEventListener('resize', handleResize);
    
    if (globeRef.current) {
      globeRef.current.controls().autoRotate = true;
      globeRef.current.controls().autoRotateSpeed = 0.5;
      globeRef.current.controls().enablePan = false; 
    }

    const initializeCrisisTracker = async () => {
      const events = await fetchLiveGlobalEvents();
      setLiveEvents(events);
    };
    initializeCrisisTracker();
    
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // PHASE 10: Quiz Generation Mechanics Loop
  const startNewQuizRound = () => {
    // Select a completely random target country from our validated global index array
    const randomIndex = Math.floor(Math.random() * countryMatrixList.length);
    const selectedTarget = countryMatrixList[randomIndex];
    
    setTargetCountry(selectedTarget);
    setQuizFeedback('Locate and click the target on the globe...');
    setInsights(null);
    setActiveCrisis(null);
    setSelectedCoords(null);
  };

  const toggleQuizMode = () => {
    if (!isQuizMode) {
      setIsQuizMode(true);
      // Halt auto-rotate to allow manual canvas scanning workspace access
      if (globeRef.current) globeRef.current.controls().autoRotate = false;
      startNewQuizRound();
    } else {
      setIsQuizMode(false);
      setTargetCountry(null);
      setQuizFeedback('');
      if (globeRef.current) globeRef.current.controls().autoRotate = true;
    }
  };

  const processLocationExecution = async (lat, lng) => {
    setLoading(true);
    setInsights(null);
    setActiveCrisis(null); 
    setActiveTab('history'); 

    if (globeRef.current) {
      globeRef.current.controls().autoRotate = false;
      globeRef.current.pointOfView({ lat, lng, altitude: 2.0 }, 2500);
    }

    const data = await fetchInsights(lat, lng);
    setInsights(data);
    setLoading(false);
  };

  // Main canvas interaction hub intercepting default behavior when Quiz Mode is active
  const handleGlobeClick = async ({ lat, lng }) => {
    if (isQuizMode) {
      if (quizVerifying || !targetCountry) return;
      
      setQuizVerifying(true);
      setQuizFeedback('Verifying target alignment vectors...');
      setSelectedCoords({ lat, lng });

      const clickedCountry = await verifyQuizClick(lat, lng);

      // Evaluate the spatial target verification matrix
      if (clickedCountry && clickedCountry.toLowerCase() === targetCountry.toLowerCase()) {
        setQuizScore(prev => ({ correct: prev.correct + 1, total: prev.total + 1 }));
        setQuizFeedback(`✓ EXCELLENT. Correctly identified ${targetCountry}!`);
        setTimeout(() => {
          setQuizVerifying(false);
          startNewQuizRound();
        }, 2000);
      } else {
        setQuizScore(prev => ({ ...prev, total: prev.total + 1 }));
        setQuizFeedback(`✕ INCORRECT. That was ${clickedCountry || "International Waters"}. Try a new country location!`);
        setTimeout(() => {
          setQuizVerifying(false);
          startNewQuizRound();
        }, 3000);
      }
    } else {
      // Return safely to standard study data hydration flow if gaming mode is idle
      setSelectedCoords({ lat, lng });
      await processLocationExecution(lat, lng);
    }
  };

  const handleCrisisPointClick = (eventPoint) => {
    if (isQuizMode) return; // Freeze crisis triggers during dynamic test rounds
    setInsights(null);
    setSelectedCoords({ lat: eventPoint.lat, lng: eventPoint.lng });
    setActiveCrisis(eventPoint);

    if (globeRef.current) {
      globeRef.current.controls().autoRotate = false;
      globeRef.current.pointOfView({ lat: eventPoint.lat, lng: eventPoint.lng, altitude: 1.8 }, 2000);
    }
  };

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

  const handleSelectSuggestion = async (country) => {
    if (isQuizMode) return;
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
    if (!searchQuery.trim() || isQuizMode) return;

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

  const getLayerColor = () => {
    switch (activeTab) {
      case 'history': return '#eab308'; 
      case 'culture': return '#10b981'; 
      case 'current': return '#06b6d4'; 
      default: return '#38bdf8';
    }
  };

  return (
    <div style={{ width: '100vw', height: '100vh', position: 'relative', overflow: 'hidden', backgroundColor: '#020617' }}>
      
      {/* Floating Header Dashboard */}
      <div style={{ position: 'absolute', top: '30px', left: '30px', zIndex: 20, color: '#fff', fontFamily: 'system-ui, sans-serif' }}>
        <h1 style={{ margin: 0, fontSize: '22px', fontWeight: '400', letterSpacing: '3px' }}>GEO-INSIGHTS</h1>
        <p style={{ margin: '6px 0 0 0', fontSize: '11px', color: '#64748b' }}>Civil Services & Geography Study Matrix</p>
        
        {/* PHASE 10: QUIZ MODE CONTROL TOGGLE TRIGGER SWITCH */}
        <button
          onClick={toggleQuizMode}
          style={{
            marginTop: '20px', padding: '10px 18px', borderRadius: '20px',
            border: '1px solid rgba(255,255,255,0.08)', cursor: 'pointer',
            backgroundColor: isQuizMode ? 'rgba(239, 68, 68, 0.15)' : 'rgba(56, 189, 248, 0.08)',
            color: isQuizMode ? '#ef4444' : '#38bdf8', fontSize: '11px', fontWeight: '700',
            letterSpacing: '1px', textTransform: 'uppercase', transition: 'all 0.2s',
            pointerEvents: 'auto'
          }}
        >
          {isQuizMode ? "Exit Quiz Module" : "Launch Retention Quiz"}
        </button>
      </div>

      {/* PHASE 10: INTERACTIVE QUIZ HEADS-UP CHALLENGE PROMPT LAYER */}
      {isQuizMode && targetCountry && (
        <div style={{
          position: 'absolute', top: '30px', left: '50%', transform: 'translateX(-50%)', zIndex: 30,
          width: '100%', maxWidth: '460px', padding: '18px 24px', boxSizing: 'border-box',
          backgroundColor: 'rgba(8, 12, 24, 0.6)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
          border: '1px solid rgba(255,255,255,0.08)', borderRadius: '20px', textAlign: 'center',
          color: '#fff', fontFamily: 'system-ui, sans-serif', boxShadow: '0 20px 40px -10px rgba(0,0,0,0.5)'
        }}>
          <span style={{ fontSize: '10px', color: '#64748b', fontWeight: '700', letterSpacing: '1.5px', textTransform: 'uppercase' }}>TARGET OBJECTIVE</span>
          <h2 style={{ margin: '6px 0 10px 0', color: '#eab308', fontSize: '26px', fontWeight: '400', letterSpacing: '1px' }}>{targetCountry}</h2>
          <p style={{ margin: 0, fontSize: '13px', color: quizFeedback.includes('✕') ? '#ef4444' : quizFeedback.includes('✓') ? '#10b981' : '#cbd5e1', fontWeight: '300' }}>{quizFeedback}</p>
          
          {/* Real-time score counter indicator */}
          <div style={{ marginTop: '14px', paddingTop: '10px', borderTop: '1px solid rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: '#64748b', fontWeight: '600' }}>
            <span>MATRIX PROFILE SCORE</span>
            <span style={{ color: '#38bdf8' }}>{quizScore.correct} / {quizScore.total} PASSED</span>
          </div>
        </div>
      )}

      {/* Search Input Layer Overlay (Hidden automatically when testing metrics are live) */}
      {!isQuizMode && (
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
                width: '100%', padding: '13px 50px 13px 22px', borderRadius: '30px',
                backgroundColor: 'rgba(255, 255, 255, 0.04)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
                border: '1px solid rgba(255, 255, 255, 0.08)', color: '#fff', fontSize: '13px',
                fontFamily: 'system-ui, sans-serif', outline: 'none', boxSizing: 'border-box',
                boxShadow: '0 20px 40px -15px rgba(0,0,0,0.5)', transition: 'border-color 0.3s'
              }}
            />
            <button type="submit" disabled={searchLoading} style={{ position: 'absolute', right: '6px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', padding: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {searchLoading ? ( <div style={{ width: '16px', height: '16px', border: '2px solid #38bdf8', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} /> ) : (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                </svg>
              )}
            </button>
          </form>

          {showSuggestions && suggestions.length > 0 && (
            <div style={{ position: 'absolute', top: '54px', left: '20px', right: '20px', backgroundColor: 'rgba(8, 12, 24, 0.75)', backdropFilter: 'blur(30px)', WebkitBackdropFilter: 'blur(30px)', border: '1px solid rgba(255, 255, 255, 0.06)', borderRadius: '16px', overflow: 'hidden', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.6)', padding: '6px 0' }}>
              {suggestions.map((country, idx) => (
                <div key={idx} onMouseDown={() => handleSelectSuggestion(country)} style={{ padding: '10px 22px', fontSize: '13px', color: '#cbd5e1', fontFamily: 'system-ui, sans-serif', cursor: 'pointer', transition: 'background-color 0.15s, color 0.15s' }} onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'rgba(56, 189, 248, 0.12)'; e.currentTarget.style.color = '#38bdf8'; }} onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = '#cbd5e1'; }}>{country}</div>
              ))}
            </div>
          )}
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      )}

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
          
          showAtmosphere={true}
          atmosphereColor="#0ea5e9"
          atmosphereAltitude={0.18}
          
          ringsData={selectedCoords ? [selectedCoords] : []}
          ringLat={(d) => d.lat}
          ringLng={(d) => d.lng}
          ringColor={() => isQuizMode ? (quizFeedback.includes('✕') ? '#ef4444' : '#10b981') : (activeCrisis ? '#ef4444' : getLayerColor())}
          ringMaxRadius={selectedCoords ? 8 : 0}
          ringPropagationSpeed={4}
          ringRepeatPeriod={400}

          // Render live crisis points if quiz testing metrics are idle
          pointsData={isQuizMode ? [] : liveEvents}
          pointLat="lat"
          pointLng="lng"
          pointColor={() => '#f97316'} 
          pointAltitude={(d) => Math.min(d.magnitude * 0.05, 0.4)} 
          pointRadius={0.25}
          eventsData={isQuizMode ? [] : liveEvents}
          onPointClick={handleCrisisPointClick}
        />
      </div>

      {/* Academic Matrix Control Dock Layer */}
      {!activeCrisis && !isQuizMode && (
        <div style={{
          position: 'absolute', bottom: '40px', left: '50%', transform: 'translateX(-50%)', zIndex: 20,
          backgroundColor: 'rgba(8, 12, 24, 0.45)', backdropFilter: 'blur(25px)', WebkitBackdropFilter: 'blur(25px)',
          border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '30px', padding: '6px 12px',
          display: 'flex', gap: '8px', boxShadow: '0 20px 40px -10px rgba(0,0,0,0.7)', boxSizing: 'border-box'
        }}>
          {[
            { id: 'history', label: 'History', color: '#eab308' },
            { id: 'culture', label: 'Culture', color: '#10b981' },
            { id: 'current', label: 'Current Affairs', color: '#06b6d4' }
          ].map((layer) => (
            <button key={layer.id} onClick={() => setActiveTab(layer.id)} style={{ padding: '10px 20px', borderRadius: '20px', border: 'none', backgroundColor: activeTab === layer.id ? 'rgba(255, 255, 255, 0.08)' : 'transparent', color: activeTab === layer.id ? layer.color : '#64748b', fontSize: '12px', fontWeight: '600', cursor: 'pointer', fontFamily: 'system-ui, sans-serif', letterSpacing: '0.5px', transition: 'all 0.2s ease', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: layer.color, boxShadow: activeTab === layer.id ? `0 0 10px ${layer.color}` : 'none' }} />
              {layer.label}
            </button>
          ))}
        </div>
      )}

      {/* Floating Dynamic Study Panel */}
      {!isQuizMode && (selectedCoords || activeCrisis) && (
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
          ) : activeCrisis ? (
            <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
              <div>
                <span style={{ textTransform: 'uppercase', fontSize: '10px', color: '#ef4444', fontWeight: '700', letterSpacing: '2px' }}>{activeCrisis.type} Alert</span>
                <h2 style={{ margin: '4px 0 0 0', fontSize: '22px', fontWeight: '400', letterSpacing: '-0.5px', color: '#f97316' }}>Magnitude {activeCrisis.magnitude}</h2>
                <p style={{ fontSize: '13px', color: '#94a3b8', margin: '4px 0 0 0' }}>{activeCrisis.place}</p>
              </div>
              <div style={{ flex: 1, marginTop: '30px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div style={{ padding: '16px', backgroundColor: 'rgba(239, 68, 68, 0.05)', borderRadius: '12px', border: '1px solid rgba(239, 68, 68, 0.1)' }}>
                  <h4 style={{ margin: '0 0 6px 0', fontSize: '11px', color: '#ef4444', letterSpacing: '1px', textTransform: 'uppercase' }}>Socio-Environmental Impact</h4>
                  <p style={{ margin: 0, fontSize: '13.5px', lineHeight: '1.6', color: '#cbd5e1', fontWeight: '300' }}>Seismic activation detected on coordinates [{activeCrisis.lat.toFixed(2)}, {activeCrisis.lng.toFixed(2)}]. For civil services examinations, analyze the regional infrastructure resilience, disaster management act parameters, and structural tectonic plates involved.</p>
                </div>
                <div>
                  <h4 style={{ margin: '0 0 4px 0', fontSize: '11px', color: '#64748b', letterSpacing: '1px', textTransform: 'uppercase' }}>Timestamp Telemetry</h4>
                  <p style={{ margin: 0, fontSize: '13px', color: '#cbd5e1' }}>{activeCrisis.time}</p>
                </div>
              </div>
              <button onClick={() => setActiveCrisis(null)} style={{ width: '100%', padding: '12px', borderRadius: '14px', border: '1px solid rgba(255,255,255,0.08)', backgroundColor: 'rgba(255,255,255,0.02)', color: '#fff', fontSize: '13px', cursor: 'pointer', transition: 'background-color 0.2s', marginTop: 'auto' }} onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.06)'} onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.02)'}>Return to Core Map Matrix</button>
            </div>
          ) : insights?.isOcean ? (
            <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', flex: 1, textAlign: 'center' }}>
              <h3 style={{ color: '#38bdf8', margin: '0 0 10px 0' }}>International Waters</h3>
              <p style={{ color: '#94a3b8', fontSize: '14px', margin: 0 }}>You targeted maritime or non-sovereign global territories. Focus your crosshairs back onto landmasses for core exam syllabi.</p>
            </div>
          ) : (
            <>
              <div>
                <span style={{ textTransform: 'uppercase', fontSize: '10px', color: getLayerColor(), fontWeight: '700', letterSpacing: '2px', transition: 'color 0.3s' }}>{insights?.state}</span>
                <h2 style={{ margin: '4px 0 0 0', fontSize: '26px', fontWeight: '400', letterSpacing: '-0.5px' }}>{insights?.country}</h2>
              </div>
              <div style={{ display: 'flex', gap: '8px', marginTop: '25px', borderBottom: '1px solid rgba(255, 255, 255, 0.06)', paddingBottom: '12px' }}>
                {['history', 'culture', 'current'].map((tab) => (
                  <button key={tab} onClick={() => setActiveTab(tab)} style={{ background: 'none', border: 'none', color: activeTab === tab ? getLayerColor() : '#64748b', fontSize: '13px', fontWeight: '500', cursor: 'pointer', padding: '4px 8px', transition: 'color 0.3s ease', textTransform: 'capitalize', letterSpacing: '0.5px', position: 'relative' }}>
                    {tab === 'current' ? 'Current Affairs' : tab}
                    {activeTab === tab && ( <div style={{ position: 'absolute', bottom: '-13px', left: 0, right: 0, height: '2px', backgroundColor: getLayerColor(), transition: 'background-color 0.3s' }} /> )}
                  </button>
                ))}
              </div>
              <div style={{ flex: 1, overflowY: 'auto', marginTop: '24px', paddingRight: '4px' }}>
                {activeTab === 'history' && ( <div><h4 style={{ margin: '0 0 10px 0', fontSize: '11px', color: '#eab308', letterSpacing: '1px', textTransform: 'uppercase' }}>Historical Synopsis</h4><p style={{ margin: 0, fontSize: '14px', lineHeight: '1.7', color: '#cbd5e1', fontWeight: '300' }}>{insights?.history}</p></div> )}
                {activeTab === 'culture' && ( <div><h4 style={{ margin: '0 0 10px 0', fontSize: '11px', color: '#10b981', letterSpacing: '1px', textTransform: 'uppercase' }}>Socio-Cultural Framework</h4><p style={{ margin: 0, fontSize: '14px', lineHeight: '1.7', color: '#cbd5e1', fontWeight: '300' }}>{insights?.culture}</p></div> )}
                {activeTab === 'current' && ( <div><h4 style={{ margin: '0 0 15px 0', fontSize: '11px', color: '#06b6d4', letterSpacing: '1px', textTransform: 'uppercase' }}>Live Regional Briefings</h4>{insights?.currentAffairs ? ( <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>{insights.currentAffairs.map((art, idx) => ( <a key={idx} href={art.link} target="_blank" rel="noopener noreferrer" style={{ padding: '12px', backgroundColor: 'rgba(255,255,255,0.02)', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.04)', display: 'block', textDecoration: 'none', transition: 'transform 0.2s, background-color 0.2s', cursor: 'pointer' }} onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.05)'; e.currentTarget.style.transform = 'translateY(-2px)'; }} onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.02)'; e.currentTarget.style.transform = 'translateY(0)'; }}><h5 style={{ margin: '0 0 6px 0', fontSize: '13px', fontWeight: '500', color: '#f1f5f9', lineHeight: '1.4' }}>{art.title}</h5><span style={{ fontSize: '10px', color: '#64748b' }}>Publisher: {art.source}</span></a> ))}</div> ) : ( <p style={{ margin: 0, fontSize: '13px', color: '#64748b' }}>No live regional briefings discovered for this country timeline.</p> )}</div> )}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}

export default App;