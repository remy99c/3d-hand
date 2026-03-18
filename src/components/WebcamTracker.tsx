import React, { useRef, useEffect, useState } from 'react'
import Webcam from 'react-webcam'
import { PoseLandmarker, FilesetResolver } from '@mediapipe/tasks-vision'

// Global target for the hand to point to
if (typeof window !== 'undefined') {
  (window as any).humanTarget = { x: 0, y: 0, active: false }
}

export function WebcamTracker({ onStatusChange }: { onStatusChange: (active: boolean) => void }) {
  const webcamRef = useRef<Webcam>(null)
  const [isOpen, setIsOpen] = useState(false)
  const [isMinimized, setIsMinimized] = useState(false)
  const [isLoaded, setIsLoaded] = useState(false)
  const poseLandmarker = useRef<PoseLandmarker | null>(null)

  useEffect(() => {
    onStatusChange(isOpen)
  }, [isOpen, onStatusChange])

  useEffect(() => {
    async function initDetection() {
      const vision = await FilesetResolver.forVisionTasks(
        "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm"
      )
      poseLandmarker.current = await PoseLandmarker.createFromOptions(vision, {
        baseOptions: {
          modelAssetPath: `https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task`,
          delegate: "GPU"
        },
        runningMode: "VIDEO",
        numPoses: 1
      })
      setIsLoaded(true)
    }
    initDetection()
  }, [])

  useEffect(() => {
    let animationFrameId: number

    const detect = async () => {
      if (
        isOpen &&
        isLoaded &&
        webcamRef.current &&
        webcamRef.current.video &&
        poseLandmarker.current
      ) {
        const video = webcamRef.current.video
        
        // Browsers might pause video in the background/minimized. Force play.
        if (video.paused && video.readyState === 4) {
          video.play().catch(() => {})
        }

        if (video.readyState === 4) {
          const startTimeMs = performance.now()
          const results = await poseLandmarker.current.detectForVideo(video, startTimeMs)

          if (results.landmarks && results.landmarks.length > 0) {
            const nose = results.landmarks[0][0] // Nose is landmark 0
            
            // Map 0-1 range to roughly -5 to 5 for Three.js world space
            const targetX = (1 - nose.x - 0.5) * 10 
            const targetY = (0.5 - nose.y) * 10
            
            const scaleFactor = Math.max(0.4, Math.min(2.0, 1.0 - (nose.z * 2)))

            if (window !== undefined) {
              (window as any).humanTarget = { 
                x: targetX, 
                y: targetY, 
                scale: scaleFactor,
                active: true 
              }
            }
          } else {
            if (window !== undefined) {
              (window as any).humanTarget.active = false
            }
          }
        }
      }
      animationFrameId = requestAnimationFrame(detect)
    }

    if (isOpen) {
      detect()
    }

    return () => {
      cancelAnimationFrame(animationFrameId)
    }
  }, [isOpen, isLoaded])

  return (
    <div className="webcam-container">
      {!isOpen && (
        <button 
          className="webcam-toggle-btn"
          onClick={() => setIsOpen(true)}
        >
          {isLoaded ? "Activate Human Tracking" : "Loading AI..."}
        </button>
      )}

      {isOpen && (
        <div className={`webcam-pip ${isMinimized ? 'minimized' : ''}`}>
          <div className="webcam-header">
            <div className="status-indicator">
              <span className="dot"></span>
              <span>Tracking {isMinimized ? '' : 'Active'}</span>
            </div>
            <div className="header-actions">
              <button 
                className="action-btn" 
                onClick={() => setIsMinimized(!isMinimized)}
                title={isMinimized ? "Expand" : "Minimize"}
              >
                {isMinimized ? (
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 3 21 3 21 9"></polyline><polyline points="9 21 3 21 3 15"></polyline><line x1="21" y1="3" x2="14" y2="10"></line><line x1="3" y1="21" x2="10" y2="14"></line></svg>
                ) : (
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="4 14 10 14 10 20"></polyline><polyline points="20 10 14 10 14 4"></polyline><line x1="14" y1="10" x2="21" y2="3"></line><line x1="3" y1="21" x2="10" y2="14"></line></svg>
                )}
              </button>
              <button 
                className="action-btn close" 
                onClick={() => {
                  setIsOpen(false)
                  setIsMinimized(false)
                }}
                title="Close"
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
              </button>
            </div>
          </div>
          
          <div className="webcam-view-wrapper" style={{ 
            opacity: isMinimized ? 0.001 : 1,
            height: isMinimized ? '2px' : 'auto',
            overflow: 'hidden',
            pointerEvents: isMinimized ? 'none' : 'auto',
            transition: 'opacity 0.3s ease, height 0.3s ease',
            background: '#000'
          }}>
            <Webcam
              ref={webcamRef}
              mirrored={true}
              className="webcam-video"
              audio={false}
              muted={true}
              // @ts-ignore
              playsInline
              videoConstraints={{
                width: 640,
                height: 480,
                facingMode: "user",
              }}
              onUserMedia={() => console.log("Webcam Stream Active")}
              onUserMediaError={(err) => console.error("Webcam Error:", err)}
            />
            <div className="webcam-status" style={{ display: isMinimized ? 'none' : 'block' }}>
              {isLoaded ? "Scanning for humans..." : "Initializing AI..."}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
