import React, { useState, useEffect } from 'react';
import Video from 'twilio-video';
import Participant from './Participant';
// Corrected imports - solid for active state, outline for inactive/action state
import { MicrophoneIcon, VideoCameraIcon } from '@heroicons/react/24/solid';
import {
VideoCameraSlashIcon,
PhoneXMarkIcon, // This is the correct icon for hanging up
MicrophoneIcon as MicrophoneOutlineIcon // Use an alias for the outline version
} from '@heroicons/react/24/outline';
const VideoRoom = ({ token, roomName, onLeave }) => {
const [room, setRoom] = useState(null);
const [participants, setParticipants] = useState([]);
const [isMuted, setIsMuted] = useState(false);
const [isVideoOff, setIsVideoOff] = useState(false);
useEffect(() => {
    const participantConnected = participant => { setParticipants(prev => [...prev, participant]); };
    const participantDisconnected = participant => { setParticipants(prev => prev.filter(p => p !== participant)); };

    Video.connect(token, { name: roomName }).then(room => {
        setRoom(room);
        room.on('participantConnected', participantConnected);
        room.on('participantDisconnected', participantDisconnected);
        setParticipants([room.localParticipant, ...Array.from(room.participants.values())]);
    }).catch(error => { console.error(`Unable to connect to Room: ${error.message}`); });

    return () => {
        setRoom(currentRoom => {
            if (currentRoom && currentRoom.state === 'connected') { currentRoom.disconnect(); return null; }
            return currentRoom;
        });
    };
}, [roomName, token]);

const handleLeave = () => { if (room) { room.disconnect(); } onLeave(); };

const toggleMute = () => {
    if (room) {
        room.localParticipant.audioTracks.forEach(publication => {
            isMuted ? publication.track.enable() : publication.track.disable();
        });
        setIsMuted(!isMuted);
    }
};

const toggleVideo = () => {
    if (room) {
        room.localParticipant.videoTracks.forEach(publication => {
            isVideoOff ? publication.track.enable() : publication.track.disable();
        });
        setIsVideoOff(!isVideoOff);
    }
};

const remoteParticipants = participants.filter(p => !p.local).map(p => <Participant key={p.sid} participant={p} />);
const localParticipant = room ? <Participant key={room.localParticipant.sid} participant={room.localParticipant} /> : null;

return (
    <div className="h-screen w-screen bg-gray-900 flex flex-col p-4 text-white">
        <div className="flex-grow grid grid-cols-1 md:grid-cols-2 gap-4 relative">
            <div className="remote-participants grid grid-cols-1 gap-4 h-full">
                {remoteParticipants.length > 0
                    ? remoteParticipants
                    : <div className="flex items-center justify-center text-gray-400">Waiting for other participant to join...</div>
                }
            </div>
            <div className="local-participant absolute bottom-24 right-4 w-48 h-36 md:w-64 md:h-48 border-2 border-dortmed-500 rounded-lg overflow-hidden z-10">
                {localParticipant}
            </div>
        </div>
        <div className="flex-shrink-0 flex justify-center items-center space-x-4 p-4 mt-4">
            <button onClick={toggleMute} className="p-3 bg-gray-700 hover:bg-gray-600 rounded-full transition-colors">
                {/* JSX now uses the CORRECT imported icon names */}
                {isMuted ? <MicrophoneOutlineIcon className="w-6 h-6 text-red-500"/> : <MicrophoneIcon className="w-6 h-6"/>}
            </button>
            <button onClick={toggleVideo} className="p-3 bg-gray-700 hover:bg-gray-600 rounded-full transition-colors">
                {/* JSX now uses the CORRECT imported icon names */}
                {isVideoOff ? <VideoCameraSlashIcon className="w-6 h-6 text-red-500"/> : <VideoCameraIcon className="w-6 h-6"/>}
            </button>
            <button onClick={handleLeave} className="p-4 bg-red-600 hover:bg-red-700 rounded-full transition-colors">
                {/* JSX now uses the CORRECT imported icon names */}
                <PhoneXMarkIcon className="w-6 h-6" />
            </button>
        </div>
    </div>
);
};
export default VideoRoom;