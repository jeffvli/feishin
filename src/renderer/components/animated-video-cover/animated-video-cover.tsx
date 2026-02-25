import HLS from 'hls.js';
import { HTMLMotionProps, motion } from 'motion/react';
import { forwardRef, useState, useEffect, useRef, SyntheticEvent } from 'react';

interface AnimatedVideoCoverProps extends Omit<HTMLMotionProps<'video'>, 'src' | 'onError'> {
    src?: string | null;
    staticImageUrl?: string;
    fallbackElement?: React.ReactNode;
    isPlaying?: boolean;
    onLoadError?: (error?: string) => void;
}

export const AnimatedVideoCover = forwardRef<HTMLVideoElement, AnimatedVideoCoverProps>(
    (
        { src, staticImageUrl, fallbackElement, isPlaying = true, className, onLoadError, ...props },
        ref,
    ) => {
        const [videoFailed, setVideoFailed] = useState(false);
        const hlsRef = useRef<HLS | null>(null);
        const timeoutRef = useRef<NodeJS.Timeout | null>(null);
        const isInitializingRef = useRef(false);

        useEffect(() => {
            if (!src || !ref || typeof ref === 'function' || videoFailed) return;
            if (isInitializingRef.current) return;

            const videoElement = ref.current;
            if (!videoElement) return;

            const isM3u8 = src.includes('.m3u8');
            if (!isM3u8 || !HLS.isSupported()) return;

            isInitializingRef.current = true;
            console.debug('AnimatedVideoCover Initializing HLS.js for m3u8 stream');

            // Cleanup any existing instance first
            if (hlsRef.current) {
                console.debug('AnimatedVideoCover Destroying existing HLS instance');
                hlsRef.current.destroy();
                hlsRef.current = null;
            }

            try {
                timeoutRef.current = setTimeout(() => {
                    console.warn('AnimatedVideoCover Initial manifest load timeout after 10s');
                    setVideoFailed(true);
                    isInitializingRef.current = false;
                }, 10000);

                const hls = new HLS({
                    autoStartLoad: true,
                    startPosition: -1,
                    debug: false,
                    enableWorker: true,
                    lowLatencyMode: false,
                });

                hls.loadSource(src);
                hls.attachMedia(videoElement);

                hls.on(HLS.Events.MANIFEST_PARSED, () => {
                    console.debug('AnimatedVideoCover HLS manifest loaded successfully');

                    if (timeoutRef.current) {
                        clearTimeout(timeoutRef.current);
                        timeoutRef.current = null;
                    }

                    if (isPlaying) {
                        videoElement.play().catch((e) => {
                            console.warn('AnimatedVideoCover autoplay failed:', e);
                        });
                    }
                    isInitializingRef.current = false;
                });

                hls.on(HLS.Events.ERROR, (_event, data) => {
                    if (!data.fatal) {
                        console.debug('AnimatedVideoCover HLS non-fatal error:', data.details);
                        return;
                    }

                    console.error('AnimatedVideoCover HLS fatal error:', data);
                    if (timeoutRef.current) {
                        clearTimeout(timeoutRef.current);
                        timeoutRef.current = null;
                    }
                    setVideoFailed(true);
                    isInitializingRef.current = false;
                    onLoadError?.(`HLS Error: ${data.type}`);
                });

                hlsRef.current = hls;
            } catch (error) {
                console.error('AnimatedVideoCover Error initializing HLS:', error);
                if (timeoutRef.current) {
                    clearTimeout(timeoutRef.current);
                    timeoutRef.current = null;
                }
                setVideoFailed(true);
                isInitializingRef.current = false;
                onLoadError?.('HLS initialization failed');
            }

            return () => {
                console.debug('AnimatedVideoCover Cleanup: destroying HLS instance');
                if (timeoutRef.current) {
                    clearTimeout(timeoutRef.current);
                    timeoutRef.current = null;
                }
                if (hlsRef.current) {
                    hlsRef.current.destroy();
                    hlsRef.current = null;
                }
                isInitializingRef.current = false;
            };
        }, [src, videoFailed]);

        const handleError = (event: SyntheticEvent<HTMLVideoElement, Event>) => {
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
                timeoutRef.current = null;
            }

            const errorMsg = event.nativeEvent.type || 'unknown error';
            const details = {
                src,
                errorType: errorMsg,
                message: 'Video failed to load',
            };

            console.warn('AnimatedVideoCover Video load failed:', details);
            setVideoFailed(true);
            onLoadError?.(errorMsg);
        };

        if (!src || videoFailed) {
            if (fallbackElement) {
                return <>{fallbackElement}</>;
            }
            if (staticImageUrl) {
                return (
                    <img
                        alt="Album cover"
                        className={className}
                        src={staticImageUrl}
                        style={{ width: '100%', height: '100%' }}
                    />
                );
            }
            return null;
        }

        return (
            <motion.video
                ref={ref}
                autoPlay={isPlaying}
                className={className}
                crossOrigin="anonymous"
                loop
                muted
                onError={handleError}
                playsInline
                {...props}
            />
        );
    },
);

AnimatedVideoCover.displayName = 'AnimatedVideoCover';
