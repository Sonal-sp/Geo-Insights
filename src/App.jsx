import React, { useState, useRef, useEffect } from 'react';
import Globe from 'react-globe.gl';
import { 
  fetchInsights, fetchCountryCoordinates, countryMatrixList, 
  fetchLiveGlobalEvents, verifyQuizClick, checkBorderDisputes,
  fetchISSTelemetry, historicalTimelineMatrix, simulatorScenarios
} from './services/geoApi';

function App() {
  const globeRef = useRef();
  const [selectedCoords, setSelectedCoords] = useState(null);
  const [insights, setInsights] = useState(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('history'); 
  const [dimensions, setDimensions] = useState({ width: window.innerWidth, height: window.innerHeight });
  
  // Search States
  const [searchQuery, setSearchQuery] = useState('');
  const [searchLoading, setSearchLoading] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  // Live Crisis & Geopolitical States
  const [liveEvents, setLiveEvents] = useState([]);
  const [activeCrisis, setActiveCrisis] = useState(null);
  const [activeDispute, setActiveDispute] = useState(null);

  // Global App Mode: 'study' | 'crisis' | 'timeMachine' | 'policySim'
  const [appMode, setAppMode] = useState('study');

  // NEW FEATURES SPRINT 4 BINDING STATES
  const [isTopographical, setIsTopographical] = useState(false); // Biome Map Texture Switcher
  const [issPosition, setIssPosition] = useState(null);          // Live ISS Track Vector
  const [currentTimeYear, setCurrentTimeYear] = useState(1800); // Time Machine Year Indexer
  const [activeSim, setActiveSim] = useState(null);              // Active Policy Simulation Choice Model
  const [simOutcome, setSimOutcome] = useState('');

  useEffect(() => {
    const handleResize = () => setDimensions({ width: window.innerWidth, height: window.innerHeight });
    window.addEventListener('resize', handleResize);
    
    if (globeRef.current) {
      globeRef.current.controls().autoRotate = true;
      globeRef.current.controls().autoRotateSpeed = 0.5;
      globeRef.current.controls().enablePan = false; 
    }

    // Initialize Global Crisis Data
    const initializeDataHub = async () => {
      const events = await fetchLiveGlobalEvents();
      setLiveEvents(events);
    };
    initializeDataHub();
    
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Real-time ISS Orbit Tracking Frame Handler (Polls telemetry every 4.5 seconds)
  useEffect(() => {
    let telemetryTimer;
    if (appMode === 'crisis') {
      const streamOrbit = async () => {
        const coords = await fetchISSTelemetry();
        if (coords) setIssPosition(coords);
      };
      streamOrbit();
      telemetryTimer = setInterval(streamOrbit, 4500);
    } else {
      setIssPosition(null);
    }
    return () => clearInterval(telemetryTimer);
  }, [appMode]);

  // Unified Mode Navigation Handler
  const handleModeTransition = (mode) => {
    setAppMode(mode);
    setInsights(null);
    setActiveCrisis(null);
    setActiveDispute(null);
    setSelectedCoords(null);
    setActiveSim(null);
    setSimOutcome('');

    if (globeRef.current) {
      globeRef.current.controls().autoRotate = (mode !== 'policySim');
    }

    if (mode === 'policySim') {
      // Load first scenario automatically to guide student choice matrixing
      setActiveSim(simulatorScenarios[0]);
      setSelectedCoords({ lat: simulatorScenarios[0].lat, lng: simulatorScenarios[0].lng });
      if (globeRef.current) {
        globeRef.current.pointOfView({ lat: simulatorScenarios[0].lat, lng: simulatorScenarios[0].lng, altitude: 1.8 }, 1500);
      }
    }
  };

  const processLocationExecution = async (lat, lng) => {
    setLoading(true);
    setInsights(null);
    setActiveCrisis(null); 
    
    const disputeMatch = checkBorderDisputes(lat, lng);
    if (disputeMatch) {
      setActiveDispute(disputeMatch);
      setLoading(false);
      if (globeRef.current) globeRef.current.pointOfView({ lat, lng, altitude: 1.8 }, 2000);
      return;
    }

    setActiveDispute(null); 
    setActiveTab('history'); 

    if (globeRef.current) globeRef.current.pointOfView({ lat, lng, altitude: 2.0 }, 2500);
    const data = await fetchInsights(lat, lng);
    setInsights(data);
    setLoading(false);
  };

  const handleGlobeClick = async ({ lat, lng }) => {
    if (appMode === 'timeMachine' || appMode === 'policySim') return; // Freeze clicking features during simulations
    setSelectedCoords({ lat, lng });
    await processLocationExecution(lat, lng);
  };

  const handleCrisisPointClick = (eventPoint) => {
    if (appMode !== 'crisis') return; 
    setInsights(null);
    setActiveDispute(null);
    setSelectedCoords({ lat: eventPoint.lat, lng: eventPoint.lng });
    setActiveCrisis(eventPoint);
    if (globeRef.current) globeRef.current.pointOfView({ lat: eventPoint.lat, lng: eventPoint.lng, altitude: 1.8 }, 2000);
  };

  const handleInputChange = (e) => {
    const value = e.target.value;
    setSearchQuery(value);
    if (value.trim().length > 1) {
      const filtered = countryMatrixList.filter(country => country.toLowerCase().startsWith(value.toLowerCase())).slice(0, 5); 
      setSuggestions(filtered);
      setShowSuggestions(true);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  };

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
      alert("Matrix configuration failure.");
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
      alert("Country tracking failed.");
    } finally {
      setSearchLoading(false);
    }
  };

  const getLayerColor = () => {
    if (activeDispute) return '#c084fc'; 
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
        <p style={{ margin: '6px 0 0 0', fontSize: '11px', color: '#64748b' }}>Civil Services & Geography Study Made easy.</p>
        
        {/* FOUR-MODE MASTER SELECTION NAV BAR SWITCH */}
        <div style={{
          marginTop: '24px', display: 'flex', gap: '6px', padding: '4px',
          backgroundColor: 'rgba(255, 255, 255, 0.02)', backdropFilter: 'blur(10px)',
          border: '1px solid rgba(255, 255, 255, 0.05)', borderRadius: '16px', pointerEvents: 'auto'
        }}>
          {[
            { id: 'study', label: 'Study Matrix', color: '#38bdf8' },
            { id: 'crisis', label: 'Crisis Monitor', color: '#f97316' },
            { id: 'timeMachine', label: 'Time Machine', color: '#eab308' },
            { id: 'policySim', label: 'Policy Sandbox', color: '#a855f7' }
          ].map((mode) => (
            <button
              key={mode.id}
              onClick={() => handleModeTransition(mode.id)}
              style={{
                padding: '8px 14px', borderRadius: '12px', border: 'none',
                backgroundColor: appMode === mode.id ? 'rgba(255, 255, 255, 0.06)' : 'transparent',
                color: appMode === mode.id ? mode.color : '#64748b',
                fontSize: '11px', fontWeight: '600', cursor: 'pointer',
                letterSpacing: '0.5px', transition: 'all 0.15s ease'
              }}
            >
              {mode.label}
            </button>
          ))}
        </div>

        {/* FEATURE 1: PHYSICAL TOPOGRAPHY BIOME MAP TOGGLE BUTTON */}
        {appMode === 'study' && (
          <button
            onClick={() => setIsTopographical(!isTopographical)}
            style={{
              marginTop: '16px', padding: '8px 14px', borderRadius: '30px',
              border: '1px solid rgba(255,255,255,0.06)', cursor: 'pointer',
              backgroundColor: isTopographical ? 'rgba(16, 185, 129, 0.12)' : 'rgba(255,255,255,0.02)',
              color: isTopographical ? '#10b981' : '#cbd5e1', fontSize: '11px', fontWeight: '600',
              pointerEvents: 'auto', transition: 'all 0.2s'
            }}
          >
            {isTopographical ? "✓ Physical Topography Biomes Active" : "⚙ Swap to Physical Biome Map Texture"}
          </button>
        )}
      </div>

      {/* FEATURE 2: TIME MACHINE CHRONO GRID SELECTION BUTTONS */}
      {appMode === 'timeMachine' && (
        <div style={{
          position: 'absolute', top: '30px', left: '50%', transform: 'translateX(-50%)', zIndex: 30,
          backgroundColor: 'rgba(8, 12, 24, 0.6)', backdropFilter: 'blur(20px)', borderRadius: '20px',
          border: '1px solid rgba(255,255,255,0.08)', padding: '12px 24px', display: 'flex', gap: '12px',
          boxShadow: '0 20px 40px -10px rgba(0,0,0,0.5)', alignItems: 'center'
        }}>
          <span style={{ fontSize: '10px', color: '#64748b', fontWeight: '700', letterSpacing: '1px', marginRight: '6px' }}>CHRONO TARGET:</span>
          {[1800, 1914, 1945].map((year) => (
            <button
              key={year}
              onClick={() => setCurrentTimeYear(year)}
              style={{
                padding: '8px 16px', borderRadius: '10px', border: 'none',
                backgroundColor: currentTimeYear === year ? '#eab308' : 'rgba(255,255,255,0.02)',
                color: currentTimeYear === year ? '#000' : '#cbd5e1',
                fontSize: '12px', fontWeight: '700', cursor: 'pointer', transition: 'all 0.15s'
              }}
            >
              {year}
            </button>
          ))}
        </div>
      )}

      {/* Search Input Box (Hidden during timeline navigation and simulations) */}
      {appMode !== 'timeMachine' && appMode !== 'policySim' && (
        <div style={{ position: 'absolute', top: '30px', left: '50%', transform: 'translateX(-50%)', zIndex: 30, width: '100%', maxWidth: '420px', padding: '0 20px', boxSizing: 'border-box' }}>
          <form onSubmit={handleSearchSubmit} style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
            <input
              type="text"
              value={searchQuery}
              onChange={handleInputChange}
              onFocus={() => searchQuery.trim().length > 1 && setShowSuggestions(true)}
              onBlur={() => setTimeout(() => setShowSuggestions(false), 200)} 
              placeholder={appMode === 'crisis' ? "Search regions for active event logs..." : "Type country (e.g. Chile, Japan, Egypt)..."}
              disabled={searchLoading}
              style={{
                width: '100%', padding: '13px 50px 13px 22px', borderRadius: '30px',
                backgroundColor: 'rgba(255, 255, 255, 0.04)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
                border: '1px solid rgba(255, 255, 255, 0.08)', color: '#fff', fontSize: '13px',
                fontFamily: 'system-ui, sans-serif', outline: 'none', boxSizing: 'border-box',
                boxShadow: '0 20px 40px -15px rgba(0,0,0,0.5)', transition: 'border-color 0.3s'
              }}
            />
          </form>
        </div>
      )}

      {/* Main Globe Container */}
      <div style={{ width: '100%', height: '100%', position: 'absolute', top: 0, left: 0, zIndex: 1 }}>
        <Globe
          ref={globeRef}
          width={dimensions.width}
          height={dimensions.height}
          
          // FEATURE 1: Texture swapper changes maps from night lights to natural physical biomes dynamically
          globeImageUrl={isTopographical ? "//unpkg.com/three-globe/example/img/earth-blue-marble.jpg" : "//unpkg.com/three-globe/example/img/earth-night.jpg"}
          bumpImageUrl="//unpkg.com/three-globe/example/img/earth-topology.png"
          backgroundImageUrl="//unpkg.com/three-globe/example/img/night-sky.png"
          onGlobeClick={handleGlobeClick}
          
          showAtmosphere={true}
          atmosphereColor={appMode === 'policySim' ? '#a855f7' : '#0ea5e9'}
          atmosphereAltitude={0.18}
          
          ringsData={selectedCoords ? [selectedCoords] : []}
          ringLat={(d) => d.lat}
          ringLng={(d) => d.lng}
          ringColor={() => getLayerColor()}
          ringMaxRadius={8}
          ringPropagationSpeed={4}
          ringRepeatPeriod={400}

          pointsData={appMode === 'crisis' ? liveEvents : []}
          pointLat="lat"
          pointLng="lng"
          pointColor={() => '#f97316'} 
          pointAltitude={(d) => Math.min(d.magnitude * 0.05, 0.4)} 
          pointRadius={0.25}
          eventsData={appMode === 'crisis' ? liveEvents : []}
          onPointClick={handleCrisisPointClick}

          // FEATURE 2: Renders a distinctive glowing asset node overhead to mark the live tracking track of the ISS
          customLayerData={issPosition ? [issPosition] : []}
          customThreeObject={(d) => new window.THREE.Mesh(
            new window.THREE.SphereGeometry(0.35, 16, 16),
            new window.THREE.MeshBasicMaterial({ color: '#22d3ee', wireframe: true })
          )}
          customThreeObjectAltitude={0.65} // Positions it clearly off the surface in low Earth orbit
        />
      </div>

      {/* Layer Tabs Dock Panel */}
      {!activeCrisis && appMode === 'study' && !activeDispute && (
        <div style={{
          position: 'absolute', bottom: '40px', left: '50%', transform: 'translateX(-50%)', zIndex: 20,
          backgroundColor: 'rgba(8, 12, 24, 0.45)', backdropFilter: 'blur(25px)', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '30px', padding: '6px 12px', display: 'flex', gap: '8px'
        }}>
          {['history', 'culture', 'current'].map((layer) => (
            <button key={layer.id} onClick={() => setActiveTab(layer)} style={{ padding: '10px 20px', borderRadius: '20px', border: 'none', backgroundColor: activeTab === layer ? 'rgba(255, 255, 255, 0.08)' : 'transparent', color: activeTab === layer ? '#38bdf8' : '#64748b', fontSize: '12px', fontWeight: '600', cursor: 'pointer' }}>{layer}</button>
          ))}
        </div>
      )}

      {/* Floating Dynamic Data Briefing Workspace Panel Container */}
      <div style={{
        position: 'absolute', right: '30px', top: '30px', bottom: '30px', width: '400px',
        backgroundColor: 'rgba(8, 12, 24, 0.45)', backdropFilter: 'blur(25px)', WebkitBackdropFilter: 'blur(25px)',
        border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '24px', zIndex: 20,
        padding: '30px', color: '#f8fafc', fontFamily: 'system-ui, sans-serif',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.7)', display: (selectedCoords || activeCrisis || activeDispute || appMode === 'timeMachine' || appMode === 'policySim') ? 'flex' : 'none', flexDirection: 'column', boxSizing: 'border-box',
      }}>
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', flex: 1 }}><p style={{ color: '#38bdf8', fontSize: '13px', letterSpacing: '2px' }}>ASSEMBLING MODULES...</p></div>
        ) : appMode === 'timeMachine' ? (
          /* FEATURE 3: TIME MACHINE STUDY PANEL SUMMARY OVERLAY */
          <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
            <span style={{ textTransform: 'uppercase', fontSize: '10px', color: '#eab308', fontWeight: '700', letterSpacing: '2px' }}>Chrono Stream Active</span>
            <h2 style={{ margin: '4px 0 16px 0', fontSize: '26px', fontWeight: '400', color: '#fff' }}>Year {currentTimeYear}</h2>
            <div style={{ padding: '16px', backgroundColor: 'rgba(234, 179, 8, 0.03)', borderRadius: '12px', border: '1px solid rgba(234, 179, 8, 0.12)' }}>
              <h4 style={{ margin: '0 0 6px 0', fontSize: '11px', color: '#eab308', letterSpacing: '1px' }}>GLOBAL CONTEXT OVERVIEW</h4>
              <p style={{ margin: 0, fontSize: '13.5px', lineHeight: '1.6', color: '#cbd5e1', fontWeight: '300' }}>{historicalTimelineMatrix[currentTimeYear].title}</p>
            </div>
            <p style={{ marginTop: '20px', fontSize: '14px', lineHeight: '1.7', color: '#cbd5e1', fontWeight: '300' }}>{historicalTimelineMatrix[currentTimeYear].globalBrief}</p>
          </div>
        ) : appMode === 'policySim' && activeSim ? (
          /* FEATURE 4: DIPLOMATIC CHOICE MATRIX INTERACTION BUTTONS LAYER */
          <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
            <span style={{ textTransform: 'uppercase', fontSize: '10px', color: '#a855f7', fontWeight: '700', letterSpacing: '2px' }}>IR Crisis Simulation</span>
            <h2 style={{ margin: '4px 0 2px 0', fontSize: '22px', fontWeight: '400', color: '#fff' }}>{activeSim.title}</h2>
            <span style={{ fontSize: '11px', color: '#64748b', fontWeight: '600' }}>LOCATION: {activeSim.region}</span>
            
            <p style={{ margin: '20px 0', fontSize: '13.5px', lineHeight: '1.6', color: '#cbd5e1', fontWeight: '300' }}>{activeSim.briefing}</p>
            
            {!simOutcome ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: 'auto' }}>
                {activeSim.options.map((opt, i) => (
                  <button
                    key={i}
                    onClick={() => setSimOutcome(opt.outcome)}
                    style={{
                      width: '100%', padding: '12px 16px', borderRadius: '12px', border: '1px solid rgba(168,85,247,0.2)',
                      backgroundColor: 'rgba(168,85,247,0.04)', color: '#d8b4fe', fontSize: '12.5px', textAlign: 'left',
                      cursor: 'pointer', transition: 'all 0.2s', lineHeight: '1.4'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(168,85,247,0.1)'}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'rgba(168,85,247,0.04)'}
                  >
                    {opt.text}
                  </button>
                ))}
              </div>
            ) : (
              <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div style={{ padding: '16px', backgroundColor: 'rgba(34,197,94,0.03)', borderRadius: '12px', border: '1px solid rgba(34,197,94,0.15)' }}>
                  <h4 style={{ margin: '0 0 4px 0', fontSize: '11px', color: '#22c55e', letterSpacing: '1px' }}>SIMULATION PROJECTION SUMMARY</h4>
                  <p style={{ margin: 0, fontSize: '13.5px', lineHeight: '1.6', color: '#cbd5e1', fontWeight: '300' }}>{simOutcome}</p>
                </div>
                <button
                  onClick={() => {
                    setSimOutcome('');
                    const nextIndex = (simulatorScenarios.indexOf(activeSim) + 1) % simulatorScenarios.length;
                    setActiveSim(simulatorScenarios[nextIndex]);
                    setSelectedCoords({ lat: simulatorScenarios[nextIndex].lat, lng: simulatorScenarios[nextIndex].lng });
                    if (globeRef.current) globeRef.current.pointOfView({ lat: simulatorScenarios[nextIndex].lat, lng: simulatorScenarios[nextIndex].lng, altitude: 1.8 }, 1200);
                  }}
                  style={{
                    width: '100%', padding: '12px', borderRadius: '12px', border: 'none',
                    backgroundColor: '#a855f7', color: '#fff', fontWeight: '600', fontSize: '13px', cursor: 'pointer'
                  }}
                >
                  Load Alternative Crisis Scenario
                </button>
              </div>
            )}
          </div>
        ) : activeDispute ? (
          <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
            <div>
              <span style={{ textTransform: 'uppercase', fontSize: '10px', color: '#c084fc', fontWeight: '700', letterSpacing: '2px' }}>Contested Border Matrix</span>
              <h2 style={{ margin: '4px 0 0 0', fontSize: '24px', fontWeight: '400', color: '#c084fc' }}>{activeDispute.name}</h2>
              <p style={{ fontSize: '12px', color: '#94a3b8', margin: '6px 0 0 0' }}><strong>Claimants:</strong> {activeDispute.claimants}</p>
            </div>
            <div style={{ flex: 1, overflowY: 'auto', marginTop: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div style={{ padding: '14px', backgroundColor: 'rgba(192, 132, 252, 0.04)', borderRadius: '12px', border: '1px solid rgba(192, 132, 252, 0.12)' }}>
                <h4 style={{ margin: '0 0 6px 0', fontSize: '11px', color: '#c084fc', letterSpacing: '1px' }}>Strategic Analysis</h4>
                <p style={{ margin: 0, fontSize: '13.5px', lineHeight: '1.6', color: '#cbd5e1' }}>{activeDispute.strategicAnalysis}</p>
              </div>
              <p style={{ fontSize: '13.5px', color: '#cbd5e1', lineHeight: '1.6' }}>{activeDispute.historicalTreaties}</p>
            </div>
          </div>
        ) : activeCrisis ? (
          /* FEATURE 2 EXTRA: BRIEFING DISPLAYS SATELLITE DETAILS IN THE SIDEBAR IF RUNNING */
          <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
            <span style={{ textTransform: 'uppercase', fontSize: '10px', color: '#ef4444', fontWeight: '700' }}>{activeCrisis.type} Alert</span>
            <h2 style={{ margin: '4px 0 0 0', fontSize: '22px', color: '#f97316' }}>Magnitude {activeCrisis.magnitude}</h2>
            <p style={{ fontSize: '13px', color: '#94a3b8' }}>{activeCrisis.place}</p>
            {issPosition && (
              <div style={{ marginTop: '20px', padding: '12px', borderRadius: '12px', backgroundColor: 'rgba(34,211,238,0.03)', border: '1px solid rgba(34,211,238,0.12)', fontSize: '12px', color: '#cbd5e1' }}>
                <span style={{ color: '#22d3ee', fontWeight: '700' }}>🛰️ ISS OVERHEAD PASS TELEMETRY:</span>
                <div style={{ marginTop: '4px' }}>Altitude: {issPosition.altitude} km | Velocity: {issPosition.velocity} km/h</div>
              </div>
            )}
          </div>
        ) : (
          /* Standard Sovereign Insights View */
          <>
            <div>
              <span style={{ textTransform: 'uppercase', fontSize: '10px', color: getLayerColor(), fontWeight: '700', letterSpacing: '2px' }}>{insights?.state}</span>
              <h2 style={{ margin: '4px 0 0 0', fontSize: '26px', fontWeight: '400' }}>{insights?.country}</h2>
            </div>
            <div style={{ flex: 1, overflowY: 'auto', marginTop: '24px' }}>
              <p style={{ fontSize: '14px', lineHeight: '1.7', color: '#cbd5e1' }}>{insights ? insights[activeTab] : "Select coordinates on standard study ground grids..."}</p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default App;