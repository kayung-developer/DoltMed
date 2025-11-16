import React, { useState, useEffect, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { adminCmsService } from '../../services/api'; // This needs to be added to api.js
import AnimatedWrapper from '../../components/common/AnimatedWrapper';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import { PlusIcon, PencilIcon, TrashIcon } from '@heroicons/react/24/solid';

const ContentManagementPage = () => {
    const [posts, setPosts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [editingPost, setEditingPost] = useState(null);
    const { register, handleSubmit, reset, setValue } = useForm();

    const fetchPosts = useCallback(async () => {
        setLoading(true);
        try {
            const response = await adminCmsService.listPosts();
            setPosts(response.data);
        } catch (error) { toast.error("Could not load posts."); }
        finally { setLoading(false); }
    }, []);

    useEffect(() => { fetchPosts(); }, [fetchPosts]);

    useEffect(() => {
        if (editingPost) {
            setValue("title", editingPost.title);
            setValue("content", editingPost.content);
        } else {
            reset({ title: "", content: "" });
        }
    }, [editingPost, setValue, reset]);

    const onSubmit = async (data) => {
        try {
            if (editingPost) {
                await adminCmsService.updatePost(editingPost.id, data);
                toast.success("Post updated successfully.");
            } else {
                await adminCmsService.createPost(data);
                toast.success("Post created successfully.");
            }
            setEditingPost(null);
            fetchPosts();
        } catch (error) { toast.error("Failed to save post."); }
    };

    const handleDelete = async (postId) => {
        if(window.confirm("Are you sure you want to delete this post?")) {
            try {
                await adminCmsService.deletePost(postId);
                toast.success("Post deleted.");
                fetchPosts();
            } catch (error) { toast.error("Failed to delete post."); }
        }
    };

    return (
        <AnimatedWrapper>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Editor Form */}
                <div className="lg:col-span-1 bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
                    <h2 className="text-2xl font-bold">{editingPost ? "Edit Post" : "Create New Post"}</h2>
                    <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-4">
                        <Input label="Title" {...register('title', { required: true })} />
                        <div>
                            <label className="block text-sm font-medium">Content</label>
                            <textarea {...register('content', { required: true })} rows="10" className="input-base mt-1" />
                        </div>
                        <div className="flex space-x-2">
                             <Button type="submit" className="flex-grow">{editingPost ? "Update Post" : "Create Post"}</Button>
                             {editingPost && <Button variant="secondary" onClick={() => setEditingPost(null)}>Cancel</Button>}
                        </div>
                    </form>
                </div>
                {/* Post List */}
                <div className="lg:col-span-2 bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
                    <h2 className="text-2xl font-bold">Health Hub Posts</h2>
                    <ul className="mt-6 divide-y dark:divide-gray-700">
                        {loading ? <p>Loading...</p> : posts.map(post => (
                            <li key={post.id} className="py-4 flex justify-between items-center">
                                <div>
                                    <p className="font-semibold">{post.title}</p>
                                    <p className="text-xs text-gray-500">By {post.author_email} on {new Date(post.created_at).toLocaleDateString()}</p>
                                </div>
                                <div className="flex space-x-2">
                                    <Button variant="ghost" onClick={() => setEditingPost(post)}><PencilIcon className="w-5 h-5"/></Button>
                                    <Button variant="ghost" onClick={() => handleDelete(post.id)}><TrashIcon className="w-5 h-5 text-danger"/></Button>
                                </div>
                            </li>
                        ))}
                    </ul>
                </div>
            </div>
        </AnimatedWrapper>
    );
};

export default ContentManagementPage;