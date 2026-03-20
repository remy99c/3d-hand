import { Canvas, useThree, useFrame } from '@react-three/fiber'
import { OrbitControls, Environment, ContactShadows } from '@react-three/drei'
import { HandModel } from './components/HandModel'
import { WebcamTracker } from './components/WebcamTracker'
import { IntroPopup } from './components/IntroPopup'
import React from 'react'
import * as THREE from 'three'
import './App.css'
import { CyclingText } from './components/CyclingText'

const textPairs = [
  { header: "Interact to flip off", subtext: "Activate \"Human tracking\" for autonomouse anger" },
  { header: "Interactúa para insultar", subtext: "Activar \"Human tracking\" para ira autónoma" },
  { header: "Interagir pour faire un doigt", subtext: "Activer \"Human tracking\" pour une colère autonome" },
  { header: "Interagieren, um Mittelfinger zu zeigen", subtext: "\"Human tracking\" für autonomen Zorn aktivieren" },
  { header: "Interagisci per fare il dito medio", subtext: "Attiva \"Human tracking\" per rabbia autonoma" },
  { header: "Interagera för att visa fingret", subtext: "Aktivera \"Human tracking\" för autonom ilska" },
  { header: "Interactie om middelvinger op te steken", subtext: "Activeer \"Human tracking\" voor woede" },
  { header: "インタラクトして中指を立てる", subtext: "\"Human tracking\" を有効にする" },
  { header: "互动以竖中指", subtext: "激活 \"Human tracking\"" },
  { header: "Взаимодействуйте, чтобы послать", subtext: "Активируйте \"Human tracking\"" },
  { header: "تفاعل لرفع الإصبع الأوسط", subtext: "تفعيل \"Human tracking\"" }
];

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
  const [showIntro, setShowIntro] = React.useState(true)

  return (
    <div className="app-container">
      {showIntro && <IntroPopup onEnter={() => setShowIntro(false)} />}
      <div className="ui-container">
        {!showIntro && <CyclingText pairs={textPairs} interval={9000} />}
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
          ? "AI Tracking Active - Move to interact" 
          : "Rotate to explore - Zoom to inspect"}
      </div>

      <WebcamTracker onStatusChange={setIsTracking} />
    </div>
  )
}

export default App
