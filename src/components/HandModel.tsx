import { useLoader, useFrame } from '@react-three/fiber'
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader'
import { useRef, useEffect, useState } from 'react'
import * as THREE from 'three'
import { useEerieSound } from '../hooks/useEerieSound'

export function HandModel() {
  const obj = useLoader(OBJLoader, '/LowPolyMiddleFinger.obj')
  const groupRef = useRef<THREE.Group>(null)
  const targetPos = new THREE.Vector3()
  const lastQuaternion = useRef(new THREE.Quaternion())
  const lastScale = useRef(1)
  const [intensity, setIntensity] = useState(0)

  // Use the eerie sound hook
  useEerieSound(typeof window !== 'undefined' && (window as any).humanTarget?.active, intensity)

  // Use a premium-looking material
  const material = new THREE.MeshPhysicalMaterial({
    color: '#d4d4d4',
    metalness: 0.9,
    roughness: 0.1,
    clearcoat: 1.0,
    clearcoatRoughness: 0.05,
    reflectivity: 1.0,
    envMapIntensity: 1.5
  })

  // Apply material and center geometry once
  useEffect(() => {
    obj.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        child.material = material
        child.castShadow = true
        child.receiveShadow = true
        child.geometry.center()
      }
    })
  }, [obj])

  useFrame((state) => {
    if (!groupRef.current) return

    // Ensure the target object exists on window
    if (typeof window !== 'undefined' && !(window as any).humanTarget) {
      (window as any).humanTarget = { x: 0, y: 0, scale: 1, active: false }
    }

    const target = (window as any).humanTarget
    let currentIntensity = 0
    
    if (target && target.active) {
      // Smoothly interpolate to the human position on the camera plane
      targetPos.set(target.x, target.y, 5) 

      // Create a temporary object to calculate lookAt
      const dummy = new THREE.Object3D()
      dummy.position.set(0, 0, 0)
      dummy.lookAt(targetPos)
      
      // Smoothly rotate towards the target
      groupRef.current.quaternion.slerp(dummy.quaternion, 0.08)

      // Apply dynamic Scale
      const s = target.scale || 1
      groupRef.current.scale.lerp(new THREE.Vector3(s, s, s), 0.1)

      // Calculate intensity based on angular change and scale change
      const angleChange = groupRef.current.quaternion.angleTo(lastQuaternion.current)
      const scaleChange = Math.abs(s - lastScale.current)
      
      // Normalize and smooth the intensity
      currentIntensity = (angleChange * 5) + (scaleChange * 2)
      
      lastQuaternion.current.copy(groupRef.current.quaternion)
      lastScale.current = s
    } else {
      // RETURN TO STATIC: Point towards the camera (Z+)
      groupRef.current.quaternion.slerp(new THREE.Quaternion(), 0.05)
      groupRef.current.scale.lerp(new THREE.Vector3(1, 1, 1), 0.05)
      
      currentIntensity = 0
    }

    // Dampen the intensity to avoid jittery audio
    setIntensity(prev => THREE.MathUtils.lerp(prev, Math.min(1, currentIntensity), 0.1))
  })

  return (
    <group ref={groupRef}>
      <primitive 
        object={obj} 
        rotation={[-Math.PI / 2, 0, 0]}
        scale={0.04}
      />
    </group>
  )
}
