import './App.css'
import 'maplibre-gl/dist/maplibre-gl.css'
import { useEffect, useRef, useState } from 'react'
import * as maplibregl from 'maplibre-gl'

function App() {
  const mapContainer = useRef<HTMLDivElement>(null)
  const map = useRef<maplibregl.Map | null>(null);
  const startMarker = useRef<maplibregl.Marker | null>(null)
  const endMarker = useRef<maplibregl.Marker | null>(null)
  const startPointRef = useRef<[number, number] | null>(null)
  const endPointRef = useRef<[number, number] | null>(null)
  const [city, setCity] = useState("Toronto");
  const [startPoint, setStartPoint] = useState<[number, number] | null>(null)
  const [endPoint, setEndPoint] = useState<[number, number] | null>(null)
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

    const handleMapClick = (e: maplibregl.MapMouseEvent) => {
      const point: [number, number] = [
        e.lngLat.lng,
        e.lngLat.lat
      ]

      //if no start, set start
      if (startPointRef.current === null) {
        setStartPoint(point)
      }

      //if start exists but no end, set End
      else if (endPointRef.current === null) {
        setEndPoint(point)
      }

      // Both exist → do nothing
    }

    map.current.on('click', handleMapClick)

    return () => {
      map.current?.off('click', handleMapClick)
      map.current?.remove()
      map.current = null
    }
  }, [])

  // Keep the refs synchronized with React state
  useEffect(() => {
    startPointRef.current = startPoint
  }, [startPoint])

  useEffect(() => {
    endPointRef.current = endPoint
  }, [endPoint])

  // Create / remove start marker
  useEffect(() => {
    if (!map.current) return
    startMarker.current?.remove()
    startMarker.current = null
    if (startPoint) {
      const markerElement = document.createElement('div') //Use JavaScript to create a HTML element for the marker
      markerElement.textContent = '📍'
      markerElement.style.fontSize = '30px'
      markerElement.style.cursor = 'pointer'

      markerElement.addEventListener('click', (event) => {
        event.stopPropagation() //The click event stops here, it do not propagate further to the outer layer such as map.
        setStartPoint(null)
      })

      startMarker.current = new maplibregl.Marker({
        element: markerElement
      })
        .setLngLat(startPoint)
        .addTo(map.current)
    }
  }, [startPoint])

  // Create / remove end marker
  useEffect(() => {
    if (!map.current) return
    endMarker.current?.remove()
    endMarker.current = null
    if (endPoint) {
      const markerElement = document.createElement('div')
      markerElement.textContent = '🏁'
      markerElement.style.fontSize = '30px'
      markerElement.style.cursor = 'pointer'

      markerElement.addEventListener('click', (event) => {
        event.stopPropagation()
        setEndPoint(null)
      })

      endMarker.current = new maplibregl.Marker({
        element: markerElement
      })
        .setLngLat(endPoint)
        .addTo(map.current)
    }
  }, [endPoint])

  const handleCityChange = (newCity: string) => {
    setCity(newCity) 
    setStartPoint(null)
    setEndPoint(null)
    const location = cityLocations[newCity] 
    map.current?.flyTo({ 
      center: location, 
      zoom: 11, 
    }) 
  }

  const resetPoints = () => {
    setStartPoint(null)
    setEndPoint(null)
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
      <br />

      // Display the selected start and end points
      <div>
        <p>
          Start: {startPoint
            ? `${startPoint[1].toFixed(5)}, ${startPoint[0].toFixed(5)}`
            : 'Not selected'}
        </p>

        <p>
          End: {endPoint
            ? `${endPoint[1].toFixed(5)}, ${endPoint[0].toFixed(5)}`
            : 'Not selected'}
        </p>

        <button onClick={resetPoints}>
          Reset
        </button>
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

      <br /><br />
    </div>
  )
}

export default App