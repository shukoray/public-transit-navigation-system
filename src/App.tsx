import './App.css'
import 'maplibre-gl/dist/maplibre-gl.css'
import { useEffect, useRef, useState } from 'react'
import * as maplibregl from 'maplibre-gl'

function App() {
  const mapContainer = useRef<HTMLDivElement>(null)
  const map = useRef<maplibregl.Map | null>(null);
  const [city, setCity] = useState("Toronto");
  const cityLocations: Record<string, [number, number]> = {
    "Toronto": [-79.3832, 43.6532],
    "New York": [-74.0060, 40.7128],
    "London": [-0.1276, 51.5072],
    "Tokyo": [139.6917, 35.6895],
    "Paris": [2.3522, 48.8566],
    "Shanghai": [121.4737, 31.2304],
    "Hong Kong": [114.1694, 22.3193],
    "Singapore": [103.8198, 1.3521],
    "Los Angeles": [-118.2437, 34.0522],
    "Vancouver": [-123.1207, 49.2827],
  }

  useEffect(() => {
    if (!mapContainer.current) return

    map.current = new maplibregl.Map({
      container: mapContainer.current,
      
      style: {
        version: 8,

        sources: {
          osm: {
            type: 'raster',
            tiles: [
              'https://tiles.stadiamaps.com/tiles/alidade_smooth_dark/{z}/{x}/{y}.png'
            ],
            tileSize: 256,
            attribution:
              '© Stadia Maps © OpenMapTiles © OpenStreetMap',
            maxzoom: 20,
          },
        },

        layers: [
          {
            id: 'osm',
            type: 'raster',
            source: 'osm',
          },
        ],
      },

      center: cityLocations[city], // Initial center based on selected city
      zoom: 11,
    })

    return () => { 
      map.current?.remove() 
      map.current = null 
    } 
  }, [])

  const handleCityChange = (newCity: string) => {
    setCity(newCity) 
    const location = cityLocations[newCity] 
    map.current?.flyTo({ 
      center: location, 
      zoom: 11, 
    }) 
  }

  return (
    <div>
      <h1 onClick={() => window.location.reload()}>
        Public Transit Navigation System
      </h1>

      <p>
        A smart navigation system for public transportation that utilizes real-world map data to optimize routes under simulated traffic conditions. The project explores graph algorithms, dynamic routing, ride-sharing, and efficient transportation planning.
        <br /><br />
      </p>

      <div className="map-container">
        <div
          ref={mapContainer}
          style={{
            width: '100%',
            height: '100%',
          }}
        />
      </div>

      <br /><br />
      <div className="location-selector">
        <label htmlFor="city">Location:</label>

        <select
          id="city"
          value={city}
          onChange={(e) => handleCityChange(e.target.value)}
        >
          <option value="Toronto">Toronto</option>
          <option value="New York">New York</option>
          <option value="London">London</option>
          <option value="Tokyo">Tokyo</option>
          <option value="Paris">Paris</option>
          <option value="Shanghai">Shanghai</option>
          <option value="Hong Kong">Hong Kong</option>
          <option value="Singapore">Singapore</option>
          <option value="Los Angeles">Los Angeles</option>
          <option value="Vancouver">Vancouver</option>
        </select>
      </div>
    </div>
  )
}

export default App