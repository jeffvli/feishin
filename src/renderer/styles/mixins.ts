import { css } from 'styled-components';

export const textEllipsis = css`
  white-space: nowrap;
  text-overflow: ellipsis;
`;

export const flexBetween = css`
  display: flex;
  flex-direction: row;
  justify-content: space-between;
`;

export const flexCenter = css`
  display: flex;
  align-items: center;
  justify-content: center;
`;

export const flexCenterColumn = css`
  ${flexCenter}
  flex-direction: column;
`;

export const coverBackground = css`
  background-repeat: no-repeat;
  background-position: center;
  background-size: cover;
`;

export const fadeIn = css`
  @keyframes fadein {
    from {
      opacity: 0;
    }

    to {
      opacity: 1;
    }
  }
`;

export const rotating = css`
  @keyframes rotating {
    from {
      transform: rotate(0deg);
    }

    to {
      transform: rotate(360deg);
    }
  }
`;
