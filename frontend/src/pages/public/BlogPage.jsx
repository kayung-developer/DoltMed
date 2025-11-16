import React, { useState, useEffect } from 'react';
import AnimatedWrapper from '../../components/common/AnimatedWrapper';
import toast from 'react-hot-toast';
import { aiService } from '../../services/api';
import { Link } from 'react-router-dom';
import { blogService } from '../../services/api';

const BlogCard = ({ post }) => (
    <Link to={`/blog/${post.id}`} className="block group">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg hover:shadow-xl transition-shadow duration-300">
            <h2 className="text-xl font-bold text-dortmed-700 dark:text-dortmed-300 group-hover:underline">{post.title}</h2>
            <p className="mt-4 text-gray-600 dark:text-gray-400 line-clamp-3">{post.content}</p>
            <span className="mt-4 inline-block text-sm font-semibold text-dortmed-600">Read More &rarr;</span>
        </div>
    </Link>
);

const BlogPage = () => {
    const [posts, setPosts] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchPosts = async () => {
            setLoading(true);
            try {
                const response = await blogService.getPublicPosts(); // Use the new public blog service
                setPosts(response.data);
            } catch (error) {
                toast.error("Could not load health articles.");
            } finally {
                setLoading(false);
            }
        };
        fetchPosts();
    }, []);

    return (
        <AnimatedWrapper>
            <div className="py-20 bg-gray-50 dark:bg-gray-800">
                <div className="container mx-auto px-6">
                    <div className="text-center">
                        <h1 className="text-4xl font-extrabold text-gray-900 dark:text-white">DortMed Health Hub</h1>
                        <p className="mt-4 max-w-3xl mx-auto text-lg text-gray-600 dark:text-gray-300">
                            Your source for trusted, expert-authored health information and wellness tips.
                        </p>
                    </div>

                    <div className="mt-16 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {loading ? <p>Loading articles...</p> : posts.map(post => <BlogCard key={post.id} post={post} />)}
                    </div>
                </div>
            </div>
        </AnimatedWrapper>
    );
};

export default BlogPage;