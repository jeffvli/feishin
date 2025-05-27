import { Rating as MantineRating, RatingProps as MantineRatingProps } from '@mantine/core';
import debounce from 'lodash/debounce';
import { useCallback } from 'react';

import styles from './rating.module.css';

interface RatingProps extends MantineRatingProps {}

export const Rating = ({ classNames, onChange, style, ...props }: RatingProps) => {
    const valueChange = useCallback(
        (rating: number) => {
            if (onChange) {
                if (rating === props.value) {
                    onChange(0);
                } else {
                    onChange(rating);
                }
            }
        },
        [onChange, props.value],
    );

    const debouncedOnChange = debounce(valueChange, 100);

    return (
        <MantineRating
            classNames={{
                symbolBody: styles.symbolBody,
                ...classNames,
            }}
            style={{
                ...style,
            }}
            {...props}
            onChange={(e) => {
                debouncedOnChange(e);
            }}
            onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
            }}
        />
    );
};
