'use client'

import { ReactNode } from 'react'
import { Post } from '@/app/actions'

export default function Message({ post }: { post: Post }) {
  return (
    <div 
      className="border rounded-md overflow-hidden"
      style={{
        borderColor: 'rgba(42, 42, 42, 0.5)',
        background: 'rgba(31, 31, 31, 0.6)',
        backdropFilter: 'blur(10px)',
        WebkitBackdropFilter: 'blur(10px)',
      }}
    >
      <div className="grid grid-cols-[1fr_3fr] min-h-[100px]">
        <div 
          className="p-4 border-r font-bold text-white flex items-center justify-center"
          style={{
            background: 'rgba(26, 26, 26, 0.5)',
            backdropFilter: 'blur(8px)',
            WebkitBackdropFilter: 'blur(8px)',
            borderColor: 'rgba(42, 42, 42, 0.5)',
          }}
        >
          {post.author_name}
        </div>
        <div className="p-4 text-white whitespace-pre-wrap">
          {post.content_text}
        </div>
      </div>
    </div>
  )
}