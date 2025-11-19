'use client'

import { ReactNode } from 'react'
import { Post } from '@/app/actions'

export default function Message({ post }: { post: Post }) {
  return (
    <div className="border border-stone-600 rounded-md overflow-hidden bg-neutral-900">
      <div className="grid grid-cols-[1fr_3fr] min-h-[100px]">
        <div className="bg-neutral-800 p-4 border-r border-stone-700 font-bold text-white flex items-center justify-center">
          {post.author_name}
        </div>
        <div className="p-4 text-white whitespace-pre-wrap">
          {post.content_text}
        </div>
      </div>
    </div>
  )
}