import { forwardRef } from 'react';
import type { ComponentProps } from 'react';

import { theme } from './theme';
import { radius, shadows } from './tokens';
import { View } from './View';

type CardProps = ComponentProps<typeof View>;

export const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ children, ...props }, ref) => {
    return (
      <View
        {...props}
        ref={ref}
        style={{
          marginTop: 15,
          marginLeft: 5,
          marginRight: 5,
          borderRadius: radius.lg,
          backgroundColor: theme.cardBackground,
          border: `1px solid ${theme.cardBorder}`,
          boxShadow: shadows.xs,
          ...props.style,
        }}
      >
        <View
          style={{
            borderRadius: radius.lg - 1,
            overflow: 'hidden',
          }}
        >
          {children}
        </View>
      </View>
    );
  },
);

Card.displayName = 'Card';
