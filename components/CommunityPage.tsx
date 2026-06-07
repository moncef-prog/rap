'use client'

import { useState, useEffect } from 'react'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { useRouter } from 'next/navigation'
import type { Rapper, Post, Comment } from '@/types'

const supabase = createSupabaseClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

const categoryColors: Record<string, string> = {
  new_gen: '#00ff87', mainstream: '#E63946', old_school: '#3b82f6', underground: '#a855f7',
}

const postTypeIcons: Record<string, string> = {
  text: '💬', image: '📸', announcement: '📢', poll: '📊', challenge: '🎯',
}

export default function CommunityPage({ rapper, posts, followersCount }: { rapper: Rapper, posts: Post[], followersCount: number }) {
  const router = useRouter()
  const [user, setUser] = useState<{ id: string } | null>(null)
  const [isFollowing, setIsFollowing] = useState(false)
  const [followers, setFollowers] = useState(followersCount)
  const [activePost, setActivePost] = useState<Post | null>(null)
  const [comments, setComments] = useState<Comment[]>([])
  const [newComment, setNewComment] = useState('')
  const [loadingFollow, setLoadingFollow] = useState(false)
  const [postingComment, setPostingComment] = useState(false)
  const [pollVotes, setPollVotes] = useState<Record<string, number>>({})
  const [userVotes, setUserVotes] = useState<Record<string, number>>({})
  const color = categoryColors[rapper.category] ?? '#E63946'

  const checkFollow = async (userId: string) => {
    const { data } = await supabase.from('follows').select('id').eq('user_id', userId).eq('rapper_id', rapper.id).single()
    setIsFollowing(!!data)
  }

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user)
      if (data.user) checkFollow(data.user.id)
    })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const toggleFollow = async () => {
    if (!user) { router.push('/'); return }
    setLoadingFollow(true)
    if (isFollowing) {
      await supabase.from('follows').delete().eq('user_id', user.id).eq('rapper_id', rapper.id)
      setIsFollowing(false)
      setFollowers(f => f - 1)
    } else {
      await supabase.from('follows').insert({ user_id: user.id, rapper_id: rapper.id })
      setIsFollowing(true)
      setFollowers(f => f + 1)
    }
    setLoadingFollow(false)
  }

  const openPost = async (post: Post) => {
    setActivePost(post)
    const { data } = await supabase.from('community_comments').select('*, profiles(username)').eq('post_id', post.id).order('created_at', { ascending: true })
    setComments(data ?? [])

    if (post.type === 'poll' && post.poll_options) {
      const { data: votes } = await supabase.from('poll_votes').select('option_index').eq('post_id', post.id)
      const counts: Record<string, number> = {}
      votes?.forEach(v => { counts[v.option_index] = (counts[v.option_index] ?? 0) + 1 })
      setPollVotes(counts)
      if (user) {
        const { data: myVote } = await supabase.from('poll_votes').select('option_index').eq('post_id', post.id).eq('user_id', user.id).single()
        if (myVote) setUserVotes({ [post.id]: myVote.option_index })
      }
    }
  }

  const submitComment = async () => {
    if (!user || !newComment.trim() || !activePost) return
    setPostingComment(true)
    await supabase.from('community_comments').insert({ post_id: activePost.id, user_id: user.id, content: newComment })
    setNewComment('')
    const { data } = await supabase.from('community_comments').select('*, profiles(username)').eq('post_id', activePost.id).order('created_at', { ascending: true })
    setComments(data ?? [])
    setPostingComment(false)
  }

  const vote = async (postId: string, optionIndex: number) => {
    if (!user || userVotes[postId] !== undefined) return
    await supabase.from('poll_votes').insert({ post_id: postId, user_id: user.id, option_index: optionIndex })
    setUserVotes(prev => ({ ...prev, [postId]: optionIndex }))
    setPollVotes(prev => ({ ...prev, [optionIndex]: (prev[optionIndex] ?? 0) + 1 }))
  }

  const react = async (postId: string) => {
    if (!user) return
    await supabase.from('community_reactions').upsert({ post_id: postId, user_id: user.id, emoji: '🔥' })
  }

  return (
    <div style={{ minHeight: '100vh', background: '#060606', color: 'white', paddingTop: '60px' }}>

      {/* Header bannière */}
      <div style={{
        background: `linear-gradient(180deg, ${color}22 0%, transparent 100%)`,
        borderBottom: `1px solid ${color}33`,
        padding: '32px 24px',
      }}>
        <div style={{ maxWidth: '800px', margin: '0 auto', display: 'flex', alignItems: 'center', gap: '24px' }}>
          <div style={{
            width: 80, height: 80, borderRadius: '50%', overflow: 'hidden', flexShrink: 0,
            border: `3px solid ${color}`, boxShadow: `0 0 24px ${color}66`,
          }}>
            {rapper.profile_image_url
              ? <img src={rapper.profile_image_url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              : <div style={{ width: '100%', height: '100%', background: color + '33', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 32 }}>🎤</div>
            }
          </div>

          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '6px' }}>
              <h1 style={{ fontSize: '28px', fontWeight: 900 }}>{rapper.name}</h1>
              <span style={{ fontSize: '11px', color, background: color + '22', padding: '3px 10px', borderRadius: '20px', border: `1px solid ${color}44` }}>
                {rapper.category.replace('_', ' ').toUpperCase()}
              </span>
            </div>
            <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.5)', marginBottom: '12px' }}>
              📍 {rapper.city} · {rapper.short_bio}
            </p>
            <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
              <span style={{ fontSize: '14px', color: 'rgba(255,255,255,0.5)' }}>
                <span style={{ fontWeight: 800, color: 'white' }}>{followers}</span> abonnés
              </span>
              <span style={{ fontSize: '14px', color: 'rgba(255,255,255,0.5)' }}>
                <span style={{ fontWeight: 800, color: 'white' }}>{posts.length}</span> posts
              </span>
            </div>
          </div>

          <button onClick={toggleFollow} disabled={loadingFollow} style={{
            padding: '12px 24px', borderRadius: '12px', border: 'none', cursor: 'pointer',
            fontWeight: 800, fontSize: '14px', transition: 'all 0.2s',
            background: isFollowing ? 'rgba(255,255,255,0.06)' : '#E63946',
            color: isFollowing ? 'rgba(255,255,255,0.6)' : 'white',
            boxShadow: isFollowing ? 'none' : '0 4px 20px rgba(230,57,70,0.3)',
          }}>
            {loadingFollow ? '...' : isFollowing ? '✓ Abonné' : '+ Suivre'}
          </button>
        </div>
      </div>

      <div style={{ maxWidth: '800px', margin: '0 auto', padding: '24px' }}>

        {posts.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '80px 0', color: 'rgba(255,255,255,0.3)' }}>
            <p style={{ fontSize: '48px', marginBottom: '16px' }}>🎤</p>
            <p style={{ fontSize: '18px', fontWeight: 700, marginBottom: '8px' }}>Aucun post pour l&apos;instant</p>
            <p style={{ fontSize: '14px' }}>La communauté de {rapper.name} est en train de se construire</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {posts.map(post => (
              <div key={post.id} style={{
                background: 'rgba(255,255,255,0.03)',
                border: `1px solid ${post.is_pinned ? color + '44' : 'rgba(255,255,255,0.07)'}`,
                borderRadius: '16px', overflow: 'hidden',
                boxShadow: post.is_pinned ? `0 0 20px ${color}11` : 'none',
              }}>
                {/* Header post */}
                <div style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                  {post.is_pinned && (
                    <span style={{ fontSize: '11px', color, background: color + '22', padding: '2px 8px', borderRadius: '20px', marginRight: '4px' }}>📌 Épinglé</span>
                  )}
                  <span style={{ fontSize: '20px' }}>{postTypeIcons[post.type] ?? '💬'}</span>
                  <div style={{ flex: 1 }}>
                    <span style={{ fontWeight: 700, fontSize: '14px' }}>{post.profiles?.username ?? rapper.name}</span>
                    <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.3)', marginLeft: '8px' }}>
                      {new Date(post.created_at).toLocaleDateString('fr-FR')}
                    </span>
                  </div>
                  {post.type === 'announcement' && (
                    <span style={{ fontSize: '11px', color: '#ffd700', background: 'rgba(255,215,0,0.1)', padding: '2px 8px', borderRadius: '20px', border: '1px solid rgba(255,215,0,0.2)' }}>📢 Annonce</span>
                  )}
                  {post.type === 'challenge' && (
                    <span style={{ fontSize: '11px', color: '#00ff87', background: 'rgba(0,255,135,0.1)', padding: '2px 8px', borderRadius: '20px', border: '1px solid rgba(0,255,135,0.2)' }}>
                      🎯 {post.challenge_reward} 💊
                    </span>
                  )}
                </div>

                {/* Contenu */}
                <div style={{ padding: '0 20px 16px' }}>
                  <p style={{ fontSize: '15px', lineHeight: 1.7, color: 'rgba(255,255,255,0.85)' }}>{post.content}</p>

                  {post.image_url && (
                    <img src={post.image_url} style={{ width: '100%', borderRadius: '12px', marginTop: '12px', maxHeight: '400px', objectFit: 'cover' }} />
                  )}

                  {/* Sondage */}
                  {post.type === 'poll' && post.poll_options && (
                    <div style={{ marginTop: '14px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {(Array.isArray(post.poll_options) ? post.poll_options : JSON.parse(post.poll_options as string) as string[]).map((option, idx) => {
                        const totalVotes = Object.values(pollVotes).reduce((a, b) => a + b, 0)
                        const voteCount = pollVotes[idx] ?? 0
                        const pct = totalVotes > 0 ? Math.round((voteCount / totalVotes) * 100) : 0
                        const voted = userVotes[post.id] === idx
                        return (
                          <div key={idx} onClick={() => vote(post.id, idx)}
                            style={{
                              padding: '10px 14px', borderRadius: '10px', cursor: 'pointer',
                              border: `1px solid ${voted ? color : 'rgba(255,255,255,0.08)'}`,
                              background: voted ? color + '22' : 'rgba(255,255,255,0.02)',
                              position: 'relative', overflow: 'hidden',
                            }}>
                            <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: pct + '%', background: color + '15', transition: 'width 0.3s' }} />
                            <div style={{ position: 'relative', display: 'flex', justifyContent: 'space-between' }}>
                              <span style={{ fontSize: '14px', fontWeight: 600 }}>{option}</span>
                              <span style={{ fontSize: '13px', color: 'rgba(255,255,255,0.5)' }}>{pct}%</span>
                            </div>
                          </div>
                        )
                      })}
                      <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.3)', marginTop: '4px' }}>
                        {Object.values(pollVotes).reduce((a, b) => a + b, 0)} votes
                      </p>
                    </div>
                  )}

                  {/* Challenge */}
                  {post.type === 'challenge' && post.challenge_condition && (
                    <div style={{ marginTop: '12px', padding: '12px 14px', borderRadius: '10px', background: 'rgba(0,255,135,0.05)', border: '1px solid rgba(0,255,135,0.15)' }}>
                      <p style={{ fontSize: '13px', color: '#00ff87', fontWeight: 600 }}>🎯 Condition : {post.challenge_condition}</p>
                      <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)', marginTop: '4px' }}>Récompense : {post.challenge_reward} 💊 Rivo</p>
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div style={{ padding: '12px 20px', borderTop: '1px solid rgba(255,255,255,0.05)', display: 'flex', gap: '16px' }}>
                  <button onClick={() => react(post.id)} style={{
                    background: 'transparent', border: 'none', color: 'rgba(255,255,255,0.4)',
                    cursor: 'pointer', fontSize: '13px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px',
                  }}>
                    🔥 {post.community_reactions?.[0]?.count ?? 0}
                  </button>
                  <button onClick={() => openPost(post)} style={{
                    background: 'transparent', border: 'none', color: 'rgba(255,255,255,0.4)',
                    cursor: 'pointer', fontSize: '13px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px',
                  }}>
                    💬 {post.community_comments?.[0]?.count ?? 0} commentaires
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal commentaires */}
      {activePost && (
        <div onClick={(e) => e.target === e.currentTarget && setActivePost(null)}
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)', zIndex: 2000, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
          <div style={{
            width: '100%', maxWidth: '600px', maxHeight: '80vh',
            background: '#0d0d0d', borderRadius: '20px 20px 0 0',
            border: '1px solid rgba(255,255,255,0.08)', display: 'flex', flexDirection: 'column',
          }}>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ fontSize: '16px', fontWeight: 700 }}>Commentaires</h3>
              <button onClick={() => setActivePost(null)} style={{ background: 'rgba(255,255,255,0.06)', border: 'none', color: 'white', width: 28, height: 28, borderRadius: '50%', cursor: 'pointer' }}>✕</button>
            </div>

            <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {comments.length === 0 ? (
                <p style={{ textAlign: 'center', color: 'rgba(255,255,255,0.3)', padding: '32px' }}>Aucun commentaire — sois le premier !</p>
              ) : (
                comments.map(comment => (
                  <div key={comment.id} style={{ display: 'flex', gap: '10px' }}>
                    <div style={{ width: 32, height: 32, borderRadius: '50%', background: '#E63946', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 900, flexShrink: 0 }}>
                      {comment.profiles?.username?.[0]?.toUpperCase()}
                    </div>
                    <div style={{ flex: 1, background: 'rgba(255,255,255,0.04)', borderRadius: '12px', padding: '10px 14px' }}>
                      <p style={{ fontSize: '12px', fontWeight: 700, color: '#E63946', marginBottom: '4px' }}>{comment.profiles?.username}</p>
                      <p style={{ fontSize: '14px', color: 'rgba(255,255,255,0.8)' }}>{comment.content}</p>
                    </div>
                  </div>
                ))
              )}
            </div>

            {isFollowing ? (
              <div style={{ padding: '16px 20px', borderTop: '1px solid rgba(255,255,255,0.06)', display: 'flex', gap: '10px' }}>
                <input value={newComment} onChange={e => setNewComment(e.target.value)}
                  placeholder="Écris un commentaire..."
                  onKeyDown={e => e.key === 'Enter' && submitComment()}
                  style={{ flex: 1, padding: '12px 16px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.04)', color: 'white', fontSize: '14px', outline: 'none' }}
                />
                <button onClick={submitComment} disabled={postingComment || !newComment.trim()} style={{
                  padding: '12px 20px', borderRadius: '12px', border: 'none',
                  background: '#E63946', color: 'white', fontWeight: 700, cursor: 'pointer', fontSize: '14px',
                }}>
                  {postingComment ? '...' : 'Envoyer'}
                </button>
              </div>
            ) : (
              <div style={{ padding: '16px 20px', borderTop: '1px solid rgba(255,255,255,0.06)', textAlign: 'center' }}>
                <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.4)' }}>Abonne-toi pour commenter 👆</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}