// src/components/ShareButton.jsx
import { useState } from 'react'
import { showToast } from '../notifications'

export const ShareButton = ({ product, productName, productPrice, productImage }) => {
  const [showOptions, setShowOptions] = useState(false)

  // URL ya bidhaa
  const productUrl = `${window.location.origin}/products/${product.id}`
  
  // Message ya kushare (ina brand identity)
  const shareMessage = `*🛍️ ${productName}* - Tsh ${productPrice.toLocaleString()}\n\n✨ Tazama bidhaa hii kwenye *Baizona - Chimbo la Machimbo*!\n\n🔗 ${productUrl}\n\n🔥 Pata bidhaa bora kwa bei nafuu. Jisajili leo!`

  // Short message kwa social media
  const socialMessage = `${productName} - Tsh ${productPrice.toLocaleString()}\n\nTazama bidhaa hii kwenye Baizona - Chimbo la Machimbo!\n\n${productUrl}`

  const shareWhatsApp = () => {
    window.open(`https://wa.me/?text=${encodeURIComponent(shareMessage)}`, '_blank')
    showToast('📱 Link imetumwa kwa WhatsApp!', 'success')
    setShowOptions(false)
  }

  const shareFacebook = () => {
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(productUrl)}&quote=${encodeURIComponent(socialMessage)}`, '_blank', 'width=600,height=400')
    showToast('📘 Imesharewa kwenye Facebook!', 'success')
    setShowOptions(false)
  }

  const shareTwitter = () => {
    window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(socialMessage)}`, '_blank', 'width=600,height=400')
    showToast('🐦 Imesharewa kwenye Twitter!', 'success')
    setShowOptions(false)
  }

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(productUrl)
      showToast('🔗 Link imenakiliwa! Shiriki na marafiki zako.', 'success')
    } catch (err) {
      showToast('❌ Imeshindwa kunakili link', 'error')
    }
    setShowOptions(false)
  }

  return (
    <div style={{ position: 'relative' }}>
      {/* Kitufe kikuu cha Share */}
      <button
        onClick={() => setShowOptions(!showOptions)}
        style={{
          background: '#10b981',
          color: 'white',
          border: 'none',
          padding: '10px 16px',
          borderRadius: '8px',
          cursor: 'pointer',
          fontSize: '14px',
          fontWeight: 'bold',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}
      >
        📤 Shiriki Bidhaa
      </button>

      {/* Menu ya machaguo */}
      {showOptions && (
        <div style={{
          position: 'absolute',
          bottom: '100%',
          left: 0,
          marginBottom: '8px',
          background: 'white',
          borderRadius: '12px',
          boxShadow: '0 10px 40px rgba(0,0,0,0.15)',
          border: '1px solid #e2e8f0',
          minWidth: '180px',
          zIndex: 1000,
          overflow: 'hidden'
        }}>
          {/* Header ya brand */}
          <div style={{
            padding: '12px',
            background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
            color: 'white',
            textAlign: 'center',
            fontSize: '12px',
            fontWeight: 'bold'
          }}>
            🏪 Baizona - Chimbo la Machimbo
          </div>

          <button
            onClick={shareWhatsApp}
            style={{
              width: '100%',
              padding: '12px',
              border: 'none',
              background: 'white',
              textAlign: 'left',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              fontSize: '14px',
              borderBottom: '1px solid #f1f5f9'
            }}
            onMouseEnter={(e) => e.target.style.background = '#f1f5f9'}
            onMouseLeave={(e) => e.target.style.background = 'white'}
          >
            <span style={{ fontSize: '20px' }}>📱</span> WhatsApp
          </button>

          <button
            onClick={shareFacebook}
            style={{
              width: '100%',
              padding: '12px',
              border: 'none',
              background: 'white',
              textAlign: 'left',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              fontSize: '14px',
              borderBottom: '1px solid #f1f5f9'
            }}
            onMouseEnter={(e) => e.target.style.background = '#f1f5f9'}
            onMouseLeave={(e) => e.target.style.background = 'white'}
          >
            <span style={{ fontSize: '20px' }}>📘</span> Facebook
          </button>

          <button
            onClick={shareTwitter}
            style={{
              width: '100%',
              padding: '12px',
              border: 'none',
              background: 'white',
              textAlign: 'left',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              fontSize: '14px',
              borderBottom: '1px solid #f1f5f9'
            }}
            onMouseEnter={(e) => e.target.style.background = '#f1f5f9'}
            onMouseLeave={(e) => e.target.style.background = 'white'}
          >
            <span style={{ fontSize: '20px' }}>🐦</span> Twitter (X)
          </button>

          <button
            onClick={copyLink}
            style={{
              width: '100%',
              padding: '12px',
              border: 'none',
              background: 'white',
              textAlign: 'left',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              fontSize: '14px'
            }}
            onMouseEnter={(e) => e.target.style.background = '#f1f5f9'}
            onMouseLeave={(e) => e.target.style.background = 'white'}
          >
            <span style={{ fontSize: '20px' }}>🔗</span> Nakili Link
          </button>

          {/* Footer ya brand */}
          <div style={{
            padding: '8px',
            background: '#f8fafc',
            textAlign: 'center',
            fontSize: '10px',
            color: '#94a3b8',
            borderTop: '1px solid #e2e8f0'
          }}>
            Baizona - Chimbo la Machimbo
          </div>
        </div>
      )}
    </div>
  )
}