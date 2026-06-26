// Set your Mapbox access token
mapboxgl.accessToken = "pk.eyJ1IjoibmFkaXlhYWxpIiwiYSI6ImNtcXJteTF2cTAxZWkyb3B2cjc2MHZ3cmcifQ.b8TA5EQtzDwQoODhm0CvJw";


// Initialise map centering directly on Melbourne CBD
const map = new mapboxgl.Map({
    container: 'map',
    style: 'mapbox://styles/mapbox/light-v11', // Clean base style so colors pop
    center: [144.9631, -37.8136],
    zoom: 13,
    minZoom: 6,
    maxZoom: 20
});

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

// Add zoom and rotation controls to the top right corner
map.addControl(new mapboxgl.NavigationControl(), 'top-right');








map.on('click', (e) => {
    const turfEngine = window.turf;

    if (!turfEngine) {
        console.error("Turf.js library is still downloading. Please click again in a brief second.");
        return;
    }

    const lng = e.lngLat.lng;
    const lat = e.lngLat.lat;

    // Quick Fix: Changed 'mode' to match your panel dropdown ID ('profile-select')
    const profileSelectEl = document.getElementById('profile-select') || document.getElementById('mode');
    const profile = profileSelectEl.value;

    map.getSource('origin-source').setData({
        'type': 'FeatureCollection',
        'features': [
            {
                'type': 'Feature',
                'geometry': {
                    'type': 'Point',
                    'coordinates': [lng, lat]
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

            const bbox = turfEngine.bbox(isoData);
            const overpassBbox = bbox[1] + ',' + bbox[0] + ',' + bbox[3] + ',' + bbox[2];

            // Using the optimized point query layout
            const overpassQuery = `
                [out:json][timeout:25];
                (
                  nwr["amenity"~"cafe|restaurant|school|college|pharmacy"](${overpassBbox});
                  nwr["shop"](${overpassBbox});
                );
                out center;
            `;

            return fetch("https://overpass-api.de/api/interpreter", {
                method: "POST",
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                body: "data=" + encodeURIComponent(overpassQuery)
            })
                .then(res => {
                    if (!res.ok) throw new Error('Overpass endpoint returned an error: ' + res.status);
                    return res.json();
                })
                .then(osmData => {
                    const features = [];

                    if (osmData.elements) {
                        osmData.elements.forEach(element => {
                            // Support both simple nodes and polygon center geometries
                            const latVal = element.center ? element.center.lat : element.lat;
                            const lonVal = element.center ? element.center.lon : element.lon;

                            if (latVal && lonVal) {
                                features.push({
                                    type: 'Feature',
                                    geometry: { type: 'Point', coordinates: [lonVal, latVal] },
                                    properties: element.tags
                                });
                            }
                        });
                    }

                    const rawOsmPointsCollection = {
                        type: 'FeatureCollection',
                        features: features
                    };

                    // Filter out global intersections inside the total footprint for the map canvas
                    const strictIntersections = turfEngine.pointsWithinPolygon(rawOsmPointsCollection, isoData);
                    map.getSource('osm-pois').setData(strictIntersections);

                    // --- NEW DASHBOARD PROCESSING INFRASTRUCTURE ---

                    // Extract individual contour rows (API outputs: [20min, 10min, 5min])
                    // Reversing them creates a smallest-to-largest index lookup array
                    const contours = [...isoData.features].reverse();
                    const iso5Polygon = contours[0];
                    const iso10Polygon = contours[1];
                    const iso20Polygon = contours[2];

                    let count5 = 0;
                    let count10 = 0;
                    let count20 = 0;
                    const categoryTotals = {};

                    strictIntersections.features.forEach(poi => {
                        const tags = poi.properties;
                        const rawType = tags.shop || tags.amenity || 'other';

                        // Assign high-level category buckets for progress tracking rows
                        let group = 'Other Services';
                        if (['cafe', 'restaurant', 'fast_food', 'pub'].includes(rawType)) group = 'Food & Drink';
                        else if (['supermarket', 'convenience', 'grocery', 'bakery'].includes(rawType)) group = 'Groceries';
                        else if (['school', 'college', 'university', 'kindergarten'].includes(rawType)) group = 'Education';
                        else if (['pharmacy', 'doctors', 'hospital'].includes(rawType)) group = 'Health & Wellness';
                        else if (['clothes', 'department_store', 'mall', 'shop', 'yes'].includes(rawType)) group = 'Retail Shopping';

                        categoryTotals[group] = (categoryTotals[group] || 0) + 1;

                        // Exclusively sort items into their tightest matching polygon layer
                        if (iso5Polygon && turfEngine.booleanPointInPolygon(poi, iso5Polygon)) {
                            count5++;
                        } else if (iso10Polygon && turfEngine.booleanPointInPolygon(poi, iso10Polygon)) {
                            count10++;
                        } else if (iso20Polygon && turfEngine.booleanPointInPolygon(poi, iso20Polygon)) {
                            count20++;
                        }
                    });

                    // --- DOM INJECTION RENDERING ---

                    // Reveal the dashboard blocks
                    document.getElementById('score-block')?.classList.remove('hidden');
                    document.getElementById('category-panel')?.classList.remove('hidden');

                    // Update text metrics
                    if (document.getElementById('count-5min')) document.getElementById('count-5min').innerText = `${count5} amenities inside buffer`;
                    if (document.getElementById('count-10min')) document.getElementById('count-10min').innerText = `${count10} amenities inside buffer`;
                    if (document.getElementById('count-20min')) document.getElementById('count-20min').innerText = `${count20} amenities inside buffer`;
                    if (document.getElementById('dash-total')) document.getElementById('dash-total').innerText = `${strictIntersections.features.length} AMENITIES Found`;

                    // Update dynamic meta description strings
                    const displayProfile = profile === 'walking' ? '🚶 Walking' : '🚴 Cycling';
                    if (document.getElementById('dash-profile')) document.getElementById('dash-profile').innerText = displayProfile;

                    // Simple algorithm computing liveability rating scale out of 100
                    const totalPOIs = strictIntersections.features.length;
                    const computedScore = Math.min(100, Math.round((count5 * 5) + (count10 * 2.5) + (count20 * 1)));
                    if (document.getElementById('score-number')) document.getElementById('score-number').innerText = computedScore;

                    if (document.getElementById('score-summary')) {
                        document.getElementById('score-summary').innerText = `Your location offers access to ${totalPOIs} local amenities within 20 mins using the ${profile} mode.`;
                    }

                    // Render horizontal progress row items dynamically
                    const listContainer = document.getElementById('categories-list');
                    if (listContainer) {
                        listContainer.innerHTML = ''; // Wipe old state data

                        Object.entries(categoryTotals)
                            .sort((a, b) => b[1] - a[1]) // Keep most dominant category up top
                            .forEach(([categoryName, quantity]) => {
                                const maxValForWidth = Math.max(...Object.values(categoryTotals));
                                const percentageWidth = (quantity / maxValForWidth) * 100;

                                const rowHtml = `
                                <div class="category-row" style="margin-bottom: 12px;">
                                    <div style="display:flex; justify-content:space-between; font-size:13px; margin-bottom:4px; font-weight:500; color:#333;">
                                        <span>${categoryName}</span>
                                        <span>${quantity}</span>
                                    </div>
                                    <div class="progress-bar-bg" style="background:#e2e8f0; height:8px; border-radius:4px; width:100%; overflow:hidden;">
                                        <div class="progress-bar-fill" style="background:#3182ce; height:100%; width:${percentageWidth}%;"></div>
                                    </div>
                                </div>
                            `;
                                listContainer.insertAdjacentHTML('beforeend', rowHtml);
                            });
                    }
                });
        })
        .catch(error => {
            console.error('Error executing combined Spatial live-tracking data loop:', error);
        });
});
