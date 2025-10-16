'use client'

import { ReactNode } from 'react'
import { Post } from '@/app/actions'

export default function Message({post}: {post: Post}) {
  return (
    <div className="border border-stone-600 rounded-md overflow-hidden">
        <div className="grid grid-cols-2 grid-template-columns: 1fr 3fr grid-template-rows: 1fr 3fr height: 100vh ">
          <div className="col-span-1 col-start-1 bg-neutral-900 p-4">
              {post.author_name}
          </div>
          <div className="col-span-1 col-start-1 bg-neutral-950 p-4">
              {post.content_text}
          </div>
          <div className="col-span-1 col-start-2">

          </div>
      </div>
    </div>
  )
}