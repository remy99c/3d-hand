import React, { useRef, useEffect, useState } from 'react'
import Webcam from 'react-webcam'
import { PoseLandmarker, FilesetResolver } from '@mediapipe/tasks-vision'

// Global target for the hand to point to
if (typeof window !== 'undefined') {
  (window as any).humanTarget = { x: 0, y: 0, active: false }
}

export function WebcamTracker({ onStatusChange }: { onStatusChange: (active: boolean) => void }) {
  const webcamRef = useRef<Webcam>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [isOpen, setIsOpen] = useState(false)
  const [isMinimized, setIsMinimized] = useState(false)
  const [isLoaded, setIsLoaded] = useState(false)
  const [showHighlights, setShowHighlights] = useState(false)
  const [hasError, setHasError] = useState(false)
  const [humanCount, setHumanCount] = useState(0)
  const poseLandmarker = useRef<PoseLandmarker | null>(null)

  useEffect(() => {
    onStatusChange(isOpen)
  }, [isOpen, onStatusChange])

  useEffect(() => {
    async function initDetection() {
      try {
        const vision = await FilesetResolver.forVisionTasks(
          "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.32/wasm"
        )
        poseLandmarker.current = await PoseLandmarker.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath: `https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_full/float16/1/pose_landmarker_full.task`,
            delegate: "GPU"
          },
          runningMode: "VIDEO",
          numPoses: 10, // 10 is enough and more stable than 20
          minPoseDetectionConfidence: 0.5,
          minPosePresenceConfidence: 0.5,
          minTrackingConfidence: 0.5
        })
        setIsLoaded(true)
      } catch (err) {
        console.error("Failed to initialize AI Landmarker:", err)
        setHasError(true)
      }
    }
    initDetection()
  }, [])

  const drawOverlay = (allLandmarks: any[][], focusedIndex: number) => {
    const canvas = canvasRef.current
    if (!canvas || !webcamRef.current?.video) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const video = webcamRef.current.video
    if (canvas.width !== video.videoWidth || canvas.height !== video.videoHeight) {
      canvas.width = video.videoWidth
      canvas.height = video.videoHeight
    }

    ctx.clearRect(0, 0, canvas.width, canvas.height)
    
    if (!allLandmarks || allLandmarks.length === 0) return

    allLandmarks.forEach((landmarks, lIdx) => {
      const isFocused = lIdx === focusedIndex
      const color = isFocused ? '#ff4444' : '#ff8800' // Red for focused, Orange for others
      const points = landmarks
      
      // Draw stylized dots for key points
      ctx.fillStyle = color
      ctx.shadowBlur = isFocused ? 15 : 5
      ctx.shadowColor = color
      
      const keyIndices = [0, 11, 12, 13, 14, 15, 16, 23, 24]
      
      keyIndices.forEach(idx => {
        const p = points[idx]
        if (p && p.visibility > 0.5) {
          ctx.beginPath()
          ctx.arc(p.x * canvas.width, p.y * canvas.height, 4, 0, Math.PI * 2)
          ctx.fill()
        }
      })

      // Draw stylized head target for the focused one
      if (isFocused) {
        const nose = points[0]
        if (nose && nose.visibility > 0.8) {
          const nx = nose.x * canvas.width
          const ny = nose.y * canvas.height
          
          ctx.strokeStyle = color
          ctx.lineWidth = 2
          ctx.setLineDash([5, 10])
          
          ctx.beginPath()
          ctx.arc(nx, ny, 40, 0, Math.PI * 2)
          ctx.stroke()
          
          ctx.setLineDash([])
          ctx.beginPath()
          ctx.moveTo(nx - 10, ny)
          ctx.lineTo(nx + 10, ny)
          ctx.moveTo(nx, ny - 10)
          ctx.lineTo(nx, ny + 10)
          ctx.stroke()
        }
      }
    })
  }

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
            // Find the closest human (lowest average Z of key points)
            let focusedIdx = 0
            if (results.landmarks.length > 1) {
              let minZ = Infinity
              results.landmarks.forEach((landmarks, idx) => {
                const nose = landmarks[0]
                if (nose && nose.z < minZ) {
                  minZ = nose.z
                  focusedIdx = idx
                }
              })
            }

            if (showHighlights) {
              drawOverlay(results.landmarks, focusedIdx)
            } else {
              const canvas = canvasRef.current
              if (canvas) {
                const ctx = canvas.getContext('2d')
                ctx?.clearRect(0, 0, canvas.width, canvas.height)
              }
            }

            const focusedPerson = results.landmarks[focusedIdx]
            const nose = focusedPerson[0]
            
            // Map 0-1 range to roughly -5 to 5 for Three.js world space
            const targetX = (1 - nose.x - 0.5) * 10 
            const targetY = (0.5 - nose.y) * 10
            
            // Depth/Scale
            const scaleFactor = Math.max(0.4, Math.min(2.0, 1.0 - (nose.z * 2)))

            if (typeof window !== 'undefined') {
              (window as any).humanTarget = { 
                x: targetX, 
                y: targetY, 
                scale: scaleFactor,
                active: true,
                count: results.landmarks.length 
              };
            }
            setHumanCount(prev => prev !== results.landmarks.length ? results.landmarks.length : prev);
          } else {
            const canvas = canvasRef.current
            if (canvas) {
              const ctx = canvas.getContext('2d')
              ctx?.clearRect(0, 0, canvas.width, canvas.height);
            }
            if (typeof window !== 'undefined') {
              (window as any).humanTarget.active = false;
              (window as any).humanTarget.count = 0;
            }
            setHumanCount(prev => prev !== 0 ? 0 : prev);
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
  }, [isOpen, isLoaded, showHighlights])

  return (
    <div className="webcam-container">
      {!isOpen && (
        <button 
          className={`webcam-toggle-btn ${hasError ? 'error' : ''}`}
          onClick={() => { if (!hasError) setIsOpen(true); }}
          style={hasError ? { background: 'rgba(255, 68, 68, 0.2)', color: '#ff4444', borderColor: '#ff4444' } : {}}
        >
          {hasError ? "AI Error - Try Refreshing" : (isLoaded ? "Activate Human Tracking" : "Loading AI Engine...")}
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
                className={`action-btn ${showHighlights ? 'active' : ''}`}
                onClick={() => setShowHighlights(!showHighlights)}
                title={showHighlights ? "Hide Highlights" : "Show Highlights"}
                style={{ color: showHighlights ? '#00ff88' : 'inherit' }}
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                  <circle cx="12" cy="12" r="3"></circle>
                </svg>
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
            background: '#000',
            position: 'relative'
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
            <canvas 
              ref={canvasRef}
              className="webcam-overlay"
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                transform: 'scaleX(-1)', // Mirror the canvas to match Webcam
                pointerEvents: 'none'
              }}
            />
            <div className="webcam-status" style={{ display: isMinimized ? 'none' : 'block' }}>
              {hasError ? (
                <span style={{ color: '#ff4444' }}>Error loading AI engine. Please refresh.</span>
              ) : (
                isLoaded ? (
                  (humanCount > 0) ? (
                    <span style={{ color: '#ff4444', fontWeight: 'bold', textTransform: 'uppercase' }}>
                      {humanCount} {humanCount === 1 ? 'HUMAN' : 'HUMANS'} FOUND
                    </span>
                  ) : (
                    "scanning for humans..."
                  )
                ) : "Initializing AI..."
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
