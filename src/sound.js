// src/sound.js

export const playNotificationSound = () => {
  try {
    const audioContext = new (window.AudioContext || window.webkitAudioContext)()
    const oscillator = audioContext.createOscillator()
    const gainNode = audioContext.createGain()
    
    oscillator.connect(gainNode)
    gainNode.connect(audioContext.destination)
    
    oscillator.frequency.value = 880
    gainNode.gain.value = 0.3
    
    oscillator.start()
    gainNode.gain.exponentialRampToValueAtTime(0.00001, audioContext.currentTime + 0.3)
    
    setTimeout(() => {
      audioContext.close()
    }, 300)
  } catch (error) {
    console.log('Error playing sound:', error)
  }
}