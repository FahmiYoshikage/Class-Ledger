import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

/**
 * Universal Portal component.
 * Mounts children directly under document.body to escape any parent CSS container transforms,
 * filters, containing block traps, and clipping.
 * Automatically locks document.body scroll while mounted so background page doesn't scroll.
 */
const Portal = ({ children, lockScroll = true }) => {
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);

        if (lockScroll && typeof document !== 'undefined') {
            const originalOverflow = document.body.style.overflow;
            document.body.style.overflow = 'hidden';

            return () => {
                document.body.style.overflow = originalOverflow;
            };
        }
    }, [lockScroll]);

    if (!mounted || typeof document === 'undefined') return null;

    return createPortal(children, document.body);
};

export default Portal;
