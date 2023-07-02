import { css } from 'styled-components';

export enum Font {
    EPILOGUE = 'Epilogue',
    GOTHAM = 'Gotham',
    INTER = 'Inter',
    POPPINS = 'Poppins',
}

export const fontGotham = (weight?: number) => css`
    font-weight: ${weight || 400};
    font-family: Gotham, sans-serif;
`;

export const fontPoppins = (weight?: number) => css`
    font-weight: ${weight || 400};
    font-family: Poppins, sans-serif;
`;

export const fontInter = (weight?: number) => css`
    font-weight: ${weight || 400};
    font-family: Inter, sans-serif;
`;

export const fontEpilogue = (weight?: number) => css`
    font-weight: ${weight || 400};
    font-family: Epilogue, sans-serif;
`;
