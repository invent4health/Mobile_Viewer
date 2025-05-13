import './OHIFLogo.css';

import { Icon } from '@ohif/ui';
import React from 'react';

function OHIFLogo() {
  return (
    <>
      <Icon name="logo" className="header-logo" />

      <Icon name="radlogo" className="header-logo-text" />
    </>
  );
}

export default OHIFLogo;
