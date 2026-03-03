// Mock for react-router-dom
export const mockNavigate = () => {};

export const useNavigate = () => mockNavigate;

export const useParams = () => ({ ruleId: 'test-rule-123' });

export const BrowserRouter = ({ children }: { children: React.ReactNode }) => <>{children}</>;

export const MemoryRouter = ({ children }: { children: React.ReactNode }) => <>{children}</>;
