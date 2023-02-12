import React from 'react';
import { render, screen } from '@testing-library/react';
import App from '../src/App';
import { BrowserRouter } from 'react-router-dom';

test('Renders main page correctly', () => {
    render(<div>hello world</div>);
    expect(screen.getByText('hello world')).toBeTruthy();
});
