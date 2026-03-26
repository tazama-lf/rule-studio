import React from 'react';
import { render, screen } from '@testing-library/react';

// Must be called before the component is imported.
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
import PrivateRoute from '../../../src/routes/PrivateRoute';

const mockedExtractData = extractData as jest.Mock;

const renderComponent = () => render(<PrivateRoute />);

describe('PrivateRoute (routes/PrivateRoute)', () => {
    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('when the user is authenticated', () => {
        it('should render the Outlet when a token is present', () => {
            mockedExtractData.mockReturnValue('valid-access-token');
            renderComponent();
            expect(screen.getByTestId('outlet')).toBeInTheDocument();
        });

        it('should NOT render Navigate when a token is present', () => {
            mockedExtractData.mockReturnValue('valid-access-token');
            renderComponent();
            expect(screen.queryByTestId('navigate')).not.toBeInTheDocument();
        });

        it('should call extractData with "access_token"', () => {
            mockedExtractData.mockReturnValue('tok');
            renderComponent();
            expect(mockedExtractData).toHaveBeenCalledWith('access_token');
        });
    });

    describe('when the user is NOT authenticated', () => {
        it('should render Navigate to /login when token is null', () => {
            mockedExtractData.mockReturnValue(null);
            renderComponent();
            const nav = screen.getByTestId('navigate');
            expect(nav).toBeInTheDocument();
            expect(nav).toHaveAttribute('data-to', '/login');
        });

        it('should render Navigate to /login when token is an empty string', () => {
            mockedExtractData.mockReturnValue('');
            renderComponent();
            // empty string is falsy, so Navigate renders instead of Outlet
            const nav = screen.getByTestId('navigate');
            expect(nav).toHaveAttribute('data-to', '/login');
        });

        it('should render Navigate to /login when token is undefined', () => {
            mockedExtractData.mockReturnValue(undefined);
            renderComponent();
            expect(screen.getByTestId('navigate')).toHaveAttribute('data-to', '/login');
        });

        it('should NOT render the Outlet when unauthenticated', () => {
            mockedExtractData.mockReturnValue(null);
            renderComponent();
            expect(screen.queryByTestId('outlet')).not.toBeInTheDocument();
        });

        it('should call extractData with "access_token"', () => {
            mockedExtractData.mockReturnValue(null);
            renderComponent();
            expect(mockedExtractData).toHaveBeenCalledWith('access_token');
        });
    });

    describe('extractData call behaviour', () => {
        it('should call extractData exactly once per render', () => {
            mockedExtractData.mockReturnValue('tok');
            renderComponent();
            expect(mockedExtractData).toHaveBeenCalledTimes(1);
        });
    });
});
