import React from 'react';
import { Dropdown, Nav } from 'react-bootstrap';
import { useLanguage } from '../context/LanguageContext';
import rwandaGlobe from '../assets/images/rwanda_globe_icon.png';
import ukGlobe from '../assets/images/uk_globe_icon.png';
import franceGlobe from '../assets/images/france_globe_icon.png';

const LanguageSwitcher = ({ onChange, className }) => {
  const { locale, changeLocale } = useLanguage();

  const change = (newLocale) => {
    changeLocale(newLocale);
    if (onChange) onChange(newLocale);
  };

  return (
    <Nav className={`align-items-center ${className || 'ms-3'}`}>
      <Dropdown align="end">
        <Dropdown.Toggle variant="link" className="text-white border-0 px-3 text-decoration-none d-flex align-items-center">
          <span className="me-2 d-flex align-items-center">
            <img
              src={locale === 'rw' ? rwandaGlobe : locale === 'en' ? ukGlobe : franceGlobe}
              alt={locale.toUpperCase()}
              style={{ width: '24px', height: '24px', borderRadius: '50%', objectFit: 'cover' }}
            />
          </span>
          {locale.toUpperCase()}
        </Dropdown.Toggle>

        <Dropdown.Menu>
          <Dropdown.Item active={locale === 'en'} onClick={() => change('en')} className="d-flex align-items-center">
            <img src={ukGlobe} alt="EN" className="me-2" style={{ width: '20px', height: '20px', borderRadius: '50%', objectFit: 'cover' }} /> English
          </Dropdown.Item>
          <Dropdown.Item active={locale === 'rw'} onClick={() => change('rw')} className="d-flex align-items-center">
            <img src={rwandaGlobe} alt="RW" className="me-2" style={{ width: '20px', height: '20px', borderRadius: '50%', objectFit: 'cover' }} /> Kinyarwanda
          </Dropdown.Item>
          <Dropdown.Item active={locale === 'fr'} onClick={() => change('fr')} className="d-flex align-items-center">
            <img src={franceGlobe} alt="FR" className="me-2" style={{ width: '20px', height: '20px', borderRadius: '50%', objectFit: 'cover' }} /> Français
          </Dropdown.Item>
        </Dropdown.Menu>
      </Dropdown>
    </Nav>
  );
};

export default LanguageSwitcher;
