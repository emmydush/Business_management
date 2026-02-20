import os
import json
import types
import pytest

import app.utils.momo as momo


class MockResponse:
    def __init__(self, status_code=200, json_data=None, text=''):
        self.status_code = status_code
        self._json = json_data or {}
        self.text = text

    def json(self):
        return self._json


def test_disburse_to_wallet_success(monkeypatch):
    # Provide minimal env vars required by get_momo_config
    monkeypatch.setenv('MOMO_API_USER', 'testuser')
    monkeypatch.setenv('MOMO_API_KEY', 'testkey')
    monkeypatch.setenv('MOMO_SUBSCRIPTION_KEY', 'testsubkey')
    monkeypatch.setenv('MOMO_ENVIRONMENT', 'sandbox')

    # Mock requests.post to handle both token generation and disbursement
    def mock_post(url, headers=None, json=None, timeout=30):
        if url.endswith('/collection/token/') or '/collection/token' in url:
            return MockResponse(200, {'access_token': 'fake-token', 'expires_in': 3600})
        if '/disbursement' in url or 'transfer' in url:
            return MockResponse(202, {'status': 'pending'})
        return MockResponse(500, {}, 'unknown')

    monkeypatch.setattr(momo.requests, 'post', mock_post)

    result = momo.disburse_to_wallet(amount=10.5, phone_number='250700000000', currency='EUR', payee_note='Test payroll')

    assert isinstance(result, dict)
    assert result.get('success') is True
    assert 'reference_id' in result
    assert result.get('status') in ('pending', 'accepted', 'initiated') or result.get('status') == 'pending'


def test_disburse_to_wallet_network_error(monkeypatch):
    monkeypatch.setenv('MOMO_API_USER', 'testuser')
    monkeypatch.setenv('MOMO_API_KEY', 'testkey')
    monkeypatch.setenv('MOMO_SUBSCRIPTION_KEY', 'testsubkey')

    def mock_post_raise(url, headers=None, json=None, timeout=30):
        raise momo.requests.exceptions.RequestException('network down')

    monkeypatch.setattr(momo.requests, 'post', mock_post_raise)

    result = momo.disburse_to_wallet(amount=5, phone_number='250700000001')
    assert result.get('success') is False
    assert 'error' in result
