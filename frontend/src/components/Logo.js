import React from 'react';
import { motion } from 'framer-motion';

const Logo = ({ variant = 'full', size = 'medium', animated = true, className = '' }) => {
    // Size configurations
    const sizes = {
        small: { icon: 24, text: '0.9rem', container: 32 },
        medium: { icon: 36, text: '1.2rem', container: 36 },
        large: { icon: 48, text: '1.5rem', container: 48 }
    };

    const config = sizes[size] || sizes.medium;

    // Logo SVG - BusinessOS with Rwanda colors
    const LogoIcon = ({ width = config.icon, height = config.icon }) => (
        <svg width={width} height={height} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
            {/* Background B shape */}
            <path d="M20 10 L60 10 L60 45 L40 45 L40 55 L60 55 L60 90 L20 90 Z" fill="url(#gradient1)" />

            {/* Upward arrows representing growth */}
            <path d="M30 70 L40 50 L35 50 L35 75 L30 75 Z" fill="url(#gradient2)" opacity="0.9" />
            <path d="M45 60 L55 40 L50 40 L50 65 L45 65 Z" fill="url(#gradient3)" opacity="0.9" />
            <path d="M60 50 L70 30 L65 30 L65 55 L60 55 Z" fill="url(#gradient4)" opacity="0.9" />

            {/* Chart bars */}
            <rect x="25" y="65" width="8" height="20" rx="2" fill="url(#gradient5)" opacity="0.8" />
            <rect x="38" y="55" width="8" height="30" rx="2" fill="url(#gradient6)" opacity="0.8" />
            <rect x="51" y="45" width="8" height="40" rx="2" fill="url(#gradient7)" opacity="0.8" />

            {/* Gradients - Rwanda flag colors */}
            <defs>
                <linearGradient id="gradient1" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#00A1DE" /> {/* Sky Blue */}
                    <stop offset="50%" stopColor="#FAD201" /> {/* Golden Yellow */}
                    <stop offset="100%" stopColor="#00A651" /> {/* Green */}
                </linearGradient>
                <linearGradient id="gradient2" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="#00A1DE" />
                    <stop offset="100%" stopColor="#FAD201" />
                </linearGradient>
                <linearGradient id="gradient3" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="#FAD201" />
                    <stop offset="100%" stopColor="#00A651" />
                </linearGradient>
                <linearGradient id="gradient4" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="#00A1DE" />
                    <stop offset="100%" stopColor="#00A651" />
                </linearGradient>
                <linearGradient id="gradient5" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="#00A651" />
                    <stop offset="100%" stopColor="#FAD201" />
                </linearGradient>
                <linearGradient id="gradient6" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="#FAD201" />
                    <stop offset="100%" stopColor="#00A1DE" />
                </linearGradient>
                <linearGradient id="gradient7" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="#00A1DE" />
                    <stop offset="100%" stopColor="#00A651" />
                </linearGradient>
            </defs>
        </svg>
    );

    const iconContent = (
        <div
            className={`logo-icon-wrapper ${className}`}
            style={{
                width: config.container,
                height: config.container,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
            }}
        >
            <LogoIcon />
        </div>
    );

    if (variant === 'icon') {
        return animated ? (
            <motion.div
                whileHover={{ scale: 1.05, rotate: 2 }}
                transition={{ duration: 0.2 }}
            >
                {iconContent}
            </motion.div>
        ) : iconContent;
    }

    // Full logo with text
    return (
        <div className={`logo-container d-flex align-items-center ${className}`}>
            {animated ? (
                <motion.div
                    whileHover={{ scale: 1.05, rotate: 2 }}
                    transition={{ duration: 0.2 }}
                >
                    {iconContent}
                </motion.div>
            ) : iconContent}

            <span
                className="logo-text fw-bold ms-2"
                style={{
                    fontSize: config.text,
                    letterSpacing: '-0.5px',
                    whiteSpace: 'nowrap',
                    background: 'linear-gradient(135deg, #00A1DE 0%, #FAD201 50%, #00A651 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text'
                }}
            >
                BusinessOS
            </span>
        </div>
    );
};

export default Logo;
