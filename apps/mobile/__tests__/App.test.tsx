/**
 * Smoke test: garante que o app renderiza sem crash.
 * Substituido por testes de feature conforme novas telas chegam.
 */

import { render } from '@testing-library/react-native';

import App from '../App';

describe('App', () => {
  it('renderiza sem crash', () => {
    const { toJSON } = render(<App />);
    expect(toJSON()).toBeTruthy();
  });
});
