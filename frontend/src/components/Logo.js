import React from 'react';
import { motion } from 'framer-motion';
import logoImg from '../assets/images/logo.png';

const Logo = ({ variant = 'full', size = 'medium', animated = true, className = '' }) => {
    // Size configurations (increased for perfect visibility)
    const sizes = {
        small: { container: 40 },
        medium: { container: 70 },
        large: { container: 120 },
        xlarge: { container: 200 }
    };

    const config = sizes[size] || sizes.medium;

    const iconContent = (
        <div
            className={`logo-image-container ${className}`}
            style={{
                width: variant === 'icon' ? config.container : 'auto',
                height: config.container,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                backgroundColor: '#ffffff',
                borderRadius: '8px',
                padding: '2px',
                boxShadow: '0 2px 10px rgba(0,0,0,0.05)'
            }}
        >
            <img 
                src={logoImg} 
                alt="afribuz logo" 
                style={{ 
                    height: '100%',
                    width: 'auto',
                    objectFit: 'contain',
                    display: 'block'
                }} 
            />
        </div>
    );

    const mainContent = (
        <div 
            className={`logo-display-wrapper ${className}`}
            style={{
                height: config.container,
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center'
            }}
        >
            {iconContent}
        </div>
    );

    if (!animated) return mainContent;

    return (
        <motion.div
            whileHover={{ scale: 1.05 }}
            transition={{ type: "spring", stiffness: 300 }}
            style={{ display: 'inline-block' }}
        >
            {mainContent}
        </motion.div>
    );
};

export default Logo;

