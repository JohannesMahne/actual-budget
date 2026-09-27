import React from 'react';
import type { CSSProperties } from 'react';

import { css } from '@emotion/css';

import { theme } from './theme';
import { View } from './View';

type ToggleProps = {
  id: string;
  isOn: boolean;
  isDisabled?: boolean;
  onToggle?: (isOn: boolean) => void;
  className?: string;
  style?: CSSProperties;
  'aria-label'?: string;
};

export const Toggle = ({
  id,
  isOn,
  isDisabled = false,
  onToggle,
  className,
  style,
  'aria-label': ariaLabel,
}: ToggleProps) => {
  return (
    <View style={style} className={className}>
      <input
        id={id}
        aria-label={ariaLabel}
        checked={isOn}
        disabled={isDisabled}
        onChange={e => onToggle?.(e.target.checked)}
        className={css({
          position: 'absolute',
          opacity: 0,
          width: 1,
          height: 1,
          margin: 0,
          pointerEvents: 'none',
          '&:focus-visible + label': {
            boxShadow: `0 0 0 3px ${theme.focusRing}`,
          },
        })}
        type="checkbox"
      />
      {/* oxlint-disable-next-line eslint-plugin-jsx-a11y(label-has-associated-control) */}
      <label
        data-toggle-container
        data-on={isOn}
        className={String(
          css({
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            cursor: isDisabled ? 'not-allowed' : 'pointer',
            width: '34px',
            height: '20px',
            borderRadius: '100px',
            position: 'relative',
            transition: 'background-color .2s',
            backgroundColor: isOn
              ? theme.checkboxToggleBackgroundSelected
              : theme.checkboxToggleBackground,
          }),
        )}
        htmlFor={id}
      >
        <span
          data-toggle
          data-on={isOn}
          className={css(
            {
              content: '" "',
              position: 'absolute',
              top: '2px',
              left: '2px',
              width: '16px',
              height: '16px',
              borderRadius: '100px',
              transition: '0.2s',
              boxShadow: '0 1px 2px 0 rgba(16, 24, 40, 0.2)',
              backgroundColor: isDisabled
                ? theme.checkboxToggleDisabled
                : '#fff',
            },
            isOn && {
              left: 'calc(100% - 2px)',
              transform: 'translateX(-100%)',
            },
          )}
        />
      </label>
    </View>
  );
};
