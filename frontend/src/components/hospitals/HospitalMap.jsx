import React from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix for default marker icon issue with Webpack
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: require('leaflet/dist/images/marker-icon-2x.png'),
    iconUrl: require('leaflet/dist/images/marker-icon.png'),
    shadowUrl: require('leaflet/dist/images/marker-shadow.png'),
});

const HospitalMap = ({ hospitals }) => {
    // Default center, can be user's location in a real app
    const position = hospitals.length > 0 ? [hospitals[0].latitude, hospitals[0].longitude] : [51.505, -0.09];
    const zoom = hospitals.length > 0 ? 10 : 2;

    return (
        <MapContainer center={position} zoom={zoom} scrollWheelZoom={true} style={{ height: '100%', width: '100%' }}>
            <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            {hospitals.map(hospital => (
                <Marker key={hospital.id} position={[hospital.latitude, hospital.longitude]}>
                    <Popup>
                        <div className="font-sans">
                            <h4 className="font-bold text-base">{hospital.name}</h4>
                            <p>{hospital.address}</p>
                            {hospital.phone_number && <p>Tel: {hospital.phone_number}</p>}
                            {hospital.website && <a href={hospital.website} target="_blank" rel="noopener noreferrer" className="text-dortmed-600 hover:underline">Visit Website</a>}
                        </div>
                    </Popup>
                </Marker>
            ))}
        </MapContainer>
    );
};

export default HospitalMap;