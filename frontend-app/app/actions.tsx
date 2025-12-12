export type Post = {
    author_name: string;
    author_avatar_url?: string | null;
    categories?: Category[]; 
    content_text: string;
    post_id: number; 
    media_url: string | null;
    created_at: string;
    expires_at: string | null;
    pinned?: boolean;

    reaction_counts: {
        like_count: number;
        dislike_count: number;
    };
    user_reaction_type: 'like' | 'dislike' | null; 
};

export type Posts = Post[];

export type Comment = {
    post_id: number;
    comment_id: number;
    content_text: string;
    author_name: string;
    author_avatar_url?: string | null;
    created_at: string;
    parent_comment_id: number | null;
    reaction_counts?: {
        like_count: number;
        dislike_count: number;
    };
    user_reaction_type?: 'like' | 'dislike' | null;
}

export type Category = {
    category_id: number;
    category_name: string;
}

export type ReactionCount = {
    like_count: number;
    dislike_count: number;
}

