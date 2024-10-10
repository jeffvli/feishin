import type { ICellRendererParams } from '@ag-grid-community/core';
import { Text } from '/@/renderer/components/text';
import { CellContainer } from '/@/renderer/components/virtual-table/cells/generic-cell';

// const AnimatedSvg = () => {
//     return (
//         <div style={{ height: '1rem', transform: 'rotate(180deg)', width: '1rem' }}>
//             <svg
//                 viewBox="100 130 57 80"
//                 xmlns="http://www.w3.org/2000/svg"
//             >
//                 <g>
//                     <rect
//                         fill="var(--primary-color)"
//                         height="80"
//                         id="bar-1"
//                         width="12"
//                         x="100"
//                         y="130"
//                     >
//                         <animate
//                             attributeName="height"
//                             begin="0.1s"
//                             calcMode="spline"
//                             dur="0.95s"
//                             keySplines="0.42 0 0.58 1; 0.42 0 0.58 1"
//                             keyTimes="0; 0.47368; 1"
//                             repeatCount="indefinite"
//                             values="80;15;80"
//                         />
//                     </rect>
//                     <rect
//                         fill="var(--primary-color)"
//                         height="80"
//                         id="bar-2"
//                         width="12"
//                         x="115"
//                         y="130"
//                     >
//                         <animate
//                             attributeName="height"
//                             begin="0.1s"
//                             calcMode="spline"
//                             dur="0.95s"
//                             keySplines="0.45 0 0.55 1; 0.45 0 0.55 1"
//                             keyTimes="0; 0.44444; 1"
//                             repeatCount="indefinite"
//                             values="25;80;25"
//                         />
//                     </rect>
//                     <rect
//                         fill="var(--primary-color)"
//                         height="80"
//                         id="bar-3"
//                         width="12"
//                         x="130"
//                         y="130"
//                     >
//                         <animate
//                             attributeName="height"
//                             begin="0.1s"
//                             calcMode="spline"
//                             dur="0.85s"
//                             keySplines="0.65 0 0.35 1; 0.65 0 0.35 1"
//                             keyTimes="0; 0.42105; 1"
//                             repeatCount="indefinite"
//                             values="80;10;80"
//                         />
//                     </rect>
//                     <rect
//                         fill="var(--primary-color)"
//                         height="80"
//                         id="bar-4"
//                         width="12"
//                         x="145"
//                         y="130"
//                     >
//                         <animate
//                             attributeName="height"
//                             begin="0.1s"
//                             calcMode="spline"
//                             dur="1.05s"
//                             keySplines="0.42 0 0.58 1; 0.42 0 0.58 1"
//                             keyTimes="0; 0.31579; 1"
//                             repeatCount="indefinite"
//                             values="30;80;30"
//                         />
//                     </rect>
//                 </g>
//             </svg>
//         </div>
//     );
// };

const StaticSvg = () => {
    return (
        <div style={{ height: '1rem', transform: 'rotate(180deg)', width: '1rem' }}>
            <svg
                viewBox="100 130 57 80"
                xmlns="http://www.w3.org/2000/svg"
            >
                <rect
                    fill="var(--primary-color)"
                    height="20"
                    width="12"
                    x="100"
                    y="130"
                />
                <rect
                    fill="var(--primary-color)"
                    height="60"
                    width="12"
                    x="115"
                    y="130"
                />
                <rect
                    fill="var(--primary-color)"
                    height="80"
                    width="12"
                    x="130"
                    y="130"
                />
                <rect
                    fill="var(--primary-color)"
                    height="45"
                    width="12"
                    x="145"
                    y="130"
                />
            </svg>
        </div>
    );
};

export const RowIndexCell = ({ value, eGridCell }: ICellRendererParams) => {
    const classList = eGridCell.classList;
    // const isFocused = classList.contains('focused');
    const isPlaying = classList.contains('playing');
    const isCurrentSong =
        classList.contains('current-song-cell') || classList.contains('current-playlist-song-cell');

    return (
        <CellContainer $position="right">
            {isPlaying && (isCurrentSong ? <StaticSvg /> : null)}
            <Text
                $secondary
                align="right"
                className="current-song-child current-song-index"
                overflow="hidden"
                size="md"
            >
                {value}
            </Text>
        </CellContainer>
    );
};
