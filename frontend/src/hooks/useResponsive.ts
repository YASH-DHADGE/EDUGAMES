import { useWindowDimensions, ViewStyle, DimensionValue } from 'react-native';
import { breakpoints } from '../theme';

export const useResponsive = () => {
    const { width, height } = useWindowDimensions();

    const isMobile = width < breakpoints.mobile;
    const isTablet = width >= breakpoints.mobile && width < breakpoints.tablet;
    const isDesktop = width >= breakpoints.tablet;
    const isLandscape = width > height;

    // Dynamic values
    const numColumns = isDesktop ? 4 : isTablet ? 3 : 2;
    const maxContentWidth = 900;
    const formMaxWidth = isMobile ? width * 0.9 : 400;

    // Container styles for centering content
    const containerStyle: ViewStyle = {
        flexGrow: 1,
        width: '100%',
        maxWidth: (isMobile ? '100%' : maxContentWidth) as DimensionValue,
        alignSelf: 'center',
    };

    const centerContentStyle: ViewStyle = {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        width: '100%',
    };

    /**
     * Get responsive value based on screen size
     * @param mobile - Value for mobile
     * @param tablet - Value for tablet (optional)
     * @param desktop - Value for desktop (optional)
     */
    const responsiveValue = <T,>(mobile: T, tablet?: T, desktop?: T): T => {
        if (isMobile) return mobile;
        if (isTablet) return tablet ?? desktop ?? mobile;
        return desktop ?? tablet ?? mobile;
    };

    /**
     * Scale a value based on screen width
     * @param baseValue - Base value for mobile (375px width)
     * @param factor - Scaling factor (default 0.5)
     */
    const scale = (baseValue: number, factor: number = 0.5): number => {
        const baseWidth = 375;
        const scaleRatio = width / baseWidth;
        return baseValue + (scaleRatio - 1) * baseValue * factor;
    };

    /**
     * Get responsive padding
     * @param base - Base padding value
     */
    const getResponsivePadding = (base: number): number => {
        return responsiveValue(base, base * 1.25, base * 1.5);
    };

    /**
     * Get responsive margin
     * @param base - Base margin value
     */
    const getResponsiveMargin = (base: number): number => {
        return responsiveValue(base, base * 1.2, base * 1.4);
    };

    /**
     * Get responsive font size
     * @param base - Base font size
     */
    const getResponsiveFontSize = (base: number): number => {
        return responsiveValue(base, base * 1.1, base * 1.15);
    };

    /**
     * Get grid columns with custom breakpoints
     * @param mobile - Columns on mobile
     * @param tablet - Columns on tablet
     * @param desktop - Columns on desktop
     */
    const getGridColumns = (mobile: number = 2, tablet: number = 3, desktop: number = 4): number => {
        return responsiveValue(mobile, tablet, desktop);
    };

    return {
        // Screen info
        isMobile,
        isTablet,
        isDesktop,
        isLandscape,
        width,
        height,

        // Styles
        containerStyle,
        centerContentStyle,

        // Dynamic values
        numColumns,
        maxContentWidth,
        formMaxWidth,

        // Utility functions
        responsiveValue,
        scale,
        getResponsivePadding,
        getResponsiveMargin,
        getResponsiveFontSize,
        getGridColumns,
    };
};
