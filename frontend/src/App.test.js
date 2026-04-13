import { render, screen } from '@testing-library/react';
test('renders test environment', () => {
  render(<div>Frontend test environment OK</div>);
  expect(screen.getByText('Frontend test environment OK')).toBeInTheDocument();
});
