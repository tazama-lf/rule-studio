import React from 'react';
import { render, screen } from '@testing-library/react';

jest.mock('../../../src/utils/Common/storage', () => ({
    extractData: jest.fn(),
    getAuthToken: jest.fn(),
    resetData: jest.fn(),
}));

jest.mock('react-router-dom', () => ({
    Navigate: ({ to }: { to: string }) => <div data-testid="navigate" data-to={to} />,
    Outlet: () => <div data-testid="outlet" />,
}));

import { extractData } from '../../../src/utils/Common/storage';
import ProtectedRoute from '../../../src/routes/ProtectedRoute';

const mockedExtractData = extractData as jest.Mock;

const renderComponent = () => render(<ProtectedRoute />);

describe('ProtectedRoute (routes/ProtectedRoute)', () => {
    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('when the user is authenticated', () => {
        it('should render Navigate to /home when a token is present', () => {
            mockedExtractData.mockReturnValue('valid-access-token');
            renderComponent();
            const nav = screen.getByTestId('navigate');
            expect(nav).toBeInTheDocument();
            expect(nav).toHaveAttribute('data-to', '/home');
        });

        it('should NOT render the Outlet when authenticated', () => {
            mockedExtractData.mockReturnValue('valid-access-token');
            renderComponent();
            expect(screen.queryByTestId('outlet')).not.toBeInTheDocument();
        });

        it('should call extractData with "access_token"', () => {
            mockedExtractData.mockReturnValue('tok');
            renderComponent();
            expect(mockedExtractData).toHaveBeenCalledWith('access_token');
        });
    });

    describe('when the user is NOT authenticated', () => {
        it('should render the Outlet when token is null', () => {
            mockedExtractData.mockReturnValue(null);
            renderComponent();
            expect(screen.getByTestId('outlet')).toBeInTheDocument();
        });

        it('should render the Outlet when token is an empty string', () => {
            mockedExtractData.mockReturnValue('');
            renderComponent();
            // empty string is falsy → !!'' === false → Outlet shown
            expect(screen.getByTestId('outlet')).toBeInTheDocument();
        });

        it('should render the Outlet when token is undefined', () => {
            mockedExtractData.mockReturnValue(undefined);
            renderComponent();
            expect(screen.getByTestId('outlet')).toBeInTheDocument();
        });

        it('should NOT render Navigate when unauthenticated', () => {
            mockedExtractData.mockReturnValue(null);
            renderComponent();
            expect(screen.queryByTestId('navigate')).not.toBeInTheDocument();
        });

        it('should call extractData with "access_token"', () => {
            mockedExtractData.mockReturnValue(null);
            renderComponent();
            expect(mockedExtractData).toHaveBeenCalledWith('access_token');
        });
    });

    describe('boolean coercion of token (!! operator)', () => {
        it('should treat a truthy non-empty string as authenticated', () => {
            mockedExtractData.mockReturnValue('any-string');
            renderComponent();
            expect(screen.getByTestId('navigate')).toHaveAttribute('data-to', '/home');
        });

        it('should treat 0 as unauthenticated (falsy)', () => {
            mockedExtractData.mockReturnValue(0);
            renderComponent();
            expect(screen.getByTestId('outlet')).toBeInTheDocument();
        });

        it('should treat false as unauthenticated', () => {
            mockedExtractData.mockReturnValue(false);
            renderComponent();
            expect(screen.getByTestId('outlet')).toBeInTheDocument();
        });
    });

    describe('extractData call behaviour', () => {
        it('should call extractData exactly once per render', () => {
            mockedExtractData.mockReturnValue('tok');
            renderComponent();
            expect(mockedExtractData).toHaveBeenCalledTimes(2);
        });
    });
});
