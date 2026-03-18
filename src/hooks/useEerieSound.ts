import { useRef, useEffect } from 'react'

export function useEerieSound(active: boolean, intensity: number) {
  const audioCtxRef = useRef<AudioContext | null>(null)
  const oscRef = useRef<OscillatorNode | null>(null)
  const gainRef = useRef<GainNode | null>(null)
  const lfoRef = useRef<OscillatorNode | null>(null)
  const lfoGainRef = useRef<GainNode | null>(null)
  const filterRef = useRef<BiquadFilterNode | null>(null)

  useEffect(() => {
    const initAudio = () => {
      if (audioCtxRef.current) return

      try {
        const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext
        const ctx = new AudioContextClass()
        audioCtxRef.current = ctx

        // Main Oscillator (Carrier)
        const osc = ctx.createOscillator()
        osc.type = 'sawtooth'
        osc.frequency.setValueAtTime(40, ctx.currentTime)
        
        // Filter for ghostly vibe
        const filter = ctx.createBiquadFilter()
        filter.type = 'lowpass'
        filter.frequency.setValueAtTime(400, ctx.currentTime)
        filter.Q.setValueAtTime(15, ctx.currentTime)

        // LFO for pitch modulation
        const lfo = ctx.createOscillator()
        lfo.type = 'sine'
        lfo.frequency.setValueAtTime(5, ctx.currentTime)
        
        const lfoGain = ctx.createGain()
        lfoGain.gain.setValueAtTime(2, ctx.currentTime)
        
        const gain = ctx.createGain()
        gain.gain.setValueAtTime(0, ctx.currentTime)

        lfo.connect(lfoGain)
        lfoGain.connect(osc.frequency)
        
        osc.connect(filter)
        filter.connect(gain)
        gain.connect(ctx.destination)

        osc.start()
        lfo.start()

        oscRef.current = osc
        gainRef.current = gain
        lfoRef.current = lfo
        lfoGainRef.current = lfoGain
        filterRef.current = filter
        
        console.log("Audio Context Initialized")
      } catch (e) {
        console.error("Failed to init audio:", e)
      }
    }

    const handleInteraction = () => {
      initAudio()
      if (audioCtxRef.current?.state === 'suspended') {
        audioCtxRef.current.resume().then(() => {
          console.log("Audio Context Resumed")
        })
      }
    }

    // Add listeners immediately to capture the first user interaction
    window.addEventListener('mousedown', handleInteraction)
    window.addEventListener('keydown', handleInteraction)
    window.addEventListener('touchstart', handleInteraction)

    return () => {
      window.removeEventListener('mousedown', handleInteraction)
      window.removeEventListener('keydown', handleInteraction)
      window.removeEventListener('touchstart', handleInteraction)
    }
  }, []) // Remove [active] dependency to ensure listeners are always active

  useEffect(() => {
    if (!gainRef.current || !oscRef.current || !filterRef.current || !lfoRef.current || !lfoGainRef.current) return

    const ctx = audioCtxRef.current!
    
    // Add a base drone volume (0.02) even when intensity is 0, as long as it's active
    const baseVolume = active ? 0.02 : 0
    const movementVolume = active ? intensity * 0.15 : 0
    const targetGain = Math.min(0.2, baseVolume + movementVolume)
    
    const targetFreq = 40 + intensity * 200
    const targetFilter = 200 + intensity * 1500
    const targetLFO = 2 + intensity * 15

    // Fast response but smooth transitions
    gainRef.current.gain.setTargetAtTime(targetGain, ctx.currentTime, 0.05)
    oscRef.current.frequency.setTargetAtTime(targetFreq, ctx.currentTime, 0.05)
    filterRef.current.frequency.setTargetAtTime(targetFilter, ctx.currentTime, 0.05)
    lfoRef.current.frequency.setTargetAtTime(targetLFO, ctx.currentTime, 0.05)
    lfoGainRef.current.gain.setTargetAtTime(targetFreq * 0.25, ctx.currentTime, 0.05)

  }, [active, intensity])

  return null
}
