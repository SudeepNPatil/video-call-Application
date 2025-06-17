
import React, { useEffect, useRef, useState } from "react";
import Peer from "peerjs";
import io from "socket.io-client";
import {
  FaMicrophone,
  FaMicrophoneSlash,
  FaVideo,
  FaVideoSlash,
  FaPhoneSlash,
} from "react-icons/fa";

const socket = io("https://video-call-application-2ybh.onrender.com"); // Update this to your deployed backend URL

function App() {
  const [peerId, setPeerId] = useState(null);
  const [remotePeerId, setRemotePeerId] = useState(null);
  const [stream, setStream] = useState(null);
  const [micOn, setMicOn] = useState(true);
  const [cameraOn, setCameraOn] = useState(true);
  const [inCall, setInCall] = useState(false);
  const [askedToJoin, setAskedToJoin] = useState(false);
  const localVideoRef = useRef();
  const remoteVideoRef = useRef();
  const peerRef = useRef();
  const callRef = useRef();

  useEffect(() => {
    const peer = new Peer(undefined, {
      host: "peerjs.com",
      secure: true,
      port: 443,
    });
    peerRef.current = peer;

    peer.on("open", (id) => {
      setPeerId(id);
      console.log("My peer ID is: " + id);
    });

    // We do NOT answer until we have a local stream
    peer.on("call", (call) => {
      if (stream) {
        call.answer(stream);

        call.on("stream", (remoteStream) => {
          remoteVideoRef.current.srcObject = remoteStream;
        });

        callRef.current = call;
        setInCall(true);
      } else {
        console.warn("Received call before stream was ready");
      }
    });

    socket.on("user-joined", (userId) => {
      setRemotePeerId(userId);
    });

    return () => {
      peer.destroy();
    };
  }, [stream]);


  const handleAskToJoin = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      setStream(mediaStream);
      localVideoRef.current.srcObject = mediaStream;
      socket.emit("join-room", "video-room");
      setAskedToJoin(true);
    } catch (err) {
      console.error("Permission denied or error:", err);
    }
  };

  const startCall = () => {
    if (!remotePeerId || !stream || !peerRef.current) return;

    const call = peerRef.current.call(remotePeerId, stream);

    call.on("stream", (remoteStream) => {
      remoteVideoRef.current.srcObject = remoteStream;
    });

    callRef.current = call;
    setInCall(true);
  };

  const toggleMic = () => {
    if (!stream) return;
    stream.getAudioTracks()[0].enabled = !micOn;
    setMicOn(!micOn);
  };

  const toggleCamera = () => {
    if (!stream) return;
    stream.getVideoTracks()[0].enabled = !cameraOn;
    setCameraOn(!cameraOn);
  };

  const leaveCall = () => {
    if (callRef.current) callRef.current.close();
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
    }
    setInCall(false);
    setAskedToJoin(false);
    setRemotePeerId(null);
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-900 text-white p-4">
      <h1 className="text-2xl font-bold mb-4">React Video Chat</h1>

      {!askedToJoin ? (
        <button
          onClick={handleAskToJoin}
          className="bg-blue-600 px-4 py-2 rounded hover:bg-blue-700"
        >
          Ask to Join
        </button>
      ) : (
        <>
          <div className="flex space-x-4 mb-4">
            {!inCall && remotePeerId && (
              <button
                onClick={startCall}
                className="bg-green-600 px-4 py-2 rounded hover:bg-green-700"
              >
                Start Call
              </button>
            )}

            {inCall && (
              <>
                <button
                  onClick={toggleMic}
                  className="bg-gray-700 p-3 rounded-full"
                >
                  {micOn ? <FaMicrophone /> : <FaMicrophoneSlash />}
                </button>

                <button
                  onClick={toggleCamera}
                  className="bg-gray-700 p-3 rounded-full"
                >
                  {cameraOn ? <FaVideo /> : <FaVideoSlash />}
                </button>

                <button
                  onClick={leaveCall}
                  className="bg-red-600 p-3 rounded-full hover:bg-red-700"
                >
                  <FaPhoneSlash />
                </button>
              </>
            )}
          </div>

          <div className="flex gap-4">
            <video ref={localVideoRef} autoPlay muted className="w-64 h-40 bg-black" />
            <video ref={remoteVideoRef} autoPlay className="w-64 h-40 bg-black" />
          </div>
        </>
      )}

      <p className="text-sm mt-4">Your ID: {peerId}</p>
    </div>
  );
}

export default App;
