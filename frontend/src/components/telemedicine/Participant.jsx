import React, { useState, useEffect, useRef } from 'react';

const Participant = ({ participant }) => {
    const [videoTracks, setVideoTracks] = useState([]);
    const [audioTracks, setAudioTracks] = useState([]);

    const videoRef = useRef();
    const audioRef = useRef();

    const trackpubsToTracks = trackMap => Array.from(trackMap.values())
        .map(publication => publication.track)
        .filter(track => track !== null);

    useEffect(() => {
        setVideoTracks(trackpubsToTracks(participant.videoTracks));
        setAudioTracks(trackpubsToTracks(participant.audioTracks));

        const trackSubscribed = track => {
            if (track.kind === 'video') {
                setVideoTracks(prev => [...prev, track]);
            } else {
                setAudioTracks(prev => [...prev, track]);
            }
        };

        const trackUnsubscribed = track => {
            if (track.kind === 'video') {
                setVideoTracks(prev => prev.filter(v => v !== track));
            } else {
                setAudioTracks(prev => prev.filter(a => a !== track));
            }
        };

        participant.on('trackSubscribed', trackSubscribed);
        participant.on('trackUnsubscribed', trackUnsubscribed);

        return () => {
            participant.off('trackSubscribed', trackSubscribed);
            participant.off('trackUnsubscribed', trackUnsubscribed);
        };
    }, [participant]);

    useEffect(() => {
        const videoTrack = videoTracks[0];
        if (videoTrack) {
            videoTrack.attach(videoRef.current);
            return () => videoTrack.detach();
        }
    }, [videoTracks]);

    useEffect(() => {
        const audioTrack = audioTracks[0];
        if (audioTrack) {
            audioTrack.attach(audioRef.current);
            return () => audioTrack.detach();
        }
    }, [audioTracks]);

    return (
        <div className="participant relative rounded-lg overflow-hidden bg-gray-800 shadow-lg">
            <video ref={videoRef} autoPlay={true} className="w-full h-full object-cover" />
            <audio ref={audioRef} autoPlay={true} muted={participant.local} />
            <div className="absolute bottom-0 left-0 bg-black bg-opacity-50 text-white text-sm px-2 py-1 rounded-tr-lg">
                {participant.identity}
            </div>
        </div>
    );
};

export default Participant;