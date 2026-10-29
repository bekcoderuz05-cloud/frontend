"""Run with the Voha backend virtualenv from the backend project directory."""
import hashlib
import hmac
import importlib.util
import json
from pathlib import Path
import unittest
from urllib.parse import urlencode

spec = importlib.util.spec_from_file_location('telegram_auth', Path(__file__).with_name('telegram_auth.py'))
module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)
TOKEN = '12345:test-only-token'
NOW = 1800000000


def signed(**overrides):
    data = {'auth_date': str(NOW), 'user': json.dumps({'id': 123, 'first_name': 'Test'})}
    data.update(overrides)
    secret = hmac.new(b'WebAppData', TOKEN.encode(), hashlib.sha256).digest()
    check = '\n'.join(f'{k}={v}' for k, v in sorted(data.items()))
    data['hash'] = hmac.new(secret, check.encode(), hashlib.sha256).hexdigest()
    return urlencode(data)


class ValidationTests(unittest.TestCase):
    def test_valid(self):
        self.assertEqual(module.validate_init_data(signed(), TOKEN, NOW)['id'], 123)

    def test_forged_or_stale_or_future_or_duplicate(self):
        for raw in (signed().replace('123', '456'), signed(auth_date=str(NOW-301)),
                    signed(auth_date=str(NOW+31)), signed()+'&auth_date='+str(NOW)):
            with self.subTest(raw=raw), self.assertRaises((ValueError, KeyError)):
                module.validate_init_data(raw, TOKEN, NOW)

    def test_wrong_bot_and_missing_config(self):
        with self.assertRaises(ValueError):
            module.validate_init_data(signed(), 'wrong-bot', NOW)
        with self.assertRaises(module.HTTPException) as error:
            module.validate_init_data(signed(), '', NOW)
        self.assertEqual(error.exception.status_code, 503)


if __name__ == '__main__':
    unittest.main()
