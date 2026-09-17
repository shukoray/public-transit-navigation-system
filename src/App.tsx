import 'maplibre-gl/dist/maplibre-gl.css'
import { useEffect, useRef } from 'react'
import * as maplibregl from 'maplibre-gl'

function App() {
  const mapContainer = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!mapContainer.current) return

    const map = new maplibregl.Map({
      container: mapContainer.current,
      style: 'https://demotiles.maplibre.org/globe.json',
      center: [-79.3832, 43.6532],
      zoom: 11,
    })

    return () => map.remove()
  }, [])

  return (
    <div>
      <h1 onClick={() => window.location.reload()}>
        Public Transit Navigation System
      </h1>

      <p>
        A smart navigation system for public transportation that utilizes real-world map data to optimize routes under simulated traffic conditions. The project explores graph algorithms, dynamic routing, ride-sharing, and efficient transportation planning.
        <br /><br />
      </p>

      <div
        ref={mapContainer}
        style={{
          width: '100%',
          height: '500px',
        }}
      />
    </div>
  )
}

export default App