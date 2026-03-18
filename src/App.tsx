import { Canvas, useThree, useFrame } from '@react-three/fiber'
import { OrbitControls, Environment, ContactShadows } from '@react-three/drei'
import { HandModel } from './components/HandModel'
import { WebcamTracker } from './components/WebcamTracker'
import React from 'react'
import * as THREE from 'three'
import './App.css'

function SceneController({ isTracking }: { isTracking: boolean }) {
  const { camera, controls } = useThree() as any
  const homePos = React.useMemo(() => new THREE.Vector3(0, 0, 15), [])
  const homeTarget = React.useMemo(() => new THREE.Vector3(0, 0, 0), [])

  useFrame(() => {
    if (isTracking && controls) {
      // Smoothly interpolate camera position back to front
      camera.position.lerp(homePos, 0.1)
      // Smoothly interpolate orbit target back to origin
      controls.target.lerp(homeTarget, 0.1)
      
      // Ensure the camera maintains focus during transition
      camera.lookAt(controls.target)
      controls.update()
    }
  })

  return <OrbitControls makeDefault enabled={!isTracking} />
}

function App() {
  const [isTracking, setIsTracking] = React.useState(false)

  return (
    <div className="app-container">
      <div className="ui-container">
        <h1>Hand Expression</h1>
        <p>3D Interactive Tracker</p>
      </div>

      <Canvas shadows camera={{ position: [0, 0, 15], fov: 35 }}>
        <color attach="background" args={['#0a0a0a']} />
        
        <ambientLight intensity={0.4} />
        <spotLight position={[10, 10, 10]} angle={0.15} penumbra={1} intensity={2} castShadow />
        <pointLight position={[-10, -10, -10]} intensity={1} color="#4444ff" />
        
        <React.Suspense fallback={null}>
          <group position={[0, -1, 0]}>
            <HandModel />
            <ContactShadows 
              opacity={0.4} 
              scale={10} 
              blur={2} 
              far={4} 
              resolution={256} 
              color="#000000" 
            />
          </group>
          <Environment preset="city" />
        </React.Suspense>
        
        <SceneController isTracking={isTracking} />
      </Canvas>

      <div className="instructions">
        {isTracking 
          ? "AI Tracking Active • Move to interact" 
          : "Rotate to explore • Zoom to inspect • Activate AI for tracking"}
      </div>

      <WebcamTracker onStatusChange={setIsTracking} />
    </div>
  )
}

export default App
