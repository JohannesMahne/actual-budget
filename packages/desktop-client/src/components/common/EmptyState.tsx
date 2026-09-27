import React from 'react';
import type { ComponentType, CSSProperties, ReactNode, SVGProps } from 'react';

import { Text } from '@actual-app/components/text';
import { theme } from '@actual-app/components/theme';
import { radius } from '@actual-app/components/tokens';
import { View } from '@actual-app/components/view';

type EmptyStateProps = {
  icon?: ComponentType<SVGProps<SVGSVGElement>>;
  title: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
  footnote?: ReactNode;
  style?: CSSProperties;
};

export function EmptyState({
  icon: Icon,
  title,
  description,
  actions,
  footnote,
  style,
}: EmptyStateProps) {
  return (
    <View
      style={{
        alignItems: 'center',
        textAlign: 'center',
        padding: '48px 24px',
        gap: 12,
        color: theme.pageText,
        ...style,
      }}
    >
      {Icon && (
        <View
          style={{
            width: 48,
            height: 48,
            borderRadius: radius.lg,
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: theme.accentSubtle,
            color: theme.accent,
            marginBottom: 4,
          }}
        >
          <Icon width={22} height={22} />
        </View>
      )}
      <Text
        style={{
          fontSize: 16,
          fontWeight: 600,
          color: theme.pageTextDark,
          letterSpacing: '-0.01em',
        }}
      >
        {title}
      </Text>
      {description && (
        <Text
          style={{
            maxWidth: 460,
            fontSize: 13,
            lineHeight: 1.55,
            color: theme.pageTextLight,
          }}
        >
          {description}
        </Text>
      )}
      {actions && (
        <View
          style={{
            flexDirection: 'row',
            flexWrap: 'wrap',
            justifyContent: 'center',
            gap: 8,
            marginTop: 8,
          }}
        >
          {actions}
        </View>
      )}
      {footnote && (
        <Text style={{ fontSize: 12, color: theme.pageTextSubdued }}>
          {footnote}
        </Text>
      )}
    </View>
  );
}
