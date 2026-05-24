import React, { useCallback, useRef, useState } from 'react';

import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';

type PullToRefreshLabels = {
    pulling: string;
    release: string;
    refreshing: string;
};

type PullToRefreshProps = {
    onRefresh: () => unknown;
    children: React.ReactNode;
    className?: string;
    contentClassName?: string;
    indicatorClassName?: string;
    pullThreshold?: number;
    maxPullDistance?: number;
    applySafeAreaTop?: boolean;
};

export const PullToRefresh: React.FC<PullToRefreshProps> = ({
    onRefresh,
    children,
    className,
    contentClassName,
    indicatorClassName,
    pullThreshold = 100,
    maxPullDistance = 160,
    applySafeAreaTop = false,
}) => {
    const scrollRef = useRef<HTMLDivElement>(null);
    const startYRef = useRef<number | null>(null);
    const [pullDistance, setPullDistance] = useState(0);
    const [isDragging, setIsDragging] = useState(false);
    const [isRefreshing, setIsRefreshing] = useState(false);

    const labels: PullToRefreshLabels = {
        pulling: 'Pull to refresh\u2026',
        release: 'Release to refresh',
        refreshing: 'Fetching latest data\u2026',
    };

    const canStartPull = useCallback(() => {
        const container = scrollRef.current;
        return container ? container.scrollTop <= 0 : false;
    }, []);

    const beginPull = useCallback(
        (clientY: number) => {
            if (isRefreshing || !canStartPull()) return;
            startYRef.current = clientY;
            setIsDragging(true);
        },
        [canStartPull, isRefreshing]
    );

    const movePull = useCallback(
        (clientY: number, preventDefault?: () => void) => {
            if (!isDragging || isRefreshing || startYRef.current === null) return;
            const delta = clientY - startYRef.current;
            if (delta <= 0) return;
            if (preventDefault) preventDefault();
            const damped = Math.min(delta, maxPullDistance);
            setPullDistance(damped);
        },
        [isDragging, isRefreshing, maxPullDistance]
    );

    const endPull = useCallback(async () => {
        if (!isDragging) return;
        setIsDragging(false);
        startYRef.current = null;

        if (pullDistance >= pullThreshold) {
            setIsRefreshing(true);
            setPullDistance(pullThreshold);
            try {
                await Promise.resolve(onRefresh());
            } finally {
                setIsRefreshing(false);
                setPullDistance(0);
            }
            return;
        }

        setPullDistance(0);
    }, [isDragging, onRefresh, pullDistance, pullThreshold]);

    const indicatorText = isRefreshing
        ? labels.refreshing
        : pullDistance >= pullThreshold
            ? labels.release
            : labels.pulling;

    const indicatorOpacity = Math.min(pullDistance / pullThreshold, 1);

    return (
        <div
            ref={scrollRef}
            className={cn('relative h-full overflow-y-auto', applySafeAreaTop && 'pt-[env(safe-area-inset-top)]', className)}
            onTouchStart={event => beginPull(event.touches[0].clientY)}
            onTouchMove={event => movePull(event.touches[0].clientY, () => event.preventDefault())}
            onTouchEnd={endPull}
            onTouchCancel={endPull}
            onMouseDown={event => {
                if (event.button !== 0) return;
                beginPull(event.clientY);
            }}
            onMouseMove={event => {
                if (event.buttons !== 1) return;
                movePull(event.clientY, () => event.preventDefault());
            }}
            onMouseUp={endPull}
            onMouseLeave={endPull}
        >
            <div
                className={cn(
                    'relative transition-transform duration-200',
                    isDragging ? 'transition-none' : '',
                    contentClassName
                )}
                style={{ transform: `translateY(${pullDistance}px)` }}
            >
                <div
                    className={cn(
                        'absolute left-0 right-0 -top-10 flex items-center justify-center text-xs text-muted-foreground',
                        indicatorClassName
                    )}
                    style={{ opacity: indicatorOpacity }}
                    aria-live="polite"
                >
                    <div className="flex items-center gap-2 rounded-full bg-muted px-3 py-1">
                        {isRefreshing && <Loader2 className="size-3 animate-spin" />}
                        <span>{indicatorText}</span>
                    </div>
                </div>
                {children}
            </div>
        </div>
    );
};
