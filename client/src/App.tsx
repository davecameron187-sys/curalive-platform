import { Switch, Route } from "wouter";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/trpc";
import { ClerkProvider } from "@clerk/clerk-react";
import { Toaster } from "sonner";
import ShadowMode from "./pages/ShadowMode";
import CustomerDashboard from "./pages/CustomerDashboard";
import CustomerProfile from "./pages/CustomerProfile";
import CustomerRoute from "./components/CustomerRoute";

const CLERK_PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

function Router() {
  return (
    <Switch>
      <Route path="/shadow-mode" component={ShadowMode} />
      <Route path="/customer/dashboard">
        {() => <CustomerRoute><CustomerDashboard /></CustomerRoute>}
      </Route>
      <Route path="/customer/profile">
        {() => <CustomerRoute><CustomerProfile /></CustomerRoute>}
      </Route>
      <Route path="/sign-in">
        {() => <div>Sign In</div>}
      </Route>
      <Route>
        {() => <div style={{color:'white',padding:'40px'}}>CuraLive</div>}
      </Route>
    </Switch>
  );
}

function App() {
  return (
    <ClerkProvider publishableKey={CLERK_PUBLISHABLE_KEY}>
      <QueryClientProvider client={queryClient}>
        <Router />
        <Toaster />
      </QueryClientProvider>
    </ClerkProvider>
  );
}

export default App;
