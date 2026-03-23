'use client'

import { useState, useEffect, useRef } from 'react'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'

const supabase = createSupabaseClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export default function MessagesPage() {
  const [user, setUser] = useState<any>(null)
  const [conversations, setConversations] = useState<any[]>([])
  const [friends, setFriends] = useState<any[]>([])
  const [activeConv, setActiveConv] = useState<any>(null)
  const [messages, setMessages] = useState<any[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [sending, setSending] = useState(false)
  const [tab, setTab] = useState<'messages' | 'friends' | 'new'>('messages')
  const [searchUser, setSearchUser] = useState('')
  const [searchResults, setSearchResults] = useState<any[]>([])
  const [groupName, setGroupName] = useState('')
  const [selectedForGroup, setSelectedForGroup] = useState<any[]>([])
  const [creating, setCreating] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) {
        setUser(data.user)
        loadConversations(data.user.id)
        loadFriends(data.user.id)
      }
    })
  }, [])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const loadConversations = async (userId: string) => {
    const { data } = await supabase
      .from('conversation_members')
      .select('conversations(*, conversation_members(profiles(username, id)))')
      .eq('user_id', userId)
    setConversations(data?.map((d: any) => d.conversations) ?? [])
  }

  const loadFriends = async (userId: string) => {
    const { data } = await supabase
      .from('friendships')
      .select('*, sender:profiles!friendships_sender_id_fkey(id, username), receiver:profiles!friendships_receiver_id_fkey(id, username)')
      .or(`sender_id.eq.${userId},receiver_id.eq.${userId}`)
      .eq('status', 'accepted')
    setFriends(data ?? [])
  }

  const loadMessages = async (convId: string) => {
    const { data } = await supabase
      .from('messages')
      .select('*, profiles(username)')
      .eq('conversation_id', convId)
      .order('created_at', { ascending: true })
    setMessages(data ?? [])
  }

  const openConversation = async (conv: any) => {
    setActiveConv(conv)
    await loadMessages(conv.id)

    // Realtime
    supabase.channel('messages-' + conv.id)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages', filter: `conversation_id=eq.${conv.id}` },
        (payload) => setMessages(prev => [...prev, payload.new])
      ).subscribe()
  }

  const sendMessage = async () => {
    if (!newMessage.trim() || !activeConv || !user) return
    setSending(true)
    await supabase.from('messages').insert({
      conversation_id: activeConv.id,
      sender_id: user.id,
      content: newMessage,
    })
    setNewMessage('')
    setSending(false)
  }

  const searchUsers = async (query: string) => {
    setSearchUser(query)
    if (query.length < 2) { setSearchResults([]); return }
    const { data } = await supabase
      .from('profiles')
      .select('id, username')
      .ilike('username', `%${query}%`)
      .neq('id', user?.id)
      .limit(8)
    setSearchResults(data ?? [])
  }

  const sendFriendRequest = async (receiverId: string) => {
    await supabase.from('friendships').insert({ sender_id: user.id, receiver_id: receiverId, status: 'pending' })
    setSearchResults(prev => prev.filter(u => u.id !== receiverId))
  }

  const acceptFriend = async (friendshipId: string, senderId: string) => {
    await supabase.from('friendships').update({ status: 'accepted' }).eq('id', friendshipId)
    loadFriends(user.id)

    // Créer une conversation privée
    const { data: conv } = await supabase.from('conversations').insert({ type: 'private', created_by: user.id }).select().single()
    if (conv) {
      await supabase.from('conversation_members').insert([
        { conversation_id: conv.id, user_id: user.id },
        { conversation_id: conv.id, user_id: senderId },
      ])
      loadConversations(user.id)
    }
  }

  const createGroup = async () => {
    if (!groupName.trim() || selectedForGroup.length === 0) return
    setCreating(true)
    const { data: conv } = await supabase.from('conversations').insert({ type: 'group', name: groupName, created_by: user.id }).select().single()
    if (conv) {
      await supabase.from('conversation_members').insert([
        { conversation_id: conv.id, user_id: user.id },
        ...selectedForGroup.map(f => ({ conversation_id: conv.id, user_id: f.id }))
      ])
      loadConversations(user.id)
      setTab('messages')
      setGroupName('')
      setSelectedForGroup([])
    }
    setCreating(false)
  }

  const getConvName = (conv: any) => {
    if (conv.type === 'group') return conv.name
    const other = conv.conversation_members?.find((m: any) => m.profiles?.id !== user?.id)
    return other?.profiles?.username ?? 'Conversation'
  }

  const pendingRequests = friends.filter((f: any) => f.receiver_id === user?.id && f.status === 'pending')
  const acceptedFriends = friends.filter((f: any) => f.status === 'accepted')

  if (!user) return (
    <div style={{ minHeight: '100vh', background: '#060606', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(255,255,255,0.4)' }}>
      Connecte-toi pour accéder aux messages
    </div>
  )

  return (
    <div style={{ minHeight: '100vh', background: '#060606', color: 'white', paddingTop: '60px', display: 'flex' }}>

      {/* Sidebar gauche */}
      <div style={{ width: '320px', borderRight: '1px solid rgba(255,255,255,0.07)', display: 'flex', flexDirection: 'column', height: 'calc(100vh - 60px)', position: 'sticky', top: '60px' }}>

        {/* Tabs */}
        <div style={{ display: 'flex', padding: '16px', gap: '4px', borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
          {[
            { key: 'messages', label: '💬' },
            { key: 'friends', label: '👥' },
            { key: 'new', label: '✏️' },
          ].map(t => (
            <button key={t.key} onClick={() => setTab(t.key as any)} style={{
              flex: 1, padding: '10px', borderRadius: '10px', border: 'none', cursor: 'pointer',
              fontSize: '18px',
              background: tab === t.key ? '#E63946' : 'rgba(255,255,255,0.04)',
              color: 'white',
            }}>{t.label}</button>
          ))}
        </div>

        {/* Messages tab */}
        {tab === 'messages' && (
          <div style={{ flex: 1, overflowY: 'auto' }}>
            {conversations.length === 0 ? (
              <div style={{ padding: '40px', textAlign: 'center', color: 'rgba(255,255,255,0.3)' }}>
                <p style={{ fontSize: '32px', marginBottom: '12px' }}>💬</p>
                <p>Aucune conversation</p>
              </div>
            ) : (
              conversations.map(conv => (
                <div key={conv.id} onClick={() => openConversation(conv)}
                  style={{
                    padding: '16px 20px', cursor: 'pointer', borderBottom: '1px solid rgba(255,255,255,0.04)',
                    background: activeConv?.id === conv.id ? 'rgba(230,57,70,0.08)' : 'transparent',
                    display: 'flex', alignItems: 'center', gap: '12px',
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.04)'}
                  onMouseLeave={e => e.currentTarget.style.background = activeConv?.id === conv.id ? 'rgba(230,57,70,0.08)' : 'transparent'}
                >
                  <div style={{ width: 44, height: 44, borderRadius: '50%', background: conv.type === 'group' ? '#a855f7' : '#E63946', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, flexShrink: 0 }}>
                    {conv.type === 'group' ? '👥' : getConvName(conv)[0]?.toUpperCase()}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontWeight: 700, fontSize: '14px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{getConvName(conv)}</p>
                    <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.3)' }}>
                      {conv.type === 'group' ? `${conv.conversation_members?.length} membres` : 'Message privé'}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* Friends tab */}
        {tab === 'friends' && (
          <div style={{ flex: 1, overflowY: 'auto', padding: '16px' }}>
            {pendingRequests.length > 0 && (
              <div style={{ marginBottom: '20px' }}>
                <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)', fontWeight: 700, marginBottom: '10px' }}>DEMANDES EN ATTENTE</p>
                {pendingRequests.map((f: any) => (
                  <div key={f.id} style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
                    <div style={{ width: 36, height: 36, borderRadius: '50%', background: '#E63946', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 900 }}>
                      {f.sender?.username?.[0]?.toUpperCase()}
                    </div>
                    <span style={{ flex: 1, fontSize: '14px', fontWeight: 600 }}>{f.sender?.username}</span>
                    <button onClick={() => acceptFriend(f.id, f.sender_id)} style={{ padding: '6px 12px', borderRadius: '8px', border: 'none', background: '#00ff87', color: '#000', fontWeight: 700, cursor: 'pointer', fontSize: '12px' }}>✓</button>
                  </div>
                ))}
              </div>
            )}

            <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)', fontWeight: 700, marginBottom: '10px' }}>MES AMIS ({acceptedFriends.length})</p>
            {acceptedFriends.length === 0 ? (
              <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: '13px', textAlign: 'center', padding: '20px' }}>Aucun ami pour l'instant</p>
            ) : (
              acceptedFriends.map((f: any) => {
                const friend = f.sender_id === user.id ? f.receiver : f.sender
                return (
                  <div key={f.id} style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
                    <div style={{ width: 36, height: 36, borderRadius: '50%', background: '#E63946', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 900 }}>
                      {friend?.username?.[0]?.toUpperCase()}
                    </div>
                    <span style={{ flex: 1, fontSize: '14px', fontWeight: 600 }}>{friend?.username}</span>
                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#00ff87' }} />
                  </div>
                )
              })
            )}
          </div>
        )}

        {/* New tab */}
        {tab === 'new' && (
          <div style={{ flex: 1, overflowY: 'auto', padding: '16px' }}>
            <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)', fontWeight: 700, marginBottom: '10px' }}>AJOUTER UN AMI</p>
            <input placeholder="Recherche par pseudo..." value={searchUser} onChange={e => searchUsers(e.target.value)}
              style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.04)', color: 'white', fontSize: '13px', outline: 'none', marginBottom: '10px', boxSizing: 'border-box' }} />
            {searchResults.map(u => (
              <div key={u.id} style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                <div style={{ width: 36, height: 36, borderRadius: '50%', background: '#3b82f6', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 900 }}>
                  {u.username?.[0]?.toUpperCase()}
                </div>
                <span style={{ flex: 1, fontSize: '14px', fontWeight: 600 }}>{u.username}</span>
                <button onClick={() => sendFriendRequest(u.id)} style={{ padding: '6px 12px', borderRadius: '8px', border: 'none', background: '#E63946', color: 'white', fontWeight: 700, cursor: 'pointer', fontSize: '12px' }}>+ Ajouter</button>
              </div>
            ))}

            <div style={{ height: '1px', background: 'rgba(255,255,255,0.06)', margin: '20px 0' }} />

            <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)', fontWeight: 700, marginBottom: '10px' }}>CRÉER UN GROUPE</p>
            <input placeholder="Nom du groupe..." value={groupName} onChange={e => setGroupName(e.target.value)}
              style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.04)', color: 'white', fontSize: '13px', outline: 'none', marginBottom: '10px', boxSizing: 'border-box' }} />

            <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)', marginBottom: '8px' }}>Ajouter des amis :</p>
            {acceptedFriends.map((f: any) => {
              const friend = f.sender_id === user.id ? f.receiver : f.sender
              const isSelected = selectedForGroup.find(s => s.id === friend?.id)
              return (
                <div key={f.id} onClick={() => {
                  if (isSelected) setSelectedForGroup(prev => prev.filter(s => s.id !== friend.id))
                  else setSelectedForGroup(prev => [...prev, friend])
                }} style={{
                  display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px',
                  padding: '8px 12px', borderRadius: '10px', cursor: 'pointer',
                  background: isSelected ? 'rgba(230,57,70,0.1)' : 'rgba(255,255,255,0.02)',
                  border: `1px solid ${isSelected ? '#E63946' : 'rgba(255,255,255,0.06)'}`,
                }}>
                  <div style={{ width: 32, height: 32, borderRadius: '50%', background: '#E63946', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 900 }}>
                    {friend?.username?.[0]?.toUpperCase()}
                  </div>
                  <span style={{ flex: 1, fontSize: '13px', fontWeight: 600 }}>{friend?.username}</span>
                  {isSelected && <span style={{ color: '#E63946' }}>✓</span>}
                </div>
              )
            })}

            {groupName && selectedForGroup.length > 0 && (
              <button onClick={createGroup} disabled={creating} style={{
                width: '100%', marginTop: '12px', padding: '12px', borderRadius: '10px', border: 'none',
                background: '#E63946', color: 'white', fontWeight: 700, cursor: 'pointer', fontSize: '14px',
              }}>
                {creating ? '...' : `Créer le groupe (${selectedForGroup.length + 1} membres)`}
              </button>
            )}
          </div>
        )}
      </div>

      {/* Zone de messages */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', height: 'calc(100vh - 60px)', position: 'sticky', top: '60px' }}>
        {activeConv ? (
          <>
            {/* Header conv */}
            <div style={{ padding: '16px 24px', borderBottom: '1px solid rgba(255,255,255,0.07)', display: 'flex', alignItems: 'center', gap: '14px' }}>
              <div style={{ width: 40, height: 40, borderRadius: '50%', background: activeConv.type === 'group' ? '#a855f7' : '#E63946', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}>
                {activeConv.type === 'group' ? '👥' : getConvName(activeConv)[0]?.toUpperCase()}
              </div>
              <div>
                <p style={{ fontWeight: 700, fontSize: '15px' }}>{getConvName(activeConv)}</p>
                <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.3)' }}>
                  {activeConv.type === 'group' ? `${activeConv.conversation_members?.length} membres` : 'En ligne'}
                </p>
              </div>
            </div>

            {/* Messages */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {messages.map(msg => {
                const isMe = msg.sender_id === user.id
                return (
                  <div key={msg.id} style={{ display: 'flex', justifyContent: isMe ? 'flex-end' : 'flex-start', gap: '8px', alignItems: 'flex-end' }}>
                    {!isMe && (
                      <div style={{ width: 28, height: 28, borderRadius: '50%', background: '#3b82f6', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 900, flexShrink: 0 }}>
                        {msg.profiles?.username?.[0]?.toUpperCase()}
                      </div>
                    )}
                    <div style={{ maxWidth: '70%' }}>
                      {!isMe && <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', marginBottom: '4px' }}>{msg.profiles?.username}</p>}
                      <div style={{
                        padding: '10px 14px', borderRadius: isMe ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                        background: isMe ? '#E63946' : 'rgba(255,255,255,0.08)',
                        fontSize: '14px', lineHeight: 1.5,
                      }}>
                        {msg.content}
                      </div>
                      <p style={{ fontSize: '10px', color: 'rgba(255,255,255,0.2)', marginTop: '4px', textAlign: isMe ? 'right' : 'left' }}>
                        {new Date(msg.created_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>
                )
              })}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div style={{ padding: '16px 24px', borderTop: '1px solid rgba(255,255,255,0.07)', display: 'flex', gap: '10px' }}>
              <input value={newMessage} onChange={e => setNewMessage(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendMessage()}
                placeholder="Écris un message..."
                style={{ flex: 1, padding: '12px 16px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.04)', color: 'white', fontSize: '14px', outline: 'none' }}
              />
              <button onClick={sendMessage} disabled={sending || !newMessage.trim()} style={{
                padding: '12px 20px', borderRadius: '12px', border: 'none',
                background: newMessage.trim() ? '#E63946' : 'rgba(255,255,255,0.06)',
                color: 'white', fontWeight: 700, cursor: 'pointer', fontSize: '14px',
              }}>
                {sending ? '...' : '→'}
              </button>
            </div>
          </>
        ) : (
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', color: 'rgba(255,255,255,0.3)' }}>
            <p style={{ fontSize: '48px', marginBottom: '16px' }}>💬</p>
            <p style={{ fontSize: '18px', fontWeight: 700, marginBottom: '8px' }}>Tes messages</p>
            <p style={{ fontSize: '14px' }}>Sélectionne une conversation ou ajoute un ami</p>
          </div>
        )}
      </div>
    </div>
  )
}