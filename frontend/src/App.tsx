import { BrowserRouter } from "react-router-dom";
import { AdThemeProvider } from "./common/ad";
import AppRoutes from "./routes/AppRoutes";
import { AuthProvider } from "./common/auth/AuthContext";
import ScreenProtection from "./common/security/ScreenProtection";

function App() {
  return (
    <AdThemeProvider>
      <AuthProvider>
        <ScreenProtection />
        <BrowserRouter>
          <AppRoutes />
        </BrowserRouter>
      </AuthProvider>
    </AdThemeProvider>
  );
}

export default App;
