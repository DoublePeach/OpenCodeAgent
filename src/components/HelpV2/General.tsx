import { c as _c } from "react/compiler-runtime";
import * as React from 'react';
import { t } from '../../i18n/index.js';
import { Box, Text } from '../../ink.js';
import { PromptInputHelpMenu } from '../PromptInput/PromptInputHelpMenu.js';
export function General() {
  // Do NOT memoize: description and shortcuts label are locale-reactive
  const description = t('help.general.description');
  const shortcutsLabel = t('help.general.shortcuts');
  return (
    <Box flexDirection="column" paddingY={1} gap={1}>
      <Box><Text>{description}</Text></Box>
      <Box flexDirection="column">
        <Box><Text bold={true}>{shortcutsLabel}</Text></Box>
        <PromptInputHelpMenu gap={2} fixedWidth={true} />
      </Box>
    </Box>
  );
}
