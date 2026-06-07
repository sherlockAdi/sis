import { BrowserRouter } from "react-router-dom";
import { AdThemeProvider } from "./common/ad";
import AppRoutes from "./routes/AppRoutes";
import { AuthProvider } from "./common/auth/AuthContext";
import ScreenProtection from "./common/security/ScreenProtection";

const ENABLE_SCREEN_PROTECTION = false;

function App() {
  return (
    <AdThemeProvider>
      <AuthProvider>
        {ENABLE_SCREEN_PROTECTION ? <ScreenProtection /> : null}
        <BrowserRouter>
          <AppRoutes />
        </BrowserRouter>
      </AuthProvider>
    </AdThemeProvider>
  );
}

export default App;
