import { BrowserRouter } from "react-router-dom";
import { AdThemeProvider } from "./common/ad";
import AppRoutes from "./routes/AppRoutes";
import { AuthProvider } from "./common/auth/AuthContext";

function App() {
  return (
    <AdThemeProvider>
      <AuthProvider>
        <BrowserRouter>
          <AppRoutes />
        </BrowserRouter>
      </AuthProvider>
    </AdThemeProvider>
  );
}

export default App;
