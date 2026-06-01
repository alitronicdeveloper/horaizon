// src/components/Reviews.jsx
import { useState, useEffect } from 'react'
import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || ""
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || ""
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

export const Reviews = ({ productId, isLoggedIn, customerId, customerName }) => {
  const [reviews, setReviews] = useState([])
  const [rating, setRating] = useState(5)
  const [comment, setComment] = useState('')
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    fetchReviews()
  }, [productId])

  const fetchReviews = async () => {
    try {
      const { data } = await supabase
        .from('reviews')
        .select('*')
        .eq('product_id', productId)
        .order('created_at', { ascending: false })
      if (data) setReviews(data)
    } catch (error) {
      console.error('Error fetching reviews:', error)
    } finally {
      setLoading(false)
    }
  }

  const submitReview = async () => {
    if (!comment.trim()) return
    setSubmitting(true)
    
    try {
      const { error } = await supabase.from('reviews').insert([{
        product_id: productId,
        customer_id: customerId,
        customer_name: customerName,
        rating: rating,
        comment: comment
      }])
      
      if (!error) {
        setComment('')
        setRating(5)
        fetchReviews()
        alert('✅ Maoni yako yamewekwa!')
      }
    } catch (error) {
      console.error('Error submitting review:', error)
    } finally {
      setSubmitting(false)
    }
  }

  const renderStars = (rate, interactive = false, onChange) => {
    return (
      <div style={{ display: 'flex', gap: '4px' }}>
        {[1, 2, 3, 4, 5].map(star => (
          <span
            key={star}
            onClick={() => interactive && onChange(star)}
            style={{
              fontSize: '24px',
              cursor: interactive ? 'pointer' : 'default',
              color: star <= rate ? '#fbbf24' : '#cbd5e1'
            }}
          >
            ★
          </span>
        ))}
      </div>
    )
  }

  if (loading) return <div style={{ padding: '20px', textAlign: 'center' }}>Loading reviews...</div>

  return (
    <div style={{ marginTop: '30px', padding: '20px', background: '#f8fafc', borderRadius: '16px' }}>
      <h3 style={{ marginBottom: '16px' }}>⭐ Maoni ya Wateja ({reviews.length})</h3>
      
      {isLoggedIn && (
        <div style={{ marginBottom: '24px', padding: '16px', background: 'white', borderRadius: '12px' }}>
          <h4>Andika Maoni Yako</h4>
          <div style={{ marginBottom: '12px' }}>
            <label>Rating:</label>
            {renderStars(rating, true, setRating)}
          </div>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Andika maoni yako kuhusu bidhaa hii..."
            style={{
              width: '100%',
              padding: '12px',
              borderRadius: '8px',
              border: '1px solid #e2e8f0',
              minHeight: '80px',
              marginBottom: '12px'
            }}
          />
          <button
            onClick={submitReview}
            disabled={submitting || !comment.trim()}
            style={{
              padding: '10px 20px',
              background: '#6366f1',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer'
            }}
          >
            {submitting ? 'Inatuma...' : 'Tuma Maoni'}
          </button>
        </div>
      )}
      
      {reviews.length === 0 ? (
        <p style={{ color: '#64748b', textAlign: 'center', padding: '20px' }}>
          Hakuna maoni bado. Kuwa wa kwanza kuacha maoni!
        </p>
      ) : (
        reviews.map(review => (
          <div key={review.id} style={{ marginBottom: '16px', padding: '16px', background: 'white', borderRadius: '12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
              <strong>{review.customer_name}</strong>
              {renderStars(review.rating)}
            </div>
            <p style={{ color: '#475569' }}>{review.comment}</p>
            <small style={{ color: '#94a3b8' }}>
              {new Date(review.created_at).toLocaleDateString('sw-TZ')}
            </small>
          </div>
        ))
      )}
    </div>
  )
}
