import Router, { Route, route } from 'preact-router';
import type { RouterOnChangeArgs } from 'preact-router';
import { appRoutes } from './appRoutes';
import { useRouterState } from './RouterState';
import { DesignSystemDemo } from '@/components/DesignSystemDemo/DesignSystemDemo';
import { PrivacyPolicy } from '@/components/PrivacyPolicy/PrivacyPolicy';
import { useAuth } from '@/hooks/useAuth';
import { useEffect } from 'preact/hooks';

function RouteNotFound() {
  return <div />;
}

function DesignSystemRoute(props: { ui?: string }) {
  return <DesignSystemDemo focusSection={props.ui} />;
}

function ProtectedRoute({ component: Component, ...rest }: any) {
  const { isAuthenticated, loading } = useAuth();

  useEffect(() => {
    if (!loading.value && !isAuthenticated.value) {
      route('/login', true);
    }
  }, [isAuthenticated.value, loading.value]);

  if (loading.value) return <div>Loading...</div>;
  return isAuthenticated.value ? <Component {...rest} /> : null;
}

export function AppRouter() {
  const { setPathname } = useRouterState();
  const { isAuthenticated } = useAuth();

  const handleRouteChange = (e: RouterOnChangeArgs) => {
    setPathname(e.url || '/');
  };

  return (
    <Router onChange={handleRouteChange}>
      {appRoutes
        .filter((r) => r.id !== 'design-system')
        .map((r) => {
          if (r.id === 'auth') {
            return <Route key={r.id} path={r.path} component={() => r.element} />;
          }
          return (
            <Route
              key={r.id}
              path={r.path}
              component={() => <ProtectedRoute component={() => r.element} />}
            />
          );
        })}

      <Route path="/design-system" component={(props: any) => <ProtectedRoute component={DesignSystemRoute} {...props} />} />
      <Route path="/design-system/:ui" component={(props: any) => <ProtectedRoute component={DesignSystemRoute} {...props} />} />

      <Route path="/legal/privacy-policy" component={PrivacyPolicy} />

      <Route default component={RouteNotFound} />
    </Router>
  );
}
