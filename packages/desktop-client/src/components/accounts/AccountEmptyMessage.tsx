import { Trans } from 'react-i18next';

import { Button } from '@actual-app/components/button';
import { SvgPiggyBank } from '@actual-app/components/icons/v1';
import { theme } from '@actual-app/components/theme';
import { View } from '@actual-app/components/view';

import { EmptyState } from '#components/common/EmptyState';

type AccountEmptyMessageProps = {
  onAdd: () => void;
};

export function AccountEmptyMessage({ onAdd }: AccountEmptyMessageProps) {
  return (
    <View
      style={{
        color: theme.tableText,
        backgroundColor: theme.tableBackground,
        flex: 1,
        alignItems: 'center',
        borderTopWidth: 1,
        borderColor: theme.tableBorder,
      }}
    >
      <EmptyState
        icon={SvgPiggyBank}
        style={{ marginTop: 40 }}
        title={<Trans>Let's add your first account</Trans>}
        description={
          <Trans>
            Accounts hold your transactions, like everyday spending, savings,
            credit cards, or cash. You can connect to your bank to import
            transactions automatically, or add them yourself.
          </Trans>
        }
        actions={
          <Button variant="primary" autoFocus onPress={onAdd}>
            <Trans>Add account</Trans>
          </Button>
        }
        footnote={
          <Trans>You can add more accounts at any time from the sidebar.</Trans>
        }
      />
    </View>
  );
}
