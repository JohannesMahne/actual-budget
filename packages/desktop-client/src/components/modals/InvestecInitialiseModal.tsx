import React, { useState } from 'react';
import { Trans, useTranslation } from 'react-i18next';

import { ButtonWithLoading } from '@actual-app/components/button';
import { Input } from '@actual-app/components/input';
import { Text } from '@actual-app/components/text';
import { View } from '@actual-app/components/view';
import { send } from '@actual-app/core/platform/client/connection';

import { Error as ErrorAlert } from '#components/alerts';
import { Link } from '#components/common/Link';
import {
  Modal,
  ModalButtons,
  ModalCloseButton,
  ModalHeader,
} from '#components/common/Modal';
import { FormField, FormLabel } from '#components/forms';
import type { Modal as ModalType } from '#modals/modalsSlice';
import { getSecretsError } from '#util/error';

type InvestecInitialiseModalProps = Extract<
  ModalType,
  { name: 'investec-init' }
>['options'];

export const InvestecInitialiseModal = ({
  onSuccess,
}: InvestecInitialiseModalProps) => {
  const { t } = useTranslation();
  const [clientId, setClientId] = useState('');
  const [clientSecret, setClientSecret] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [isValid, setIsValid] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(
    t('A client ID, client secret and API key are all required.'),
  );

  const onSubmit = async (close: () => void) => {
    if (!clientId || !clientSecret || !apiKey) {
      setIsValid(false);
      return;
    }

    setIsLoading(true);

    const secrets = [
      { name: 'investec_clientId', value: clientId.trim() },
      { name: 'investec_clientSecret', value: clientSecret.trim() },
      { name: 'investec_apiKey', value: apiKey.trim() },
    ];

    for (const secret of secrets) {
      const { error, reason } = (await send('secret-set', secret)) || {};
      if (error) {
        setIsValid(false);
        setError(getSecretsError(error, reason));
        setIsLoading(false);
        return;
      }
    }

    setIsLoading(false);
    onSuccess();
    close();
  };

  return (
    <Modal name="investec-init" containerProps={{ style: { width: 360 } }}>
      {({ state }) => (
        <>
          <ModalHeader
            title={t('Set up Investec')}
            rightContent={<ModalCloseButton onPress={() => state.close()} />}
          />
          <View style={{ display: 'flex', gap: 10 }}>
            <Text>
              <Trans>
                Bank sync via Investec Programmable Banking works for Investec
                Private Bank accounts in South Africa. In Investec Online, go to{' '}
                <strong>
                  Manage → Investec Developer → Individual Connections
                </strong>{' '}
                to find your client ID and secret, then create an API key with
                read access to the accounts you want to sync.{' '}
                <Link
                  variant="external"
                  to="https://developer.investec.com/individuals"
                  linkColor="purple"
                >
                  Learn more
                </Link>
                .
              </Trans>
            </Text>

            <FormField>
              <FormLabel title={t('Client ID:')} htmlFor="clientId-field" />
              <Input
                id="clientId-field"
                type="password"
                value={clientId}
                onChangeValue={value => {
                  setClientId(value);
                  setIsValid(true);
                }}
              />
            </FormField>

            <FormField>
              <FormLabel
                title={t('Client secret:')}
                htmlFor="clientSecret-field"
              />
              <Input
                id="clientSecret-field"
                type="password"
                value={clientSecret}
                onChangeValue={value => {
                  setClientSecret(value);
                  setIsValid(true);
                }}
              />
            </FormField>

            <FormField>
              <FormLabel title={t('API key:')} htmlFor="apiKey-field" />
              <Input
                id="apiKey-field"
                type="password"
                value={apiKey}
                onChangeValue={value => {
                  setApiKey(value);
                  setIsValid(true);
                }}
              />
            </FormField>

            {!isValid && <ErrorAlert>{error}</ErrorAlert>}
          </View>

          <ModalButtons>
            <ButtonWithLoading
              variant="primary"
              autoFocus
              isLoading={isLoading}
              onPress={() => {
                void onSubmit(() => state.close());
              }}
            >
              <Trans>Save and continue</Trans>
            </ButtonWithLoading>
          </ModalButtons>
        </>
      )}
    </Modal>
  );
};
