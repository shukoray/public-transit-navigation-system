import './App.css'
import 'maplibre-gl/dist/maplibre-gl.css'
import { useEffect, useRef, useState } from 'react'
import * as maplibregl from 'maplibre-gl'
import type { Feature, LineString } from 'geojson'


function drawSvgRoute(
  map: maplibregl.Map,
  coordinates: [number, number][]
): () => void {
  // Use the entire map container instead of the canvas container
  const container = map.getContainer()

  const svgNS = 'http://www.w3.org/2000/svg'
  const svg = document.createElementNS(svgNS, 'svg')

  Object.assign(svg.style, {
    position: 'absolute',
    top: '0',
    left: '0',
    width: '100%',
    height: '100%',
    pointerEvents: 'none',
    zIndex: '1',
    overflow: 'hidden'
  })

  svg.setAttribute('data-route-overlay', 'true')

  // Dark outline underneath the route
  const outline = document.createElementNS(svgNS, 'polyline')
  outline.setAttribute('fill', 'none')
  outline.setAttribute('stroke', '#000000')
  outline.setAttribute('stroke-width', '10')
  outline.setAttribute('stroke-linecap', 'round')
  outline.setAttribute('stroke-linejoin', 'round')

  // Main magenta route
  const polyline = document.createElementNS(svgNS, 'polyline')
  polyline.setAttribute('fill', 'none')
  polyline.setAttribute('stroke', '#ff00ff')
  polyline.setAttribute('stroke-width', '6')
  polyline.setAttribute('stroke-linecap', 'round')
  polyline.setAttribute('stroke-linejoin', 'round')

  svg.appendChild(outline)
  svg.appendChild(polyline)

  container.appendChild(svg)

  const update = () => {
    const width = container.clientWidth
    const height = container.clientHeight

    svg.setAttribute('viewBox', `0 0 ${width} ${height}`)

    const points = coordinates.map(([lng, lat]) => {
      const point = map.project([lng, lat])
      return `${point.x},${point.y}`
    })

    const pointString = points.join(' ')

    outline.setAttribute('points', pointString)
    polyline.setAttribute('points', pointString)
  }

  map.on('render', update)
  update()

  console.log('SVG overlay added:', container.contains(svg))
  console.log('Route coordinate count:', coordinates.length)
  console.log('SVG dimensions:', container.clientWidth, container.clientHeight)

  return () => {
    map.off('render', update)
    svg.remove()
  }
}


function App() {
  const mapContainer = useRef<HTMLDivElement>(null)
  const map = useRef<maplibregl.Map | null>(null);
  const startMarker = useRef<maplibregl.Marker | null>(null)
  const endMarker = useRef<maplibregl.Marker | null>(null)
  const startPointRef = useRef<[number, number] | null>(null)

  const routeSvgCleanup = useRef<(() => void) | null>(null)
  const endPointRef = useRef<[number, number] | null>(null)
  const [city, setCity] = useState("Toronto");
  const [startPoint, setStartPoint] = useState<[number, number] | null>(null)
  const [endPoint, setEndPoint] = useState<[number, number] | null>(null)
  const [distance, setDistance] = useState<number | null>(null)
  const [duration, setDuration] = useState<number | null>(null)
  const [routeError, setRouteError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

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

      center: cityLocations[city],
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
      const markerElement = document.createElement('div')
      markerElement.textContent = '📍'
      markerElement.style.fontSize = '30px'
      markerElement.style.cursor = 'pointer'
      markerElement.style.zIndex = '10'

      markerElement.addEventListener('click', (event) => {
        event.stopPropagation()
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
      markerElement.style.zIndex = '10'

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

  //OSRM ROUTING
  useEffect(() => {
    const currentMap = map.current
    if (!currentMap) return

    const sourceId = 'driving-route'
    const layerId = 'driving-route-line'

    // Remove previous route
    const clearRoute = () => {
      routeSvgCleanup.current?.()
      routeSvgCleanup.current = null

      if (currentMap.getLayer(layerId)) {
        currentMap.removeLayer(layerId)
      }

      if (currentMap.getSource(sourceId)) {
        currentMap.removeSource(sourceId)
      }
    }

    clearRoute()

    setDistance(null)
    setDuration(null)
    setRouteError(null)

    // No route until both points are selected
    if (!startPoint || !endPoint) {
      setIsLoading(false)
      return
    }

    const controller = new AbortController()
    let cancelled = false

    const calculateRoute = async () => {
      setIsLoading(true)

      try {
        // OSRM API request
        const url =
          `https://router.project-osrm.org/route/v1/driving/` +
          `${startPoint[0]},${startPoint[1]};` +
          `${endPoint[0]},${endPoint[1]}` +
          `?overview=full&geometries=geojson&steps=true`

        const response = await fetch(url, {
          signal: controller.signal
        })

        if (!response.ok) {
          throw new Error('Failed to connect to OSRM')
        }

        const data = await response.json()

        if (data.code !== 'Ok' || !data.routes?.length) {
          throw new Error('No driving route found')
        }

        if (cancelled) return

        const route = data.routes[0]

        // Save route information
        setDistance(route.distance)
        setDuration(route.duration)

        // GeoJSON route data
        const geojson: Feature<LineString> = {
          type: 'Feature',
          properties: {},
          geometry: route.geometry
        }
        
        // Draw route after map style has loaded
        const drawRoute = () => {
          if (cancelled || currentMap !== map.current) return

          // Wait until the map style is ready
          if (!currentMap.isStyleLoaded()) {
            currentMap.once('idle', drawRoute)
            currentMap.triggerRepaint()
            return
          }

          try {
            clearRoute()

            console.log("Drawing route...")
            console.log("Coordinates:", route.geometry.coordinates.length)
            // Draw route using SVG as an additional rendering method
            routeSvgCleanup.current = drawSvgRoute(
              currentMap,
              route.geometry.coordinates as [number, number][]
            )

            console.log("SVG route created")
            currentMap.addSource(sourceId, {
              type: 'geojson',
              data: geojson
            })

            currentMap.addLayer({
              id: layerId,
              type: 'line',
              source: sourceId,
              layout: {
                'line-join': 'round',
                'line-cap': 'round'
              },
              paint: {
                'line-color': '#00aaff',
                'line-width': 7,
                'line-opacity': 1
              }
            })

            // Automatically fit map to route
            const bounds = new maplibregl.LngLatBounds()

            route.geometry.coordinates.forEach(
              (coordinate: [number, number]) => {
                bounds.extend(coordinate)
              }
            )

            currentMap.fitBounds(bounds, {
              padding: 80,
              maxZoom: 16,
              duration: 1000
            })

            console.log("Route layer:", currentMap.getLayer(layerId))
            console.log("Route source:", currentMap.getSource(sourceId))

          } catch (error) {
            console.error("Failed to draw route:", error)
            setRouteError("Failed to display route on map")
          }
        }

        // Start drawing
        drawRoute()


      } catch (error) {
        if (cancelled) return

        console.error('Routing error:', error)
        setRouteError(
          error instanceof Error
            ? error.message
            : 'Unable to calculate route'
        )
      } finally {
        if (!cancelled) {
          setIsLoading(false)
        }
      }
    }

    calculateRoute()

    return () => {
      cancelled = true
      controller.abort()
      currentMap.off('load', () => {})
    }
  }, [startPoint, endPoint])

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
    <main className="map-screen">
      <div className="map-container">
        <div
          ref={mapContainer}
          style={{
            width: '100%',
            height: '100%',
          }}
        />
      </div>

      <h1 className="map-title" onClick={() => window.location.reload()}>
        Public Navigation System
      </h1>

      <div className="location-information">
        <strong>Location information</strong>

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

        <hr />

        <strong>Driving Route</strong>

        {isLoading && (
          <p>Calculating route...</p>
        )}

        {routeError && (
          <p style={{ color: 'red' }}>{routeError}</p>
        )}

        {distance !== null && duration !== null && (
          <>
            <p>
              Distance: {(distance / 1000).toFixed(2)} km
            </p>

            <p>
              Estimated time: {Math.ceil(duration / 60)} min
            </p>
          </>
        )}

        <button onClick={resetPoints}>
          Reset
        </button>
      </div>

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
    </main>
  )
}

export default App
