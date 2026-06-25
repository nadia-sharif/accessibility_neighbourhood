// Set your Mapbox access token
mapboxgl.accessToken = "pk.eyJ1IjoibmFkaXlhYWxpIiwiYSI6ImNtcXJteTF2cTAxZWkyb3B2cjc2MHZ3cmcifQ.b8TA5EQtzDwQoODhm0CvJw";


// Initialise map centering directly on Melbourne CBD
const map = new mapboxgl.Map({
    container: 'map',
    style: 'mapbox://styles/mapbox/light-v11', // Clean base style so colors pop
    center: [144.9631, -37.8136],
    zoom: 13,
    minZoom: 6,
    maxZoom: 18
});

// Add zoom and rotation controls to the top right corner
map.addControl(new mapboxgl.NavigationControl(), 'top-right');

map.on('load', () => {
    // 1. Set up an empty placeholder GeoJSON data source for the Isochrone shapes
    map.addSource('iso-source', {
        type: 'geojson',
        data: {
            type: 'FeatureCollection',
            features: []
        }
    });

    // 2. Add the drawing layer styled specifically with the policy color palette
    map.addLayer({
        id: 'iso-layer',
        type: 'fill',
        source: 'iso-source',
        layout: {},
        paint: {
            // Match the color to the 'contour' metric returned from Mapbox (5, 10, or 20)
            'fill-color': [
                'match',
                ['get', 'contour'],
                5, '#10B981',   // 5 Min - Emerald Green
                10, '#F59E0B',  // 10 Min - Amber Yellow
                20, '#EF4444',  // 20 Min - Crimson Red
                '#6B7280'       // Fallback gray
            ],
            'fill-opacity': 0.20, // Clear translucency to keep background street layout legible
            'fill-outline-color': 'rgba(255,255,255,0.5)'
        }
    });

    // 3. Add a clean point marker for the exact origin point clicked by the user
    map.addSource('origin-source', {
        type: 'geojson',
        data: {
            type: 'FeatureCollection',
            features: []
        }
    });

    map.addLayer({
        id: 'origin-layer',
        type: 'circle',
        source: 'origin-source',
        paint: {
            'circle-radius': 6,
            'circle-color': '#111827',
            'circle-stroke-width': 2,
            'circle-stroke-color': '#FFFFFF'
        }
    });

    // 1. Create a dynamic source for live OSM data
    map.addSource('osm-pois', {
        type: 'geojson',
        data: { type: 'FeatureCollection', features: [] }
    });

    // 2. Render captured OSM locations as high-contrast circles
    // map.addLayer({
    //     id: 'osm-poi-circles',
    //     type: 'circle',
    //     source: 'osm-pois',
    //     paint: {
    //         'circle-radius': 6,
    //         // Dynamically color points based on their OSM tag category
    //         'circle-color': [
    //             'match',
    //             ['get', 'amenity'],
    //             'cafe', '#FF9F1C',       // Cafes = Orange
    //             'restaurant', '#FF9F1C', // Restaurants = Orange
    //             'school', '#4361EE',     // Schools = Blue
    //             'college', '#4361EE',    // Higher Ed = Blue
    //             'pharmacy', '#2EC4B6',   // Medical = Mint
    //             '#7209B7'                // Shops/Other = Purple
    //         ],
    //         'circle-stroke-width': 1.5,
    //         'circle-stroke-color': '#FFFFFF'
    //     }
    // });

    // 1. Render captured OSM locations using Mapbox's built-in Maki Icons
    map.addLayer({
        id: 'osm-poi-symbols',
        type: 'symbol',
        source: 'osm-pois',
        layout: {
            // Match the OSM 'amenity' tag value to a specific Mapbox Maki icon name
            'icon-image': [
                'match',
                ['get', 'amenity'],
                'cafe', 'cafe',               // Note: Many Mapbox sprites require the size suffix like '-15'
                'restaurant', 'restaurant',
                'school', 'school',
                'college', 'college',
                'pharmacy', 'pharmacy',
                // Retail & Shops
                'supermarket', 'grocery',
                'convenience', 'grocery',
                'grocery', 'grocery',
                'clothes', 'clothing-store',
                'hairdresser', 'hairdresser',
                'bakery', 'bakery',
                'alcohol', 'alcohol-shop',
                'mall', 'shop',

                // Travel & Transport
                'bus_station', 'bus',
                'fuel', 'fuel',
                'parking', 'parking',

                'marker'                      // Fallback icon
            ],
            'icon-size': 1.5,
            'icon-allow-overlap': true
            // Removed duplicate text properties from this layer since you have 'osm-poi-labels' below
        }
    });

    // 3. Render neat floating text labels right above the circles
    map.addLayer({
        id: 'osm-poi-labels',
        type: 'symbol',
        source: 'osm-pois',
        layout: {
            'text-field': ['get', 'name'],
            'text-font': ['Open Sans Regular', 'Arial Unicode MS Regular'],
            'text-size': 12,
            'text-offset': [0, 0.5],
            'text-anchor': 'top'
        },

        paint: {
            'text-color': [
                'match',
                ['get', 'amenity'],
                'cafe', '#f0690e',       // Cafes = Orange
                'restaurant', '#eb28aa', // Restaurants = Orange
                'school', '#4361EE',     // Schools = Blue
                'college', '#4361EE',    // Higher Ed = Blue
                'pharmacy', '#2EC4B6',   // Medical = Mint
                '#7209B7'                // Shops/Other = Purple
            ],
            'text-halo-color': '#FFFFFF',
            'text-halo-width': 1.5
        }
    });

});// map loads end

// Click Event Listener capturing the click coordinate data
map.on('click', (e) => {
    // 1. Force the script to read the library directly out of window memory
    const turfEngine = window.turf;

    // 2. Safety Check: If Turf hasn't loaded yet, alert the user and stop execution
    if (!turfEngine) {
        console.error("Turf.js library is still downloading. Please click again in a brief second.");
        return;
    }

    const lng = e.lngLat.lng;
    const lat = e.lngLat.lat;
    const profile = document.getElementById('mode').value;

    // Wrap the coordinates into a standard GeoJSON FeatureCollection structure
    map.getSource('origin-source').setData({
        'type': 'FeatureCollection',
        'features': [
            {
                'type': 'Feature',
                'geometry': {
                    'type': 'Point',
                    'coordinates': [lng, lat] // Longitude always goes first in GeoJSON
                },
                'properties': {}
            }
        ]
    });

    const mapboxUrl = 'https://api.mapbox.com/isochrone/v1/mapbox/' + profile + '/' + lng + ',' + lat + '.json?contours_minutes=5,10,20&polygons=true&access_token=' + mapboxgl.accessToken;

    fetch(mapboxUrl)
        .then(response => response.json())
        .then(isoData => {
            map.getSource('iso-source').setData(isoData);
            const outer20MinPolygon = isoData.features;

            // 3. Fix the array index order to match Overpass bounding box syntax: (south, west, north, east)
            const bbox = turfEngine.bbox(isoData); // Scans the geometry data block 
            const overpassBbox = bbox[1] + ',' + bbox[0] + ',' + bbox[3] + ',' + bbox[2];

            // 1. Define your raw Overpass QL query string without complex encoding wrappers
            const overpassQuery = `
    [out:json][timeout:25];
    (
      node["amenity"~"cafe|restaurant|school|college|pharmacy|shop"](${overpassBbox});
      node["shop"](${overpassBbox});
    );
    out body;
`;

            // 2. Execute a standard HTTP POST request as outlined in the Developer Quick Start Guide
            return fetch("https://overpass-api.de/api/interpreter",
                {
                    method: "POST",
                    headers: {
                        'Content-Type': 'application/x-www-form-urlencoded'
                    },
                    body: "data=" + encodeURIComponent(overpassQuery) // Safely binds your query to the body payload
                })
                .then(res => {
                    if (!res.ok) throw new Error('Overpass endpoint returned an error: ' + res.status);
                    return res.json();
                })
                .then(osmData => {
                    const features = [];

                    if (osmData.elements) {
                        osmData.elements.forEach(element => {
                            if (element.lat && element.lon) {
                                features.push({
                                    type: 'Feature',
                                    geometry: { type: 'Point', coordinates: [element.lon, element.lat] },
                                    properties: element.tags
                                });
                            }
                        });
                    }

                    const rawOsmPointsCollection = {
                        type: 'FeatureCollection',
                        features: features
                    };

                    // Filter out only the points sitting exactly inside your shape boundaries
                    const strictIntersections = turfEngine.pointsWithinPolygon(rawOsmPointsCollection, isoData);
                    // Inject the final nodes straight into your Mapbox canvas layer
                    map.getSource('osm-pois').setData(strictIntersections);
                });

        })
        .catch(error => {
            console.error('Error executing combined Spatial live-tracking data loop:', error);
        });
});
