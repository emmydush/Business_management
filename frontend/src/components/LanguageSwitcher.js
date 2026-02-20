import React, { useState, useEffect } from 'react';
import { Dropdown, Nav } from 'react-bootstrap';
import { useI18n } from '../i18n/I18nProvider';

const LanguageSwitcher = ({ onChange }) => {
  const { locale, setLocale } = useI18n();

  const change = (newLocale) => {
    setLocale(newLocale);
    if (onChange) onChange(newLocale);
  };

  return (
    <Nav className="ms-3 align-items-center">
      <Dropdown align="end">
        <Dropdown.Toggle variant="link" className="text-white border-0 px-3">
          {locale.toUpperCase()}
        </Dropdown.Toggle>

        <Dropdown.Menu>
          <Dropdown.Item active={locale === 'en'} onClick={() => change('en')}>English</Dropdown.Item>
          <Dropdown.Item active={locale === 'fr'} onClick={() => change('fr')}>Français</Dropdown.Item>
        </Dropdown.Menu>
      </Dropdown>
    </Nav>
  );
};

export default LanguageSwitcher;
