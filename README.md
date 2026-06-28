# accessibility_neighbourhood

<img width="2880" height="1530" alt="chrome-capture-2026-6-26 (2)" src="https://github.com/user-attachments/assets/5cf17ae8-0cde-465e-9d72-b53e3a7e9a42" />

<img width="2880" height="1530" alt="chrome-capture-2026-6-28" src="https://github.com/user-attachments/assets/a732ed85-bec8-403f-9f53-2c2880edb3fa" />


## Overview

An interactive Web GIS application inspired by the 20-Minute Neighbourhood concept from Plan Melbourne. The application evaluates how accessible a location is by generating 5, 10 and 20-minute walking or cycling isochrones and measuring access to nearby amenities.

Users can click anywhere on the map to generate network-based travel time polygons, view nearby points of interest, and explore an accessibility score based on weighted proximity to essential services. The application combines Mapbox Isochrone APIs, OpenStreetMap data and client-side spatial analysis to provide an interactive decision-support tool for exploring neighbourhood accessibility.

## Technologies
- Mapbox GL JS
- Mapbox Isochrone API
- Overpass API
- Turf.js
- JavaScript
- GeoJSON
- HTML & CSS

## Key Skills Demonstrated
- Web GIS Development
- Network Analysis
- Accessibility Modelling
- Client-side Spatial Analysis
- API Integration
- Urban Analytics
- Interactive Mapping

## Data Limitations
The application uses the Mapbox routing engine to generate travel-time isochrones and OpenStreetMap (OSM) data for points of interest. While Mapbox generally provides reliable walking and cycling networks, the completeness of OSM amenity data varies by location because it is community-maintained. As a result, accessibility scores should be interpreted as indicative rather than definitive, particularly in areas where OSM coverage is less complete.
